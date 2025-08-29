from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pdfplumber
import re
import spacy
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import json
import requests

app = FastAPI(docs_url="/docs", redoc_url="/redoc")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dummy skills keyword list
SKILLS_KEYWORDS = ["Python", "SQL", "Docker", "Kubernetes", "ETL", "Flask", "React", "Next.js", "TailwindCSS", "TensorFlow", "Scikit-learn", "Node.js"]

# Load jobs from JSON with fallback
try:
    with open("app/jobs.json", "r") as f:
        JOBS_DB = json.load(f)
except FileNotFoundError:
    print("jobs.json not found, using default DB")
    JOBS_DB = [
        {"title": "Data Scientist", "company": "Google", "requiredSkills": ["Python", "ML", "Pandas", "SQL"], "description": "Python, ML, Pandas, SQL"},
        {"title": "Backend Engineer", "company": "Amazon", "requiredSkills": ["Node.js", "Docker", "PostgreSQL"], "description": "Node.js, Docker, PostgreSQL"}
    ]

# Load spaCy and SentenceTransformer
try:
    nlp = spacy.load("en_core_web_sm")
except Exception as e:
    print(f"Failed to load spaCy model: {e}")
    nlp = None

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

# Precompute job embeddings
job_descriptions = [job["description"] for job in JOBS_DB]
job_embeddings = model.encode(job_descriptions)
dimension = job_embeddings.shape[1]
index = faiss.IndexFlatL2(dimension)
index.add(np.array(job_embeddings))

# Learning plan mapping with real URLs
LEARNING_MAP = {
    "Docker": {"course": "Docker for Beginners", "project": "Dockerize your Todo app", "time": "3 days", "url": "https://www.youtube.com/watch?v=pg19Z8LL06I"},
    "SQL": {"course": "SQL Bootcamp", "project": "Design a database schema for E-commerce", "time": "5 days", "url": "https://www.coursera.org/learn/sql-for-data-science"},
    "Kubernetes": {"course": "Kubernetes Basics", "project": "Deploy app to K8s cluster", "time": "4 days", "url": "https://www.udemy.com/course/learn-kubernetes"},
    "Python": {"course": "Python Crash Course", "project": "Build a Calculator App", "time": "3 days", "url": "https://www.youtube.com/watch?v=rfscVS0vtbw"},
    "React": {"course": "ReactJS Tutorial", "project": "Todo App with React", "time": "4 days", "url": "https://www.youtube.com/watch?v=RVFAyFWO4go"},
    "Next.js": {"course": "Next.js Guide", "project": "Portfolio Website", "time": "5 days", "url": "https://www.freecodecamp.org/learn/front-end-development-libraries/#react"},
    "Flask": {"course": "Flask for Beginners", "project": "Blog App with Flask", "time": "3 days", "url": "https://www.youtube.com/watch?v=Z1RJmh-OqeA"},
    "TailwindCSS": {"course": "TailwindCSS Crash Course", "project": "Styling Portfolio Website", "time": "2 days", "url": "https://www.youtube.com/watch?v=ELCr9YBmLno"},
    "TensorFlow": {"course": "TensorFlow Basics", "project": "Digit Recognizer ML Model", "time": "5 days", "url": "https://www.youtube.com/watch?v=bemDFpwrH4Q"},
    "Scikit-learn": {"course": "Machine Learning with Scikit-learn", "project": "Predict Housing Prices", "time": "4 days", "url": "https://www.youtube.com/watch?v=0Lt9w-BxKFQ"},
    "Node.js": {"course": "Node.js Tutorial", "project": "REST API Server", "time": "3 days", "url": "https://www.youtube.com/watch?v=fBNz5xF-Kx4"},
    "ETL": {"course": "ETL Concepts", "project": "ETL Pipeline for CSV Data", "time": "3 days", "url": "https://www.youtube.com/watch?v=5r3r4f3H4B0"}
}

@app.get("/")
async def root():
    return {"message": "Welcome to Career Assist Backend"}

