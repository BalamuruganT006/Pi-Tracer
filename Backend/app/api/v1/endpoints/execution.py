"""HTTP execution endpoints."""

from __future__ import annotations

import json
from typing import Any, AsyncGenerator, Dict, Optional

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.models.execution import (
    ExecutionMetadata,
    ExecutionRequest,
    ExecutionResponse,
)
from app.services.auth import auth_service, AuthError
from app.services.executor import execution_service
from app.services.session_manager import session_manager
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()


def _extract_uid(authorization: Optional[str]) -> Optional[str]:
    """Best-effort UID extraction – returns None for unauthenticated."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        decoded = auth_service.verify_token(authorization.split("Bearer ")[1])
        return decoded.get("uid")
    except AuthError:
        return None


@router.post("/execute", response_model=ExecutionResponse)
async def execute_code(
    request: Request,
    execution_request: ExecutionRequest,
    background_tasks: BackgroundTasks,
    authorization: Optional[str] = Header(None),
) -> ExecutionResponse:
    """Execute Python code and return the complete execution trace."""
    uid = _extract_uid(authorization)
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")

    metadata = ExecutionMetadata(ip_address=client_ip, user_agent=user_agent)

    result = await execution_service.execute(
        execution_request.code,
        execution_request.user_input or "",
        execution_request.session_id,
    )

    response = ExecutionResponse(
        session_id=execution_request.session_id or "new-session",
        status=result.status,
        steps=(
            [step.model_dump() for step in result.trace_data.steps]
            if result.trace_data
            else None
        ),
        total_steps=result.trace_data.total_steps if result.trace_data else 0,
        current_step=result.trace_data.total_steps if result.trace_data else 0,
        stdout=result.stdout,
        stderr=result.stderr,
        error=result.error,
        execution_time=result.execution_time,
        metadata=metadata,
    )

    if result.trace_data:
        background_tasks.add_task(
            session_manager.store_session,
            response.session_id,
            execution_request.code,
            result,
            uid,
        )

    return response


@router.post("/execute/simple")
async def execute_simple(request: ExecutionRequest) -> Dict[str, Any]:
    """Execute code without tracing (faster, for simple validation)."""
    result = await execution_service.execute(
        request.code, request.user_input or ""
    )
    return {
        "success": result.success,
        "output": result.stdout,
        "error": result.error,
        "execution_time": result.execution_time,
    }


@router.get("/execute/stream")
async def execute_stream(code: str, user_input: str = "") -> StreamingResponse:
    """Server-sent events endpoint for streaming execution."""

    async def event_generator() -> AsyncGenerator[str, None]:
        result = await execution_service.execute(code, user_input)

        if result.trace_data:
            for i, step in enumerate(result.trace_data.steps):
                payload = {
                    "type": "step",
                    "step_number": i + 1,
                    "total_steps": result.trace_data.total_steps,
                    "data": step.model_dump(),
                }
                yield f"data: {json.dumps(payload)}\n\n"

        yield (
            f"data: {json.dumps({'type': 'done', 'execution_time': result.execution_time})}\n\n"
        )

    return StreamingResponse(event_generator(), media_type="text/event-stream")
