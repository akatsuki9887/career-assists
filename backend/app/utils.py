import pdfplumber
import spacy
import re
import json
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
from typing import List, Dict, Any
from pathlib import Path
import logging
import os

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

ROOT = Path(__file__).resolve().parent.parent

# Validate JSON structure
def validate_learning_map(data: Dict) -> bool:
    """Validate learning_map.json structure."""
    for skill, entry in data.items():
        if not isinstance(entry, dict):
            logger.error(f"Invalid entry for skill {skill}: not a dict")
            return False
        if "resources" not in entry or not isinstance(entry["resources"], list):
            logger.error(f"Invalid resources for skill {skill}: not a list")
            return False
        if "project" not in entry or not isinstance(entry["project"], dict):
            logger.error(f"Invalid project for skill {skill}: not a dict")
            return False
        if "time" not in entry or not isinstance(entry["time"], str):
            logger.error(f"Invalid time for skill {skill}: not a string")
            return False
        for res in entry["resources"]:
            if not isinstance(res, dict) or "title" not in res or "url" not in res:
                logger.error(f"Invalid resource in skill {skill}: missing title or url")
                return False
        if "title" not in entry["project"] or "url" not in entry["project"]:
            logger.error(f"Invalid project in skill {skill}: missing title or url")
            return False
    return True

try:
    skills_path = ROOT / "skills.json"
    jobs_path = ROOT / "jobs.json"
    learning_map_path = ROOT / "learning_map.json"

    for path in [skills_path, jobs_path, learning_map_path]:
        if not path.exists():
            raise FileNotFoundError(f"{path.name} not found at {path}")

    SKILLS = json.loads(skills_path.read_text())
    JOBS = json.loads(jobs_path.read_text())
    with open(learning_map_path) as f:
        LEARNING_MAP = json.load(f)

    if not validate_learning_map(LEARNING_MAP):
        raise ValueError("Invalid learning_map.json structure")
    
    logger.info("Successfully loaded and validated skills.json, jobs.json, and learning_map.json")
except Exception as e:
    logger.error(f"Failed to load JSON files: {str(e)}")
    raise Exception(f"Failed to load required data files: {str(e)}")

JOB_TEXTS = [j.get("description", "") for j in JOBS]
MODEL = SentenceTransformer("all-MiniLM-L6-v2")
JOB_EMB = MODEL.encode(JOB_TEXTS, normalize_embeddings=True)
index = faiss.IndexFlatIP(JOB_EMB.shape[1])
index.add(JOB_EMB.astype("float32"))
logger.info("FAISS index initialized with job embeddings")

try:
    nlp = spacy.load("en_core_web_sm", disable=["ner", "lemmatizer"])
    logger.info("spaCy model loaded successfully")
