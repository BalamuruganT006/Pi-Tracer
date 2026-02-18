"""FastAPI dependencies – shared across routes."""

from typing import Annotated, Dict, Any

from fastapi import Depends, Header, HTTPException

from app.services.auth import auth_service, AuthError
from app.services.executor import ExecutionService, execution_service
from app.services.session_manager import SessionManager, session_manager


async def get_session_manager() -> SessionManager:
    return session_manager


async def get_executor() -> ExecutionService:
    return execution_service


async def get_current_user(
    authorization: str = Header(None),
) -> Dict[str, Any]:
    """Verify the Firebase ID token from the Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.split("Bearer ")[1]
    try:
        return auth_service.verify_token(token)
    except AuthError as exc:
        raise HTTPException(status_code=401, detail=str(exc))


SessionManagerDep = Annotated[SessionManager, Depends(get_session_manager)]
ExecutorDep = Annotated[ExecutionService, Depends(get_executor)]
CurrentUserDep = Annotated[Dict[str, Any], Depends(get_current_user)]
