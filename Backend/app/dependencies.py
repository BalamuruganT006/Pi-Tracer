"""Flask helpers  shared across routes."""

from typing import Dict, Any, Optional
from functools import wraps

from flask import request, jsonify, abort

from app.services.auth import auth_service, AuthError
from app.services.executor import execution_service
from app.services.session_manager import session_manager


def get_session_manager():
    return session_manager


def get_executor():
    return execution_service


def get_current_user() -> Dict[str, Any]:
    """Verify the Firebase ID token from the Authorization header."""
    authorization = request.headers.get("Authorization")
    if not authorization or not authorization.startswith("Bearer "):
        abort(401, description="Missing or invalid Authorization header")
    token = authorization.split("Bearer ")[1]
    try:
        return auth_service.verify_token(token)
    except AuthError as exc:
        abort(401, description=str(exc))


def extract_uid(authorization: Optional[str] = None) -> Optional[str]:
    """Best-effort UID extraction  returns None for unauthenticated."""
    if authorization is None:
        authorization = request.headers.get("Authorization")
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        decoded = auth_service.verify_token(authorization.split("Bearer ")[1])
        return decoded.get("uid")
    except AuthError:
        return None
