"""Firebase client – Admin SDK initialization & Firestore access."""

from __future__ import annotations

import os
from typing import Any, Optional

import firebase_admin
from firebase_admin import auth, credentials, firestore

from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

_app: Optional[firebase_admin.App] = None
_db: Optional[Any] = None


def init_firebase() -> None:
    """Initialize the Firebase Admin SDK (idempotent)."""
    global _app, _db

    if _app is not None:
        return

    cred_path = settings.FIREBASE_CREDENTIALS_PATH

    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
    else:
        # Fall back to Application Default Credentials (e.g. on Cloud Run)
        cred = credentials.ApplicationDefault()

    _app = firebase_admin.initialize_app(cred)
    _db = firestore.client()
    logger.info("Firebase initialized")


def get_firestore():
    """Return the Firestore client, initializing Firebase if needed."""
    global _db
    if _db is None:
        init_firebase()
    return _db


def get_auth():
    """Return the Firebase Auth module, initializing if needed."""
    if _app is None:
        init_firebase()
    return auth
