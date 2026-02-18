"""Low-level execution engine – compile & run user code."""

from __future__ import annotations

from typing import Any, Dict


def compile_code(code: str, filename: str = "<string>") -> Any:
    """Compile user code and return a code object."""
    return compile(code, filename, "exec")


def execute_code(compiled: Any, exec_globals: Dict[str, Any]) -> None:
    """Execute a compiled code object inside *exec_globals*."""
    exec(compiled, exec_globals)  # noqa: S102
