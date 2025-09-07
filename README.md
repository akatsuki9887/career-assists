Career Assist
Career Assist is a web application designed to help job seekers identify their skill gaps, match with relevant jobs, and create a personalized learning plan to bridge those gaps. By analyzing a user's resume, it extracts skills, matches them with job requirements, and provides a structured roadmap with resources and projects to learn missing skills. Built with a modern tech stack, it combines a Python backend with a React frontend for a seamless user experience.
Features

Resume Analysis: Upload a PDF resume to extract skills using NLP and keyword matching.
Job Matching: Find top job matches based on your skills, with detailed insights into matched and missing skills.
Learning Plan: Get a tailored learning plan with resources (tutorials, docs) and project ideas to learn missing skills.
GitHub Integration: Connect your GitHub account to validate skills through your repositories.
Interactive UI: A clean, responsive interface with progress tracking and skill gap visualization.

Tech Stack

Backend: Python, FastAPI, spaCy, SentenceTransformers, FAISS, pdfplumber
Frontend: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
Data: JSON-based skill and job databases
Deployment: Local development with FastAPI and Next.js dev servers

Getting Started
Follow these steps to set up and run the project locally.
Prerequisites

Python 3.9+: Install from python.org.
Node.js 18+: Install from nodejs.org.
Git: Install from git-scm.com.
GitHub Account: For GitHub integration (optional).

Installation

Clone the Repository
git clone https://github.com/akatsuki9887/career-assist.git
cd career-assist


Set Up the Backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt


Set Up the Frontend
cd ../frontend
npm install


Prepare Data FilesEnsure the following files are in the backend directory:

skills.json: List of skills and their synonyms.
jobs.json: Job descriptions with required skills.
learning_map.json: Learning resources and projects for skills.

Example learning_map.json:
{
  "Python": {
    "resources": [
      {"title": "Python Crash Course", "url": "https://www.youtube.com/watch?v=rfscVS0vtbw"},
      {"title": "Python Official Docs", "url": "https://docs.python.org/3/"}
    ],
    "project": {
      "title": "Build a Calculator App",
      "url": "https://realpython.com/python-project-ideas/#calculator"
    },
    "time": "3 days"
  }
}



Running the Application

Start the Backend
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app.main:app --reload --port 8000


Start the Frontend
cd frontend
npm run dev


Access the App

Open http://localhost:3000 in your browser.
Upload a PDF resume at /upload to analyze skills.
View results at /results and learning plan at /learning.



API Endpoints

POST /api/analyze: Upload a resume PDF to get skill analysis, job matches, and learning plan.curl -X POST -F "file=@resume.pdf" http://127.0.0.1:8000/api/analyze


POST /api/github-integrate: Integrate GitHub to validate skills.curl -X POST -H "Content-Type: application/json" -d '{"token": "your-github-token"}' http://127.0.0.1:8000/api/github-integrate



Usage

Upload Resume: Go to /upload, upload a PDF resume, and submit.
View Results: Check /results for:
Extracted skills and skill gap analysis.
Top job matches with match scores and missing skills.
GitHub integration to validate skills via repositories.


Follow Learning Plan: Visit /learning to see a week-by-week plan with resources and projects. Mark weeks as complete to track progress.

Contributing
We welcome contributions! To contribute:

Fork the repository.
Create a new branch: git checkout -b feature/your-feature.
Make changes and commit: git commit -m "Add your feature".
Push to your fork: git push origin feature/your-feature.
Create a Pull Request on GitHub.

Please ensure your code follows the project's coding style and includes tests.
Troubleshooting

Backend Errors: Check backend.log or terminal output for logs. Ensure all JSON files are valid and dependencies are installed.
Frontend Errors: Open browser DevTools (F12) to check console logs. Run npm install again if dependencies are missing.
GitHub Integration: Ensure your GitHub Personal Access Token has repo scope. Clear localStorage if issues persist:localStorage.clear();



Future Improvements

Add unit tests for backend and frontend.
Implement user authentication for personalized profiles.
Enhance learning plan with progress analytics.
Support more resume formats (e.g., DOCX).

License
This project is licensed under the MIT License. See the LICENSE file for details.
Contact
For questions or feedback, reach out via GitHub Issues or email at yuvrajsingh78905@gmail.com

Happy job hunting with Career Assist! 🚀