"""Background task worker – simple async execution."""

from __future__ import annotations

from typing import Any, Dict


async def execute_code_task(code: str, user_input: str = "") -> Dict[str, Any]:
    """Execute code in the background (used by BackgroundTasks)."""
    from app.core.trace_collector import TraceCollector
    from app.services.sandbox import SandboxSecurity

    is_safe, error = SandboxSecurity.validate_code(code)
    if not is_safe:
        return {"success": False, "error": error}

    collector = TraceCollector(code, user_input)
    trace = collector.execute()
    return {
        "success": True,
        "total_steps": trace.total_steps,
        "stdout": "".join(s.stdout for s in trace.steps),
    }
