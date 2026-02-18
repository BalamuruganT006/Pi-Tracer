"""Code tracing engine – thin wrapper around TraceCollector for service use."""

from __future__ import annotations

from typing import Optional

from app.core.trace_collector import TraceCollector
from app.models.trace import TraceData
from app.services.sandbox import SandboxSecurity


class TracerService:
    """High-level API consumed by the execution service."""

    @staticmethod
    def trace(code: str, user_input: str = "", max_steps: int = 1000) -> TraceData:
        sanitized = SandboxSecurity.sanitize_code(code)
        collector = TraceCollector(sanitized, user_input)
        return collector.execute()

    @staticmethod
    def validate(code: str) -> tuple[bool, Optional[str]]:
        return SandboxSecurity.validate_code(code)
