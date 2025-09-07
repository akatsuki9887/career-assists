from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from app.utils import extract_text_from_pdf, extract_skills, match_jobs, generate_learning_plan, generate_evidence, JOBS
import logging
from typing import List, Dict, Any
import tempfile
import os
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
router = APIRouter(prefix="/api", tags=["resume"])
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
class GitHubToken(BaseModel):
    token: str
@router.post("/analyze")
async def analyze_resume(file: UploadFile = File(...)):
    try:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Please upload a valid PDF file")
        if file.size is None or file.size > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size must be less than 5MB")
        data = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file.write(data)
            temp_path = temp_file.name
        try:
            text = extract_text_from_pdf(temp_path)
            extracted_skills = extract_skills(text)
            matched_jobs = match_jobs(text, top_k=5)
            missing = []
            seen = set()
            for j in matched_jobs:
                for m in j["missing_skills"]:
                    if m not in seen:
                        missing.append(m)
                        seen.add(m)
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
                "learningPlan": learning_plan
            }
            logger.info("Successfully analyzed resume")
            return result
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
                logger.info(f"Deleted temporary file {temp_path}")
    except Exception as e:
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.unlink(temp_path)
            logger.info(f"Deleted temporary file {temp_path} due to error")
        logger.error(f"Analyze error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
@router.post("/github-integrate")
async def github_integrate(github_token: GitHubToken):
    try:
        token = github_token.token
        if not token:
            raise HTTPException(status_code=422, detail="GitHub token cannot be empty")
        if not (token.startswith("ghp_") or token.startswith("github_pat_")):
            raise HTTPException(status_code=422, detail="Invalid token format. Must start with 'ghp_' or 'github_pat_'")
        session = requests.Session()
        retries = Retry(total=5, backoff_factor=2, status_forcelist=[429, 500, 502, 503, 504, 10061])
        session.mount("https://", HTTPAdapter(max_retries=retries))
        headers = {"Authorization": f"token {token}", "Accept": "application/vnd.github.v3+json"}
        repos_response = session.get("https://api.github.com/user/repos", headers=headers, timeout=15)
        if repos_response.status_code != 200:
            raise HTTPException(status_code=400, detail=f"GitHub API error: {repos_response.status_code} - {repos_response.text}")
        repos = repos_response.json()
        if not isinstance(repos, list):
            raise HTTPException(status_code=400, detail="Invalid GitHub response format")
        github_evidence = {}
        for repo in repos:
            if not isinstance(repo, dict) or "name" not in repo or "owner" not in repo:
                continue
            owner = repo["owner"]["login"]
            repo_name = repo["name"]
            contents_response = session.get(
                f"https://api.github.com/repos/{owner}/{repo_name}/contents",
                headers=headers,
                timeout=15
            )
            if contents_response.status_code != 200:
                logger.warning(f"Failed to fetch contents for {owner}/{repo_name}: {contents_response.text}")
                continue
            contents = contents_response.json()
            if not isinstance(contents, list):
                continue
            file_names = [item["name"].lower() for item in contents if item["type"] == "file"]
            if "dockerfile" in file_names:
                github_evidence["Docker"] = github_evidence.get("Docker", []) + [repo["html_url"]]
            if any("jsx" in fname or "tsx" in fname for fname in file_names) or "package.json" in file_names:
                github_evidence["React"] = github_evidence.get("React", []) + [repo["html_url"]]
            if "package.json" in file_names:
                github_evidence["Node.js"] = github_evidence.get("Node.js", []) + [repo["html_url"]]
            if "requirements.txt" in file_names or any(fname.endswith(".py") for fname in file_names):
                github_evidence["Python"] = github_evidence.get("Python", []) + [repo["html_url"]]
            if any("sql" in fname or "query" in fname or fname.endswith(".sql") for fname in file_names):
                github_evidence["SQL"] = github_evidence.get("SQL", []) + [repo["html_url"]]
            if any("aws" in fname or "cloudformation" in fname or "yaml" in fname for fname in file_names):
                github_evidence["AWS"] = github_evidence.get("AWS", []) + [repo["html_url"]]
            if any("kube" in fname or "k8s" in fname or "yaml" in fname for fname in file_names):
                github_evidence["Kubernetes"] = github_evidence.get("Kubernetes", []) + [repo["html_url"]]
            if any("test" in fname or "spec" in fname or "jest" in fname for fname in file_names):
                github_evidence["Testing"] = github_evidence.get("Testing", []) + [repo["html_url"]]
        logger.info(f"GitHub integration completed, found evidence for {len(github_evidence)} skills")
        return github_evidence
    except Exception as e:
        logger.error(f"GitHub integration error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"GitHub integration failed: {str(e)}")
@router.get("/recommendations")
async def get_recommendations(skills: str = ""):
    try:
        if not skills.strip():
            raise HTTPException(status_code=400, detail="Skills parameter cannot be empty")
        user_skills = set(skills.split(","))
        if not user_skills:
            raise HTTPException(status_code=400, detail="Invalid skills format")
        text = " ".join(user_skills)
        matched_jobs = match_jobs(text, top_k=5)
        all_required = set(skill for job in JOBS for skill in job.get("requiredSkills", []))
        missing_skills = list(all_required - user_skills)
        learning_plan = generate_learning_plan(missing_skills, matched_jobs)
        evidence_by_skill = {skill: {"resume": [], "jd": [], "confidence": 0.5} for skill in user_skills}
        for skill in user_skills:
            jd_snippets = [job["description"] for job in JOBS if skill in job.get("requiredSkills", [])]
            evidence_by_skill[skill]["jd"] = jd_snippets or [f"No job requires {skill}"]
        logger.info("Successfully generated recommendations")
        return {
            "extractedSkills": list(user_skills),
            "missingSkills": missing_skills,
            "matchedJobs": matched_jobs,
            "evidenceBySkill": evidence_by_skill,
            "learningPlan": learning_plan
        }
    except Exception as e:
        logger.error(f"Recommendations error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")