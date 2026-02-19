"""Server-Sent Events (SSE) endpoints for real-time code execution."""

import json
import time
from flask import Blueprint, Response, request, jsonify

from app.models.execution import ExecutionRequest, ExecutionMetadata
from app.services.executor import execution_service
from app.utils.logger import get_logger

logger = get_logger(__name__)
stream_bp = Blueprint("stream", __name__)


@stream_bp.route("/execute-stream", methods=["POST"])
def execute_code_stream():
    """Execute Python code and stream results via Server-Sent Events."""
    data = request.get_json(force=True)
    try:
        execution_request = ExecutionRequest(**data)
    except Exception as exc:
        return jsonify(error=str(exc)), 422

    client_ip = request.remote_addr or "unknown"
    user_agent = request.headers.get("User-Agent", "")
    metadata = ExecutionMetadata(ip_address=client_ip, user_agent=user_agent)

    def generate():
        """Generator function to stream execution events."""
        try:
            # Send initial event
            yield f"data: {json.dumps({'type': 'start', 'message': 'Execution started'})}\n\n"
            
            # Execute code and get result
            result = execution_service.execute(
                code=execution_request.code,
                uid=None,  # No auth required
                metadata=metadata,
            )
            
            if result.error:
                yield f"data: {json.dumps({'type': 'error', 'error': result.error})}\n\n"
                return
                
            # Stream each execution step
            for i, step in enumerate(result.steps or []):
                step_data = {
                    'type': 'step',
                    'step_number': i + 1,
                    'total_steps': len(result.steps),
                    'step_data': step
                }
                yield f"data: {json.dumps(step_data)}\n\n"
                time.sleep(0.1)  # Small delay for better UX
                
            # Send completion event
            completion_data = {
                'type': 'complete',
                'result': {
                    'steps': result.steps,
                    'total_steps': result.total_steps,
                    'stdout': result.stdout,
                    'execution_time_ms': result.execution_time_ms
                }
            }
            yield f"data: {json.dumps(completion_data)}\n\n"
            
        except Exception as exc:
            error_data = {
                'type': 'error',
                'error': str(exc)
            }
            yield f"data: {json.dumps(error_data)}\n\n"
        finally:
            # Send end event
            yield f"data: {json.dumps({'type': 'end'})}\n\n"

    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        }
    )


@stream_bp.route("/execute-poll", methods=["POST"])
def execute_code_poll():
    """Execute Python code and return job ID for polling."""
    data = request.get_json(force=True)
    try:
        execution_request = ExecutionRequest(**data)
    except Exception as exc:
        return jsonify(error=str(exc)), 422

    # For simplicity, execute immediately and store result
    # In a real app, you'd use a task queue like Celery
    import uuid
    job_id = str(uuid.uuid4())
    
    client_ip = request.remote_addr or "unknown"
    user_agent = request.headers.get("User-Agent", "")
    metadata = ExecutionMetadata(ip_address=client_ip, user_agent=user_agent)

    try:
        result = execution_service.execute(
            code=execution_request.code,
            uid=None,
            metadata=metadata,
        )
        
        # Store result in memory (use Redis/database in production)
        if not hasattr(execute_code_poll, '_results'):
            execute_code_poll._results = {}
        
        execute_code_poll._results[job_id] = {
            'status': 'completed',
            'result': result.model_dump(),
            'timestamp': time.time()
        }
        
    except Exception as exc:
        execute_code_poll._results[job_id] = {
            'status': 'error',
            'error': str(exc),
            'timestamp': time.time()
        }

    return jsonify({
        'job_id': job_id,
        'status': 'submitted',
        'poll_url': f'/api/v1/jobs/{job_id}'
    })


@stream_bp.route("/jobs/<job_id>", methods=["GET"])
def get_job_status(job_id: str):
    """Get execution job status and result."""
    if not hasattr(execute_code_poll, '_results'):
        return jsonify(error="Job not found"), 404
        
    result = execute_code_poll._results.get(job_id)
    if not result:
        return jsonify(error="Job not found"), 404
        
    # Clean up old results (simple TTL)
    if time.time() - result['timestamp'] > 300:  # 5 minutes
        del execute_code_poll._results[job_id]
        return jsonify(error="Job expired"), 404
        
    return jsonify(result)