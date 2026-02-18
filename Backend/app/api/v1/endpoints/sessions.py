"""Session management endpoints."""

from __future__ import annotations

import asyncio
from typing import Any, Dict, Optional

from flask import Blueprint, request, jsonify

from app.dependencies import extract_uid
from app.services.session_manager import session_manager

sessions_bp = Blueprint("sessions", __name__)


def _run(coro):
    """Run an async coroutine from synchronous Flask context."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                return pool.submit(asyncio.run, coro).result()
        return loop.run_until_complete(coro)
    except RuntimeError:
        return asyncio.run(coro)


@sessions_bp.route("/sessions/<session_id>")
def get_session(session_id: str):
    """Retrieve a stored execution session."""
    session = _run(session_manager.get_session(session_id))
    if not session:
        return jsonify(error="Session not found"), 404
    return jsonify(session.model_dump(mode="json"))


@sessions_bp.route("/sessions/<session_id>", methods=["DELETE"])
def delete_session(session_id: str):
    """Delete an execution session."""
    success = _run(session_manager.delete_session(session_id))
    if not success:
        return jsonify(error="Session not found"), 404
    return jsonify(deleted=True)


@sessions_bp.route("/sessions")
def list_sessions():
    """List recent sessions (filtered by user when authenticated)."""
    limit = request.args.get("limit", 50, type=int)
    uid = extract_uid()
    sessions = _run(session_manager.list_sessions(limit, uid=uid))
    return jsonify(sessions=[s.model_dump(mode="json") for s in sessions])
