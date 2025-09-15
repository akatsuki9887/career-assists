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
    init_db()
    logger.info("✅ Database initialized and tables created")
    yield
    logger.info("🛑 Application shutting down...")
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