except Exception as e:
    nlp = None
    logger.warning(f"Failed to load spaCy model: {str(e)}")

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF file."""
    try:
        with pdfplumber.open(file_path) as pdf:
            txt = []
            for p in pdf.pages:
                t = p.extract_text() or ""
                if t.strip():
                    txt.append(t)
            if not txt:
                raise ValueError("No readable text found in the PDF")
            extracted_text = "\n".join(txt).strip()
            logger.info(f"Extracted {len(extracted_text)} characters from PDF")
            return extracted_text
    except Exception as e:
        logger.error(f"PDF parse failed: {str(e)}")
        raise ValueError(f"PDF parse failed: {str(e)}")
    finally:
        if os.path.exists(file_path):
            try:
                os.unlink(file_path)
                logger.info(f"Deleted temporary file {file_path}")
            except Exception as e:
                logger.warning(f"Failed to delete temp file {file_path}: {str(e)}")

def extract_skills(text: str) -> List[str]:
    """Extract skills from text using regex and optional spaCy, handling synonyms."""
    try:
        found = set()
        low = text.lower()
        for canonical, synonyms in SKILLS.items():
            all_terms = [canonical.lower()] + [s.lower() for s in synonyms]
            for term in all_terms:
                pat = r"\b" + re.escape(term) + r"\b"
                if re.search(pat, low):
                    found.add(canonical)
                    break
        if nlp:
            doc = nlp(text)
            for token in doc:
                token_lower = token.text.lower()
                for canonical in list(found):
                    if token_lower == canonical.lower():
                        found.add(canonical)
        skills = sorted(list(found))
        logger.info(f"Extracted skills: {skills}")
        return skills
    except Exception as e:
        logger.error(f"Skill extraction failed: {str(e)}")
        raise ValueError(f"Skill extraction failed: {str(e)}")

def match_jobs(resume_text: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """Match resume text to jobs using FAISS and keyword overlap."""
    try:
        q = MODEL.encode([resume_text], normalize_embeddings=True).astype("float32")
        scores, idxs = index.search(q, top_k)
        results = []
        for sc, ix in zip(scores[0], idxs[0]):
            job = JOBS[int(ix)]
            required = set(job.get("requiredSkills", []))
            have = set(extract_skills(resume_text))
            overlap = required & have
            miss = sorted(list(required - have))
            kw_score = len(overlap) / max(1, len(required))
            final = 0.7 * float(sc) + 0.3 * kw_score
            results.append({
                "title": job.get("title", "Unknown"),
                "company": job.get("company", "Unknown"),
                "score": round(final, 3),
                "matched_skills": sorted(list(overlap)),
                "missing_skills": miss,
                "description": job.get("description", "")[:240],
                "salaryRange": job.get("salaryRange", "Unknown")
            })
        sorted_results = sorted(results, key=lambda x: x["score"], reverse=True)
        logger.info(f"Matched {len(sorted_results)} jobs, top job: {sorted_results[0]['title']} - {sorted_results[0]['company']} with missing skills: {sorted_results[0]['missing_skills']}")
        return sorted_results
    except Exception as e:
        logger.error(f"Job matching failed: {str(e)}")
        raise ValueError(f"Job matching failed: {str(e)}")

def generate_learning_plan(missing_skills: List[str], matched_jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Generate a learning plan prioritizing top job's missing skills."""
    try:
        logger.info(f"Input missing_skills: {missing_skills}")
        if matched_jobs:
            logger.info(f"Top job: {matched_jobs[0]['title']} - {matched_jobs[0]['company']}, missing skills: {matched_jobs[0]['missing_skills']}")
        else:
            logger.warning("No matched jobs provided")
        prioritized_skills = []
        if matched_jobs:
            top_job_missing = matched_jobs[0]["missing_skills"]
            prioritized_skills.extend(top_job_missing)
            prioritized_skills.extend([s for s in missing_skills if s not in top_job_missing])
        else:
            prioritized_skills = missing_skills
        prioritized_skills = list(dict.fromkeys(prioritized_skills))[:8]
        logger.info(f"Prioritized skills order: {prioritized_skills}")
        learning_plan = []
        for i, skill in enumerate(prioritized_skills, 1):
            map_data = LEARNING_MAP.get(skill, {
                "resources": [
                    {"title": f"Learn {skill} Basics", "url": f"https://www.youtube.com/search?q=learn+{skill}"},
                    {"title": f"{skill} Official Docs", "url": f"https://google.com/search?q={skill}+official+docs"}
                ],
                "project": {
                    "title": f"Build a {skill} Mini Project",
                    "url": f"https://www.google.com/search?q={skill}+project"
                },
                "time": "3 days"
            })
            learning_plan.append({
                "week": i,
                "topic": skill,
                "resources": map_data["resources"],
                "project": map_data["project"],
                "time": map_data["time"]
            })
        logger.info(f"Generated learning plan with {len(learning_plan)} weeks: {', '.join([p['topic'] for p in learning_plan])}")
        return learning_plan
    except Exception as e:
        logger.error(f"Learning plan generation failed: {str(e)}")
        raise ValueError(f"Learning plan generation failed: {str(e)}")

def generate_evidence(text: str, skills: List[str]) -> Dict[str, Any]:
    """Generate evidence for skills from resume and job descriptions."""
    try:
        evidence_by_skill = {}
        sentences = re.split(r'[.!?]+', text)
        for skill in skills:
            resume_snippets = []
            for sentence in sentences:
                if re.search(r'\b' + re.escape(skill) + r'\b', sentence, re.IGNORECASE):
                    snippet = sentence.strip()
                    resume_snippets.append(snippet[:100] + "..." if len(snippet) > 100 else snippet)
            jd_snippets = [job["description"][:100] + "..." if len(job["description"]) > 100 else job["description"] for job in JOBS if skill in job.get("requiredSkills", [])]
            confidence = 0.9 if resume_snippets and jd_snippets else 0.7 if resume_snippets else 0.5
            evidence_by_skill[skill] = {
                "resume": resume_snippets or ["No specific context found in resume"],
                "jd": jd_snippets or [f"No job requires {skill}"],
                "confidence": confidence
            }
        logger.info(f"Generated evidence for {len(evidence_by_skill)} skills")
        return evidence_by_skill
    except Exception as e:
        logger.error(f"Evidence generation failed: {str(e)}")
        raise ValueError(f"Evidence generation failed: {str(e)}")