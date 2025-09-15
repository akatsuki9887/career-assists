import os
import tempfile
import logging
import datetime
from typing import Optional, Dict, List
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from fastapi import (APIRouter,UploadFile,File,HTTPException,Depends)
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.utils import (extract_text_from_pdf,extract_skills,match_jobs,generate_learning_plan,generate_evidence,JOBS)
from app.auth import get_current_user
from app.db import get_session
from app.models import Analysis, User, GitHubProfile
router = APIRouter(prefix="/api", tags=["resume"])
logger = logging.getLogger(__name__)
class GitHubToken(BaseModel):
    token: str
async def get_or_create_user(
    session: AsyncSession,
    email: str,
    name: Optional[str] = None,
    login: Optional[str] = None
) -> User:
    stmt = select(User).where(User.email == email)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        user = User(email=email, name=name)
        session.add(user)
        await session.commit()
        await session.refresh(user)
    return user
@router.post("/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    temp_path = None
    try:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Please upload a valid PDF file")

        data = await file.read()
        if len(data) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size must be less than 5MB")
        if b"%PDF-" not in data[:8]:
            raise HTTPException(status_code=400, detail="Invalid PDF header")
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file.write(data)
            temp_path = temp_file.name
        text = extract_text_from_pdf(temp_path)
        extracted_skills = extract_skills(text)
        matched_jobs = match_jobs(text, top_k=5)
        missing, seen = [], set()
        for job in matched_jobs:
            for skill in job.get("missing_skills", []):
                if skill not in seen:
                    missing.append(skill)
                    seen.add(skill)
        learning_plan = generate_learning_plan(missing, matched_jobs)
        evidence_by_skill = generate_evidence(text, extracted_skills)
        result = {
            "ok": True,
            "resume_chars": len(text),
            "raw_text": text,
            "extractedSkills": extracted_skills,
            "missingSkills": missing,
            "matchedJobs": matched_jobs,
            "evidenceBySkill": evidence_by_skill,
            "learningPlan": learning_plan,
        }
        user = await get_or_create_user(
            session,
            current_user["email"],
            current_user.get("name"),
            current_user.get("login"),
        )
        analysis = Analysis(
            user_id=user.id,
            resume_text=text,
            extracted_skills=extracted_skills,
            missing_skills=missing,
            result=result,
            status="completed",
        )
        session.add(analysis)
        await session.commit()
        await session.refresh(analysis)
        return {**result, "analysis_id": analysis.id}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Analyze error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
            logger.info(f"Deleted temporary file {temp_path}")
@router.post("/github-integrate")
async def github_integrate(
    github_token: GitHubToken,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    logger.info("GitHub integrate called")
    try:
        token = github_token.token.strip()
        if not token:
            raise HTTPException(status_code=422, detail="GitHub token cannot be empty")
        if not (token.startswith("ghp_") or token.startswith("github_pat_")):
            raise HTTPException(
                status_code=422,
                detail="Invalid token format. Must start with 'ghp_' or 'github_pat_'",
            )
        session_requests = requests.Session()
        retries = Retry(total=5, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
        session_requests.mount("https://", HTTPAdapter(max_retries=retries))
        headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json",
        }
        repos_response = session_requests.get(
            "https://api.github.com/user/repos", headers=headers, timeout=20
        )
        if repos_response.status_code != 200:
            raise HTTPException(
                status_code=400,
                detail=f"GitHub API error: {repos_response.status_code} - {repos_response.text}"
            )
        repos = repos_response.json()
        if not isinstance(repos, list):
            raise HTTPException(status_code=400, detail="Invalid GitHub response format")
        repos = repos[:20]
        github_evidence: Dict[str, List[str]] = {}
        for repo in repos:
            if not isinstance(repo, dict) or "name" not in repo or "owner" not in repo:
                continue
            owner = repo["owner"].get("login")
            repo_name = repo.get("name")
            if not owner or not repo_name:
                continue
            try:
                contents_response = session_requests.get(
                    f"https://api.github.com/repos/{owner}/{repo_name}/contents",
                    headers=headers,
                    timeout=15
                )
            except requests.RequestException as e:
                logger.warning(f"Request failed for {owner}/{repo_name}: {e}")
                continue
            if contents_response.status_code != 200:
                logger.warning(f"Failed to fetch contents for {owner}/{repo_name}: {contents_response.status_code}")
                continue
            contents = contents_response.json()
            if not isinstance(contents, list):
                continue
            file_names = [item.get("name", "").lower() for item in contents if item.get("type") == "file"]
            html_url = repo.get("html_url")
            if not html_url:
                continue
            if "dockerfile" in file_names:
                github_evidence.setdefault("Docker", []).append(html_url)
            if any("jsx" in f or "tsx" in f for f in file_names) or "package.json" in file_names:
                github_evidence.setdefault("React", []).append(html_url)
            if "package.json" in file_names:
                github_evidence.setdefault("Node.js", []).append(html_url)
            if "requirements.txt" in file_names or any(f.endswith(".py") for f in file_names):
                github_evidence.setdefault("Python", []).append(html_url)
            if any("sql" in f or "query" in f or f.endswith(".sql") for f in file_names):
                github_evidence.setdefault("SQL", []).append(html_url)
            if any("aws" in f or "cloudformation" in f or f.endswith(".yaml") or f.endswith(".yml") for f in file_names):
                github_evidence.setdefault("AWS", []).append(html_url)
            if any("kube" in f or "k8s" in f or "deployment" in f or f.endswith(".yaml") or f.endswith(".yml") for f in file_names):
                github_evidence.setdefault("Kubernetes", []).append(html_url)
            if any("test" in f or "spec" in f or "jest" in f for f in file_names):
                github_evidence.setdefault("Testing", []).append(html_url)
        logger.info(f"GitHub integration completed, found evidence for {len(github_evidence)} skills")
        user = await get_or_create_user(session, current_user["email"], current_user.get("name"), current_user.get("login"))
        stmt = select(GitHubProfile).where(GitHubProfile.user_id == user.id)
        result = await session.execute(stmt)
        existing_profile = result.scalar_one_or_none()
        if existing_profile:
            existing_profile.repos = github_evidence
            existing_profile.last_synced = datetime.datetime.utcnow()
            session.add(existing_profile)
        else:
            profile = GitHubProfile(
                user_id=user.id,
                username=current_user.get("login", "unknown"),
                repos=github_evidence,
                last_synced=datetime.datetime.utcnow(),
            )
            session.add(profile)
        await session.commit()
        return github_evidence
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"GitHub integration error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"GitHub integration failed: {str(e)}")
@router.get("/recommendations")
async def get_recommendations(
    skills: str = "",
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    try:
        if not skills.strip():
            raise HTTPException(status_code=400, detail="Skills parameter cannot be empty")
        user_skills = set(skills.split(","))
        text = " ".join(user_skills)
        matched_jobs = match_jobs(text, top_k=5)
        all_required = set(skill for job in JOBS for skill in job.get("requiredSkills", []))
        missing_skills = list(all_required - user_skills)
        learning_plan = generate_learning_plan(missing_skills, matched_jobs)
        evidence_by_skill = {
            skill: {"resume": [], "jd": [], "confidence": 0.5} for skill in user_skills
        }
        for skill in user_skills:
            jd_snippets = [job["description"] for job in JOBS if skill in job.get("requiredSkills", [])]
            evidence_by_skill[skill]["jd"] = jd_snippets or [f"No job requires {skill}"]

        logger.info("Successfully generated recommendations")
        await get_or_create_user(session, current_user["email"], current_user.get("name"), current_user.get("login"))

        return {
            "extractedSkills": list(user_skills),
            "missingSkills": missing_skills,
            "matchedJobs": matched_jobs,
            "evidenceBySkill": evidence_by_skill,
            "learningPlan": learning_plan,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Recommendations error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")
