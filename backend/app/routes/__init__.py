from .analyze import router as analyze_router
from  app.auth import router as auth_router
__all__ = ["analyze_router", "auth_router"]