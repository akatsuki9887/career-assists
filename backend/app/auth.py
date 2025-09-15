import os
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import requests
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field
from jose import jwt, JWTError
load_dotenv()
router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
SECRET_KEY = os.getenv("NEXTAUTH_SECRET")
if not SECRET_KEY or len(SECRET_KEY) < 32:
    raise RuntimeError(
        "NEXTAUTH_SECRET missing or too weak. Please set a strong NEXTAUTH_SECRET in backend/.env"
    )
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/exchange-token")
class TokenExchange(BaseModel):
    github_token: Optional[str] = Field(None, description="Personal Access Token (ghp_... or github_pat_...)")
    code: Optional[str] = Field(None, description="OAuth code from GitHub (for server-side exchange)")

    def validate_one(self):
        if not (self.github_token or self.code):
            raise ValueError("Either github_token or code must be provided.")
def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "iss": "career-assist-api"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("iss") != "career-assist-api":
            raise credentials_exception
        exp = payload.get("exp")
        if exp is None or datetime.utcfromtimestamp(exp) < datetime.utcnow():
            raise credentials_exception
        if not payload.get("id"):
            raise credentials_exception
        return payload
    except JWTError as e:
        logger.error("JWT decode failed: %s", e)
def validate_github_token_and_get_user(github_token: str, require_scopes: Optional[list] = None) -> Dict[str, Any]:
    """
    Validate a GitHub access token (PAT or OAuth token) by calling GET /user.
    Optionally validate scopes via X-OAuth-Scopes header.
    Returns the user JSON if valid, otherwise raises HTTPException.
    """
    headers = {
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json",
    }
    try:
        resp = requests.get("https://api.github.com/user", headers=headers, timeout=10)
    except requests.RequestException as e:
        logger.error("GitHub /user request failed: %s", e)
        raise HTTPException(status_code=502, detail="Failed to contact GitHub API")
    if resp.status_code != 200:
        logger.warning("GitHub token validation failed: %s", resp.text)
        raise HTTPException(status_code=400, detail="Invalid GitHub token or insufficient permissions")
    user_json = resp.json()
    if require_scopes:
        scopes_header = resp.headers.get("X-OAuth-Scopes", "")
        scopes_list = [s.strip().lower() for s in scopes_header.split(",") if s.strip()]
        missing = [s for s in require_scopes if s.lower() not in scopes_list]
        if missing:
            logger.warning("GitHub token missing scopes: %s (present: %s)", missing, scopes_list)
            raise HTTPException(status_code=400, detail=f"Insufficient GitHub token scopes: missing {missing}")
    return user_json
def exchange_code_for_github_token(code: str) -> str:
    """
    Exchange an OAuth `code` (from frontend) for a GitHub access token using
    the app's client_id and client_secret. Requires GITHUB_CLIENT_ID and _SECRET set.
    Returns the GitHub access token (string).
    """
    if not (GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET):
        raise HTTPException(status_code=500, detail="GitHub OAuth client ID/secret not configured on server")
    url = "https://github.com/login/oauth/access_token"
    payload = {
        "client_id": GITHUB_CLIENT_ID,
        "client_secret": GITHUB_CLIENT_SECRET,
        "code": code,
    }
    headers = {"Accept": "application/json"}
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=10)
    except requests.RequestException as e:
        logger.error("Failed to contact GitHub token endpoint: %s", e)
        raise HTTPException(status_code=502, detail="Failed to contact GitHub token endpoint")
    if resp.status_code != 200:
        logger.error("GitHub token exchange returned %s: %s", resp.status_code, resp.text)
        raise HTTPException(status_code=400, detail="GitHub token exchange failed")
    data = resp.json()
    token = data.get("access_token")
    if not token:
        logger.error("No access_token in GitHub response: %s", data)
        raise HTTPException(status_code=400, detail="GitHub did not return an access token")
    return token
@router.post("/exchange-token")
async def exchange_token(data: TokenExchange):
    """
    Accepts either:
      - { "code": "<github oAuth code>" }  --> exchanges with GitHub for an access_token, validates user, returns JWT
      - { "github_token": "<personal or oauth token>" } --> validates token and returns JWT

    Response:
      { access_token: "<jwt>", token_type: "bearer", expires_in: <seconds> }
    """
    try:
        try:
            data.validate_one()
        except ValueError as ve:
            raise HTTPException(status_code=422, detail=str(ve))
        github_token = None
        if data.code:
            logger.info("Exchanging OAuth code for GitHub token")
            github_token = exchange_code_for_github_token(data.code)
        elif data.github_token:
            github_token = data.github_token.strip()

        # validate the token and fetch user
        # NOTE: we do not require 'repo' scope here; if your flow needs access to private repos,
        # require ['repo'] or other scopes by passing require_scopes list.
        user_json = validate_github_token_and_get_user(github_token, require_scopes=None)
        email = user_json.get("email") or f"{user_json.get('login')}@users.noreply.github.com"
        payload = {
            "id": str(user_json.get("id", "unknown")),
            "email": email,
            "name": user_json.get("name"),
            "login": user_json.get("login", "unknown"),
        }
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(payload, access_token_expires)

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Token exchange internal error")
        raise HTTPException(status_code=500, detail="Token exchange failed")