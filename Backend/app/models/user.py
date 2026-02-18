"""User / session / auth models."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, EmailStr, Field


# ------------------------------------------------------------------
# Auth request / response
# ------------------------------------------------------------------

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    display_name: str = Field("", max_length=100)


class SignInRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class AuthResponse(BaseModel):
    uid: str
    email: str
    display_name: str = ""
    id_token: str
    refresh_token: str
    expires_in: str


class UserProfile(BaseModel):
    uid: str
    email: str
    display_name: str = ""
    execution_count: int = 0
    preferences: Dict[str, Any] = Field(default_factory=dict)


# ------------------------------------------------------------------
# Session / WebSocket
# ------------------------------------------------------------------

class UserSession(BaseModel):
    session_id: str
    uid: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_activity: datetime = Field(default_factory=datetime.utcnow)
    execution_count: int = 0
    preferences: Dict[str, Any] = Field(default_factory=dict)


class WebSocketMessage(BaseModel):
    type: str  # 'connected', 'start', 'step', 'complete', 'error', 'ping', 'pong'
    session_id: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    timestamp: float = Field(
        default_factory=lambda: datetime.utcnow().timestamp()
    )
