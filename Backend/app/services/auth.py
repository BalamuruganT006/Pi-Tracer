"""Firebase Authentication service – sign-up, sign-in, token verification."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional

import httpx

from app.config import settings
from app.db.firebase_client import get_auth, get_firestore
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Firebase REST API endpoints for email/password auth
_SIGN_IN_URL = (
    "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
)
_SIGN_UP_URL = (
    "https://identitytoolkit.googleapis.com/v1/accounts:signUp"
)


class AuthError(Exception):
    """Authentication / authorization failure."""


class AuthService:
    """Wraps Firebase Auth for sign-up, sign-in, and token verification."""

    # ------------------------------------------------------------------
    # Sign-up (creates Firebase user + Firestore profile)
    # ------------------------------------------------------------------

    async def sign_up(
        self,
        email: str,
        password: str,
        display_name: str = "",
    ) -> Dict[str, Any]:
        """Create a new user with email & password via the REST API."""
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                _SIGN_UP_URL,
                params={"key": settings.FIREBASE_API_KEY},
                json={
                    "email": email,
                    "password": password,
                    "returnSecureToken": True,
                },
            )

        data = resp.json()
        if resp.status_code != 200:
            msg = data.get("error", {}).get("message", "Sign-up failed")
            raise AuthError(msg)

        uid = data["localId"]

        # Set display name via Admin SDK
        if display_name:
            get_auth().update_user(uid, display_name=display_name)

        # Create user profile document in Firestore
        db = get_firestore()
        db.collection("users").document(uid).set(
            {
                "email": email,
                "display_name": display_name,
                "created_at": datetime.utcnow().isoformat(),
                "execution_count": 0,
                "preferences": {},
            }
        )

        return {
            "uid": uid,
            "email": email,
            "display_name": display_name,
            "id_token": data["idToken"],
            "refresh_token": data["refreshToken"],
            "expires_in": data["expiresIn"],
        }

    # ------------------------------------------------------------------
    # Sign-in (email + password → tokens)
    # ------------------------------------------------------------------

    async def sign_in(
        self, email: str, password: str
    ) -> Dict[str, Any]:
        """Authenticate an existing user via the REST API."""
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                _SIGN_IN_URL,
                params={"key": settings.FIREBASE_API_KEY},
                json={
                    "email": email,
                    "password": password,
                    "returnSecureToken": True,
                },
            )

        data = resp.json()
        if resp.status_code != 200:
            msg = data.get("error", {}).get("message", "Sign-in failed")
            raise AuthError(msg)

        return {
            "uid": data["localId"],
            "email": data["email"],
            "id_token": data["idToken"],
            "refresh_token": data["refreshToken"],
            "expires_in": data["expiresIn"],
        }

    # ------------------------------------------------------------------
    # Token verification (used as a FastAPI dependency)
    # ------------------------------------------------------------------

    def verify_token(self, id_token: str) -> Dict[str, Any]:
        """Verify a Firebase ID token and return the decoded claims."""
        try:
            decoded = get_auth().verify_id_token(id_token)
            return decoded
        except Exception as exc:
            raise AuthError(f"Invalid token: {exc}")

    # ------------------------------------------------------------------
    # User profile helpers
    # ------------------------------------------------------------------

    async def get_user_profile(self, uid: str) -> Optional[Dict[str, Any]]:
        db = get_firestore()
        doc = db.collection("users").document(uid).get()
        if doc.exists:
            return {"uid": uid, **doc.to_dict()}
        return None

    async def update_user_profile(
        self, uid: str, data: Dict[str, Any]
    ) -> None:
        db = get_firestore()
        db.collection("users").document(uid).update(data)


# Global singleton
auth_service = AuthService()
