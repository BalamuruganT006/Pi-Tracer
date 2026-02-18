"""Session management endpoints."""

from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, Header, HTTPException

from app.services.auth import auth_service, AuthError
from app.services.session_manager import session_manager

router = APIRouter()


def _extract_uid(authorization: Optional[str]) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        decoded = auth_service.verify_token(authorization.split("Bearer ")[1])
        return decoded.get("uid")
    except AuthError:
        return None


@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """Retrieve a stored execution session."""
    session = await session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete an execution session."""
    success = await session_manager.delete_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"deleted": True}


@router.get("/sessions")
async def list_sessions(
    limit: int = 50,
    authorization: Optional[str] = Header(None),
):
    """List recent sessions (filtered by user when authenticated)."""
    uid = _extract_uid(authorization)
    sessions = await session_manager.list_sessions(limit, uid=uid)
    return {"sessions": [s.model_dump() for s in sessions]}
