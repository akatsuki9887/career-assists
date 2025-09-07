from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router as analyze_router
import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)
app = FastAPI(title="Career Assist API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(analyze_router)
@app.get("/health")
async def health_check():
    return {"status": "ok"}