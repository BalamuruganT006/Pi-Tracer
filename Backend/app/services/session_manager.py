"""Session storage – In-memory implementation."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.execution import ExecutionSession, ExecutionStatus
from app.utils.logger import get_logger

logger = get_logger(__name__)


class SessionManager:
    """Manages execution sessions in memory."""

    def __init__(self):
        self._sessions: Dict[str, ExecutionSession] = {}

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    def create_session(
        self, code: str, uid: Optional[str] = None
    ) -> ExecutionSession:
        session_id = str(uuid.uuid4())
        session = ExecutionSession(
            session_id=session_id,
            code=code,
            status=ExecutionStatus.PENDING,
        )
        data = session.model_dump(mode="json")
        data["uid"] = uid  # owner
        get_firestore().collection(_COLLECTION).document(session_id).set(data)
        logger.info(f"Session created: {session_id} (user={uid})")
        return session

    # ------------------------------------------------------------------
    # Store (after execution completes)
    # ------------------------------------------------------------------

    async def store_session(
        self,
        session_id: str,
        code: str,
        result: Any,
        uid: Optional[str] = None,
    ) -> None:
        session = ExecutionSession(
            session_id=session_id,
            code=code,
            status=result.status,
            stdout=result.stdout,
            stderr=result.stderr,
            error=result.error,
            execution_time=result.execution_time,
            trace_data=(
                [s.model_dump() for s in result.trace_data.steps]
                if result.trace_data
                else None
            ),
            completed_at=datetime.utcnow(),
        )
        data = session.model_dump(mode="json")
        data["uid"] = uid
        get_firestore().collection(_COLLECTION).document(session_id).set(data)

        # Increment the user's execution counter
        if uid:
            user_ref = get_firestore().collection("users").document(uid)
            from google.cloud.firestore_v1 import Increment  # type: ignore[attr-defined]

            user_ref.update({"execution_count": Increment(1)})

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    async def get_session(
        self, session_id: str
    ) -> Optional[ExecutionSession]:
        doc = (
            get_firestore()
            .collection(_COLLECTION)
            .document(session_id)
            .get()
        )
        if not doc.exists:
            return None
        return ExecutionSession(**doc.to_dict())

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------

    async def delete_session(self, session_id: str) -> bool:
        ref = get_firestore().collection(_COLLECTION).document(session_id)
        doc = ref.get()
        if not doc.exists:
            return False
        ref.delete()
        return True

    # ------------------------------------------------------------------
    # List (per-user)
    # ------------------------------------------------------------------

    async def list_sessions(
        self, limit: int = 50, uid: Optional[str] = None
    ) -> List[ExecutionSession]:
        query = get_firestore().collection(_COLLECTION)
        if uid:
            query = query.where("uid", "==", uid)
        query = query.order_by(
            "created_at", direction="DESCENDING"
        ).limit(limit)
        docs = query.stream()
        return [ExecutionSession(**d.to_dict()) for d in docs]


# Global singleton
session_manager = SessionManager()
