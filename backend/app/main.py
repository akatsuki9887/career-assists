from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from starlette.responses import JSONResponse
import logging
import os
import gc
import psutil
from app.routes import analyze_router, auth_router
from app.db import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("career-assist-api")
limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    workers = int(os.getenv("UVICORN_WORKERS", "1"))
    if workers != 1:
        logger.warning(f"Multiple workers detected ({workers}). Forcing single worker to reduce memory.")
        os.environ["UVICORN_WORKERS"] = "1"
    logger.info("✅ Database initialized and tables created")
    logger.info(f"Uvicorn workers: {os.getenv('UVICORN_WORKERS', '1')}")
    process = psutil.Process(os.getpid())
    mem_info = process.memory_info()
    logger.info(f"Startup memory: RSS={mem_info.rss / 1024**2:.2f} MB")
    yield
    logger.info("🛑 Application shutting down...")
    gc.collect()
    mem_info = process.memory_info()
    logger.info(f"Shutdown memory: RSS={mem_info.rss / 1024**2:.2f} MB")

app = FastAPI(
    title="Career Assist API",
    version="1.0.0",
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(
    RateLimitExceeded,
    lambda request, exc: JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded"},
    )
)
app.add_middleware(SlowAPIMiddleware)
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(analyze_router)
app.include_router(auth_router)

@app.get("/health")
@limiter.limit("5/minute")
async def health_check(request: Request):
    return {"status": "ok"}

@app.get("/memory-usage")
async def memory_usage():
    process = psutil.Process(os.getpid())
    mem_info = process.memory_info()
    logger.info(f"Memory usage: RSS={mem_info.rss / 1024**2:.2f} MB, VMS={mem_info.vms / 1024**2:.2f} MB")
    return {
        "ram_used_mb": round(mem_info.rss / 1024**2, 2),
        "virtual_memory_mb": round(mem_info.vms / 1024**2, 2)
    }