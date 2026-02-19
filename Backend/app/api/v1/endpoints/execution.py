"""HTTP execution endpoints."""

from __future__ import annotations

import json
import threading
from typing import Any, Dict, Generator, Optional

from flask import Blueprint, Response, request, jsonify

from app.models.execution import (
    ExecutionMetadata,
    ExecutionRequest,
    ExecutionResponse,
)
from app.services.executor import execution_service
from app.services.session_manager import session_manager
from app.utils.logger import get_logger

logger = get_logger(__name__)
execution_bp = Blueprint("execution", __name__)


@execution_bp.route("/execute", methods=["POST"])
def execute_code():
    """Execute Python code and return the complete execution trace."""
    data = request.get_json(force=True)
    try:
        execution_request = ExecutionRequest(**data)
    except Exception as exc:
        return jsonify(error=str(exc)), 422

    uid = None  # No authentication required
    client_ip = request.remote_addr or "unknown"
    user_agent = request.headers.get("User-Agent", "")

    metadata = ExecutionMetadata(ip_address=client_ip, user_agent=user_agent)

    result = execution_service.execute(
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

    return jsonify(response.model_dump(mode="json"))


@execution_bp.route("/execute/simple", methods=["POST"])
def execute_simple():
    """Execute code without tracing (faster, for simple validation)."""
    data = request.get_json(force=True)
    try:
        req = ExecutionRequest(**data)
    except Exception as exc:
        return jsonify(error=str(exc)), 422

    result = execution_service.execute(
        req.code, req.user_input or ""
    )
    return jsonify(
        success=result.success,
        output=result.stdout,
        error=result.error,
        execution_time=result.execution_time,
    )


@execution_bp.route("/execute/stream")
def execute_stream():
    """Server-sent events endpoint for streaming execution."""
    code = request.args.get("code", "")
    user_input = request.args.get("user_input", "")

    def event_generator() -> Generator[str, None, None]:
        result = execution_service.execute(code, user_input)

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

    return Response(event_generator(), mimetype="text/event-stream")