@app.post("/github-integrate")
async def github_integrate(token: str):
    try:
        headers = {"Authorization": f"token {token}"}
        repos = requests.get("https://api.github.com/user/repos", headers=headers).json()
        github_evidence = {}
        for repo in repos:
            if isinstance(repo, dict) and "name" in repo:
                if "Dockerfile" in repo["name"].lower():
                    github_evidence["Docker"] = github_evidence.get("Docker", []) + [repo["html_url"]]
                # Add more file-based skill checks
                if "package.json" in repo["name"].lower():
                    github_evidence["Node.js"] = github_evidence.get("Node.js", []) + [repo["html_url"]]
                if "requirements.txt" in repo["name"].lower():
                    github_evidence["Python"] = github_evidence.get("Python", []) + [repo["html_url"]]
        return {"github": github_evidence}
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": f"GitHub integration failed: {str(e)}"})

@app.post("/analyze")
async def analyze_resume(file: UploadFile = File(...)):
    try:
        if not file.filename.lower().endswith(".pdf"):
            return JSONResponse(status_code=400, content={"detail": "Only PDF files are supported"})

        text = ""
        with pdfplumber.open(file.file) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""

        # Extract skills
        extractedSkills = []
        if nlp:
            doc = nlp(text)
            extractedSkills = list(set([ent.text for ent in doc.ents if ent.label_ == "SKILL"] + 
                                       [skill for skill in SKILLS_KEYWORDS if re.search(r'\b' + skill + r'\b', text, re.IGNORECASE)]))
        else:
            extractedSkills = [skill for skill in SKILLS_KEYWORDS if re.search(r'\b' + skill + r'\b', text, re.IGNORECASE)]

        # Semantic matching with FAISS
        resume_embedding = model.encode([text])
        dist, idx = index.search(resume_embedding, k=5)
        matchedJobs = []
        for i, job_idx in enumerate(idx[0]):
            if job_idx >= 0:
                job = JOBS_DB[job_idx]
                match_percent = float((1 - dist[0][i]) * 100)  # Convert numpy.float32 to Python float
                matchedJobs.append({
                    "title": job["title"],
                    "company": job["company"],
                    "matchPercent": round(match_percent, 2)
                })

        all_required = set(skill for job in JOBS_DB for skill in job.get("requiredSkills", []))
        missingSkills = list(all_required - set(extractedSkills))

        # Evidence by skill with confidence scores
        evidenceBySkill = {}
        for skill in extractedSkills:
            resume_snippets = []
            sentences = text.split('.')
            for sentence in sentences:
                if re.search(r'\b' + skill + r'\b', sentence, re.IGNORECASE):
                    snippet = sentence.strip()
                    resume_snippets.append(snippet[:150] + "..." if len(snippet) > 150 else snippet)
            jd_snippets = [job["description"] for job in JOBS_DB if skill in job.get("requiredSkills", [])]
            # Calculate confidence based on snippet presence and keyword strength
            confidence = 90 if resume_snippets and jd_snippets else 70 if resume_snippets else 50
            evidenceBySkill[skill] = {
                "resume": resume_snippets or ["No specific context found in resume"],
                "jd": jd_snippets or [f"No job requires {skill}"],
                "confidence": confidence
            }

        # Learning plan
        learningPlan = []
        for i, skill in enumerate(missingSkills):
            map_data = LEARNING_MAP.get(skill, {"course": "General Course", "project": "Mini Project", "time": "N/A", "url": "https://www.coursera.org"})
            learningPlan.append({
                "week": i + 1,
                "topic": skill,
                "resources": [{"title": map_data["course"], "url": map_data["url"]}],
                "project": {"title": map_data["project"], "url": map_data["url"]},
                "time": map_data["time"]
            })

        return {
            "extractedSkills": extractedSkills,
            "missingSkills": missingSkills,
            "matchedJobs": matchedJobs,
            "evidenceBySkill": evidenceBySkill,
            "learningPlan": learningPlan
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": f"Analysis failed: {str(e)}"})