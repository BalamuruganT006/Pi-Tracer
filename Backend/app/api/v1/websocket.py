"""WebSocket handlers for real-time execution & collaboration."""

from __future__ import annotations

import json
import uuid
from typing import Any, Dict, Set

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from app.models.user import WebSocketMessage
from app.services.executor import execution_service
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()


# ------------------------------------------------------------------
# Connection manager
# ------------------------------------------------------------------

class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: Dict[str, WebSocket] = {}
        self.session_rooms: Dict[str, Set[str]] = {}

    async def connect(self, websocket: WebSocket, connection_id: str) -> bool:
        await websocket.accept()
        self.active_connections[connection_id] = websocket
        logger.info(f"WebSocket connected: {connection_id}")
        return True

    def disconnect(self, connection_id: str) -> None:
        self.active_connections.pop(connection_id, None)
        for conns in self.session_rooms.values():
            conns.discard(connection_id)
        logger.info(f"WebSocket disconnected: {connection_id}")

    async def send_message(self, connection_id: str, message: Dict[str, Any]) -> None:
        ws = self.active_connections.get(connection_id)
        if ws and ws.client_state == WebSocketState.CONNECTED:
            await ws.send_json(message)

    async def broadcast_to_room(
        self, room_id: str, message: Dict[str, Any], exclude: str | None = None
    ) -> None:
        for cid in self.session_rooms.get(room_id, set()):
            if cid != exclude:
                await self.send_message(cid, message)

    def join_room(self, connection_id: str, room_id: str) -> None:
        self.session_rooms.setdefault(room_id, set()).add(connection_id)

    def leave_room(self, connection_id: str, room_id: str) -> None:
        if room_id in self.session_rooms:
            self.session_rooms[room_id].discard(connection_id)


manager = ConnectionManager()


# ------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------

@router.websocket("/ws/execute")
async def websocket_execute(
    websocket: WebSocket,
    session_id: str = Query(None),
    streaming: bool = Query(True),
) -> None:
    """Real-time code execution with step-by-step streaming."""
    connection_id = str(uuid.uuid4())
    await manager.connect(websocket, connection_id)
    current_session = session_id or str(uuid.uuid4())

    try:
        await websocket.send_json(
            WebSocketMessage(
                type="connected",
                session_id=current_session,
                data={"streaming": streaming},
            ).model_dump()
        )

        while True:
            raw = await websocket.receive_text()
            try:
                message = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json(
                    WebSocketMessage(type="error", error="Invalid JSON").model_dump()
                )
                continue

            action = message.get("action")

            if action == "execute":
                code = message.get("code", "")
                user_input = message.get("user_input", "")

                await websocket.send_json(
                    WebSocketMessage(
                        type="start", data={"code_length": len(code)}
                    ).model_dump()
                )

                async def send_step(data: Dict[str, Any]) -> None:
                    if websocket.client_state == WebSocketState.CONNECTED:
                        await websocket.send_json(
                            WebSocketMessage(type="step", data=data).model_dump()
                        )

                try:
                    await execution_service.execute_streaming(
                        code, user_input, send_step
                    )
                except Exception as exc:
                    logger.exception("Streaming execution failed")
                    await websocket.send_json(
                        WebSocketMessage(type="error", error=str(exc)).model_dump()
                    )

            elif action == "ping":
                await websocket.send_json(
                    WebSocketMessage(
                        type="pong",
                        data={"timestamp": message.get("timestamp")},
                    ).model_dump()
                )

            elif action == "cancel":
                await websocket.send_json(
                    WebSocketMessage(type="cancelled").model_dump()
                )

            else:
                await websocket.send_json(
                    WebSocketMessage(
                        type="error", error=f"Unknown action: {action}"
                    ).model_dump()
                )

    except WebSocketDisconnect:
        manager.disconnect(connection_id)
    except Exception as exc:
        logger.exception("WebSocket error")
        try:
            await websocket.send_json(
                WebSocketMessage(type="error", error=str(exc)).model_dump()
            )
        except Exception:
            pass
        manager.disconnect(connection_id)


@router.websocket("/ws/collaborate/{room_id}")
async def websocket_collaborate(websocket: WebSocket, room_id: str) -> None:
    """Collaborative editing/sharing via rooms."""
    connection_id = str(uuid.uuid4())
    await manager.connect(websocket, connection_id)
    manager.join_room(connection_id, room_id)

    try:
        await websocket.send_json(
            {"type": "joined", "room": room_id, "connection_id": connection_id}
        )

        while True:
            message = await websocket.receive_json()
            await manager.broadcast_to_room(
                room_id,
                {"type": "broadcast", "from": connection_id, "data": message},
                exclude=connection_id,
            )

    except WebSocketDisconnect:
        manager.leave_room(connection_id, room_id)
        manager.disconnect(connection_id)
