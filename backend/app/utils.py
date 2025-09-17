import PyPDF2
import re
import json
import numpy as np
from sentence_transformers import SentenceTransformer
from sentence_transformers.quantization import quantize_embeddings
import faiss
from typing import List, Dict, Any
from pathlib import Path
import logging
import os
import gc
import pickle
import torch
from memory_profiler import profile

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
ROOT = Path(__file__).resolve().parent.parent
EMBEDDING_CACHE = ROOT / "job_emb_cache.pkl"

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

# Limit jobs to 200 to reduce memory (adjust based on your jobs.json size)
JOBS = JOBS[:200]
JOB_TEXTS = [j.get("description", "") for j in JOBS]

_MODEL = None
_INDEX = None
_JOB_EMB = None

def load_or_compute_embeddings():
    """Load embeddings from cache or compute and save."""
    global _JOB_EMB
    if EMBEDDING_CACHE.exists():
        with open(EMBEDDING_CACHE, "rb") as f:
            _JOB_EMB = pickle.load(f)
        logger.info("Loaded job embeddings from cache")
    else:
        with torch.no_grad():  # Prevent gradient memory
            model = SentenceTransformer("sentence-transformers/paraphrase-MiniLM-L3-v2")
            _JOB_EMB = model.encode(JOB_TEXTS, normalize_embeddings=True)
            _JOB_EMB = quantize_embeddings(_JOB_EMB, precision="binary")
        with open(EMBEDDING_CACHE, "wb") as f:
            pickle.dump(_JOB_EMB, f)
        logger.info("Computed and cached job embeddings")
        torch.cuda.empty_cache() if torch.cuda.is_available() else None
    return _JOB_EMB

def get_model_and_index():
    global _MODEL, _INDEX, _JOB_EMB
    if _MODEL is None:
        logger.info("Lazy loading SentenceTransformer model")
        _MODEL = SentenceTransformer("sentence-transformers/paraphrase-MiniLM-L3-v2")
        _JOB_EMB = load_or_compute_embeddings()
        _INDEX = faiss.IndexFlatL2(_JOB_EMB.shape[1])
        _INDEX.add(_JOB_EMB.astype("float32"))
        logger.info("FAISS index initialized with binary-quantized job embeddings")
        gc.collect()
        torch.cuda.empty_cache() if torch.cuda.is_available() else None
    return _MODEL, _INDEX

@profile
def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF file using PyPDF2."""
    try:
        with open(file_path, "rb") as file:
            reader = PyPDF2.PdfReader(file)
            txt = []
            for page in reader.pages[:10]:  # Limit to 10 pages
                t = page.extract_text() or ""
                if t.strip():
                    txt.append(t[:1000])  # Cap per page
            if not txt:
                raise ValueError("No readable text found in the PDF")
            extracted_text = "\n".join(txt).strip()[:10000]  # Cap total text
            logger.info(f"Extracted {len(extracted_text)} characters from PDF")
            gc.collect()
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
        gc.collect()

@profile
def extract_skills(text: str) -> List[str]:
    """Extract skills from text using regex, handling synonyms."""
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
        skills = sorted(list(found))
        logger.info(f"Extracted skills: {skills}")
        gc.collect()
        return skills
    except Exception as e:
        logger.error(f"Skill extraction failed: {str(e)}")
        raise ValueError(f"Skill extraction failed: {str(e)}")

@profile
def match_jobs(resume_text: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """Match resume text to jobs using FAISS and keyword overlap."""
    try:
        model, index = get_model_and_index()
        with torch.no_grad():
            q = model.encode([resume_text[:10000]], normalize_embeddings=True)  # Cap input
            q = quantize_embeddings(q, precision="binary").astype("float32")
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
        gc.collect()
        torch.cuda.empty_cache() if torch.cuda.is_available() else None
        return sorted_results
    except Exception as e:
        logger.error(f"Job matching failed: {str(e)}")
        raise ValueError(f"Job matching failed: {str(e)}")

@profile
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
        gc.collect()
        return learning_plan
    except Exception as e:
        logger.error(f"Learning plan generation failed: {str(e)}")
        raise ValueError(f"Learning plan generation failed: {str(e)}")

@profile
def generate_evidence(text: str, skills: List[str]) -> Dict[str, Any]:
    """Generate evidence for skills using a generator to reduce memory."""
    try:
        evidence_by_skill = {}
        def sentence_generator():
            for sentence in re.split(r'[.!?]+', text):
                s = sentence.strip()
                if s:
                    yield s[:100]  # Cap sentence length

        for skill in skills:
            resume_snippets = []
            for sentence in sentence_generator():
                if re.search(r'\b' + re.escape(skill) + r'\b', sentence, re.IGNORECASE):
                    resume_snippets.append(sentence)
            jd_snippets = [
                job["description"][:100] + "..." if len(job["description"]) > 100 else job["description"]
                for job in JOBS if skill in job.get("requiredSkills", [])
            ]
            confidence = 0.9 if resume_snippets and jd_snippets else 0.7 if resume_snippets else 0.5
            evidence_by_skill[skill] = {
                "resume": resume_snippets or ["No specific context found in resume"],
                "jd": jd_snippets or [f"No job requires {skill}"],
                "confidence": confidence
            }
        logger.info(f"Generated evidence for {len(evidence_by_skill)} skills")
        gc.collect()
        return evidence_by_skill
    except Exception as e:
        logger.error(f"Evidence generation failed: {str(e)}")
        raise ValueError(f"Evidence generation failed: {str(e)}")