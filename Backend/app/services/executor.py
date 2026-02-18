"""Main execution orchestrator with process isolation & streaming."""

from __future__ import annotations

import asyncio
import multiprocessing
import time
from concurrent.futures import ProcessPoolExecutor
from dataclasses import dataclass
from typing import Any, Callable, Dict, Optional

from app.config import settings
from app.core.trace_collector import TraceCollector
from app.models.execution import ExecutionStatus
from app.models.trace import TraceData
from app.services.sandbox import SandboxSecurity
from app.utils.logger import get_logger

logger = get_logger(__name__)


# ------------------------------------------------------------------
# Dataclass returned from every execution attempt
# ------------------------------------------------------------------

@dataclass
class ExecutionResult:
    success: bool
    trace_data: Optional[TraceData]
    stdout: str
    stderr: Optional[str]
    error: Optional[str]
    execution_time: float
    status: ExecutionStatus


# ------------------------------------------------------------------
# Subprocess target – runs in an isolated worker process
# ------------------------------------------------------------------

def _execute_in_subprocess(
    code: str, user_input: str, max_steps: int
) -> Dict[str, Any]:
    """Execute code in an isolated subprocess."""
    # Resource limits (Unix only)
    try:
        import resource

        resource.setrlimit(
            resource.RLIMIT_AS,
            (settings.MAX_MEMORY_MB * 1024 * 1024, -1),
        )
        resource.setrlimit(
            resource.RLIMIT_CPU,
            (settings.MAX_EXECUTION_TIME + 1, -1),
        )
    except ImportError:
        pass  # Windows

    # Security validation
    is_safe, error = SandboxSecurity.validate_code(code)
    if not is_safe:
        return {
            "success": False,
            "error": error,
            "status": ExecutionStatus.SECURITY_VIOLATION,
            "steps": [],
        }

    try:
        collector = TraceCollector(code, user_input)
        trace_data = collector.execute()
        stdout = "".join(step.stdout for step in trace_data.steps)

        return {
            "success": True,
            "trace": trace_data,
            "stdout": stdout,
            "stderr": None,
            "error": None,
            "status": ExecutionStatus.COMPLETED,
            "total_steps": trace_data.total_steps,
            "max_steps_reached": trace_data.max_steps_reached,
        }
    except MemoryError:
        return {
            "success": False,
            "error": "Memory limit exceeded",
            "status": ExecutionStatus.ERROR,
            "steps": [],
        }
    except RecursionError:
        return {
            "success": False,
            "error": "Maximum recursion depth exceeded",
            "status": ExecutionStatus.ERROR,
            "steps": [],
        }
    except Exception as exc:
        return {
            "success": False,
            "error": str(exc),
            "status": ExecutionStatus.ERROR,
            "steps": [],
        }


# ------------------------------------------------------------------
# Service class
# ------------------------------------------------------------------

class ExecutionService:
    """Main execution service with process isolation and streaming."""

    def __init__(self) -> None:
        self.process_pool = ProcessPoolExecutor(
            max_workers=settings.WORKERS,
            mp_context=multiprocessing.get_context("spawn"),
        )
        self.active_executions: Dict[str, asyncio.Task] = {}

    async def execute(
        self,
        code: str,
        user_input: str = "",
        session_id: Optional[str] = None,
    ) -> ExecutionResult:
        """Execute code with full trace collection."""
        start_time = time.time()

        # Quick syntax check before spawning a process
        try:
            compile(code, "<string>", "exec")
        except SyntaxError as exc:
            return ExecutionResult(
                success=False,
                trace_data=None,
                stdout="",
                stderr=None,
                error=f"SyntaxError: {exc.msg} at line {exc.lineno}",
                execution_time=time.time() - start_time,
                status=ExecutionStatus.ERROR,
            )

        loop = asyncio.get_event_loop()
        try:
            future = loop.run_in_executor(
                self.process_pool,
                _execute_in_subprocess,
                code,
                user_input,
                settings.MAX_STEPS,
            )
            result = await asyncio.wait_for(
                future, timeout=settings.MAX_EXECUTION_TIME
            )
            execution_time = time.time() - start_time

            if result["status"] == ExecutionStatus.SECURITY_VIOLATION:
                return ExecutionResult(
                    success=False,
                    trace_data=None,
                    stdout="",
                    stderr=None,
                    error=result["error"],
                    execution_time=execution_time,
                    status=ExecutionStatus.SECURITY_VIOLATION,
                )

            return ExecutionResult(
                success=result["success"],
                trace_data=result.get("trace"),
                stdout=result.get("stdout", ""),
                stderr=result.get("stderr"),
                error=result.get("error"),
                execution_time=execution_time,
                status=result["status"],
            )

        except asyncio.TimeoutError:
            return ExecutionResult(
                success=False,
                trace_data=None,
                stdout="",
                stderr=None,
                error=f"Execution timed out after {settings.MAX_EXECUTION_TIME}s",
                execution_time=float(settings.MAX_EXECUTION_TIME),
                status=ExecutionStatus.TIMEOUT,
            )

        except Exception as exc:
            logger.exception("Execution failed")
            return ExecutionResult(
                success=False,
                trace_data=None,
                stdout="",
                stderr=None,
                error=f"Execution error: {exc}",
                execution_time=time.time() - start_time,
                status=ExecutionStatus.ERROR,
            )

    async def execute_streaming(
        self,
        code: str,
        user_input: str,
        callback: Callable[[Dict[str, Any]], Any],
    ) -> ExecutionResult:
        """Execute with streaming step updates via *callback*."""
        result = await self.execute(code, user_input)

        if result.trace_data:
            for i, step in enumerate(result.trace_data.steps):
                await callback(
                    {
                        "type": "step",
                        "step_number": i + 1,
                        "total_steps": len(result.trace_data.steps),
                        "data": step.model_dump(),
                    }
                )
                await asyncio.sleep(0.01)

        await callback(
            {
                "type": "complete",
                "success": result.success,
                "stdout": result.stdout,
                "error": result.error,
                "execution_time": result.execution_time,
            }
        )

        return result

    async def cancel_execution(self, session_id: str) -> bool:
        if session_id in self.active_executions:
            self.active_executions[session_id].cancel()
            return True
        return False

    def shutdown(self) -> None:
        self.process_pool.shutdown(wait=True)


# Global singleton
execution_service = ExecutionService()
