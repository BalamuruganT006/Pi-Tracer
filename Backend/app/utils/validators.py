"""Input validation helpers."""

from __future__ import annotations

from typing import Optional, Tuple

from app.config import settings


def validate_code(code: str) -> Tuple[bool, Optional[str]]:
    """Basic length / emptiness checks before deeper analysis."""
    if not code or not code.strip():
        return False, "Code cannot be empty"
    if len(code) > settings.MAX_CODE_LENGTH:
        return False, f"Code exceeds {settings.MAX_CODE_LENGTH} characters"
    return True, None


def validate_user_input(user_input: str) -> Tuple[bool, Optional[str]]:
    if len(user_input) > settings.MAX_OUTPUT_LENGTH:
        return False, f"User input exceeds {settings.MAX_OUTPUT_LENGTH} characters"
    return True, None
