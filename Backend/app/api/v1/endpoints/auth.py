"""Authentication endpoints – sign-up, sign-in, profile."""

from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from app.models.user import SignUpRequest, SignInRequest, AuthResponse, UserProfile
from app.services.auth import auth_service, AuthError

router = APIRouter()


@router.post("/auth/signup", response_model=AuthResponse)
async def sign_up(request: SignUpRequest) -> AuthResponse:
    """Register a new user with email & password."""
    try:
        result = await auth_service.sign_up(
            email=request.email,
            password=request.password,
            display_name=request.display_name,
        )
        return AuthResponse(**result)
    except AuthError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/auth/signin", response_model=AuthResponse)
async def sign_in(request: SignInRequest) -> AuthResponse:
    """Sign in with email & password."""
    try:
        result = await auth_service.sign_in(
            email=request.email,
            password=request.password,
        )
        return AuthResponse(**result)
    except AuthError as exc:
        raise HTTPException(status_code=401, detail=str(exc))


@router.get("/auth/profile")
async def get_profile(uid: str) -> Dict[str, Any]:
    """Get the authenticated user's profile."""
    profile = await auth_service.get_user_profile(uid)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    return profile
