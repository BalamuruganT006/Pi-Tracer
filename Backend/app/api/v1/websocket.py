"""WebSocket handlers for real-time execution & collaboration via Flask-SocketIO."""

from __future__ import annotations

import asyncio
import json
import uuid
from typing import Any, Dict, Set

from flask_socketio import SocketIO, emit, join_room, leave_room, disconnect

from app.models.user import WebSocketMessage
from app.services.executor import execution_service
from app.utils.logger import get_logger

logger = get_logger(__name__)


# ------------------------------------------------------------------
# Connection manager
# ------------------------------------------------------------------

class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: Dict[str, str] = {}  # sid -> connection_id
        self.session_rooms: Dict[str, Set[str]] = {}

    def connect(self, sid: str) -> str:
        connection_id = str(uuid.uuid4())
        self.active_connections[sid] = connection_id
        logger.info(f"WebSocket connected: {connection_id} (sid={sid})")
        return connection_id

    def disconnect(self, sid: str) -> None:
        connection_id = self.active_connections.pop(sid, None)
        if connection_id:
            for conns in self.session_rooms.values():
                conns.discard(sid)
            logger.info(f"WebSocket disconnected: {connection_id}")


manager = ConnectionManager()


def _run(coro):
    """Run an async coroutine from synchronous context."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                return pool.submit(asyncio.run, coro).result()
        return loop.run_until_complete(coro)
    except RuntimeError:
        return asyncio.run(coro)


# ------------------------------------------------------------------
# Event registration (called from main.py)
# ------------------------------------------------------------------

def register_events(socketio: SocketIO) -> None:
    """Register all SocketIO event handlers."""

    @socketio.on("connect")
    def handle_connect():
        from flask import request
        sid = request.sid
        connection_id = manager.connect(sid)
        session_id = request.args.get("session_id") or str(uuid.uuid4())
        streaming = request.args.get("streaming", "true").lower() == "true"

        msg = WebSocketMessage(
            type="connected",
            session_id=session_id,
            data={"streaming": streaming},
        ).model_dump()
        emit("message", msg)

    @socketio.on("disconnect")
    def handle_disconnect():
        from flask import request
        manager.disconnect(request.sid)

    @socketio.on("execute")
    def handle_execute(data):
        """Handle code execution requests."""
        code = data.get("code", "")
        user_input = data.get("user_input", "")

        emit("message", WebSocketMessage(
            type="start", data={"code_length": len(code)}
        ).model_dump())

        try:
            result = execution_service.execute(code, user_input)

            if result.trace_data:
                for i, step in enumerate(result.trace_data.steps):
                    emit("message", WebSocketMessage(
                        type="step",
                        data={
                            "type": "step",
                            "step_number": i + 1,
                            "total_steps": len(result.trace_data.steps),
                            "data": step.model_dump(),
                        },
                    ).model_dump())

            emit("message", WebSocketMessage(
                type="complete",
                data={
                    "success": result.success,
                    "stdout": result.stdout,
                    "error": result.error,
                    "execution_time": result.execution_time,
                },
            ).model_dump())

        except Exception as exc:
            logger.exception("Streaming execution failed")
            emit("message", WebSocketMessage(
                type="error", error=str(exc)
            ).model_dump())

    @socketio.on("ping")
    def handle_ping(data):
        emit("message", WebSocketMessage(
            type="pong",
            data={"timestamp": data.get("timestamp") if isinstance(data, dict) else None},
        ).model_dump())

    @socketio.on("cancel")
    def handle_cancel(data=None):
        emit("message", WebSocketMessage(type="cancelled").model_dump())

    # ------------------------------------------------------------------
    # Collaboration room support
    # ------------------------------------------------------------------

    @socketio.on("join_room")
    def handle_join_room(data):
        room_id = data.get("room_id")
        if room_id:
            from flask import request
            join_room(room_id)
            manager.session_rooms.setdefault(room_id, set()).add(request.sid)
            emit("message", {
                "type": "joined",
                "room": room_id,
                "connection_id": manager.active_connections.get(request.sid),
            })

    @socketio.on("leave_room")
    def handle_leave_room(data):
        room_id = data.get("room_id")
        if room_id:
            from flask import request
            leave_room(room_id)
            if room_id in manager.session_rooms:
                manager.session_rooms[room_id].discard(request.sid)

    @socketio.on("broadcast")
    def handle_broadcast(data):
        """Broadcast a message to the room."""
        room_id = data.get("room_id")
        message = data.get("data")
        if room_id and message:
            from flask import request
            emit("message", {
                "type": "broadcast",
                "from": manager.active_connections.get(request.sid),
                "data": message,
            }, to=room_id, include_self=False)
