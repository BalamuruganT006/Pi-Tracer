"""Security sandbox – multi-layer code validation & restricted globals."""

import ast
import builtins
import re
from typing import Any, Dict, List, Optional, Tuple

from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


class SecurityError(Exception):
    """Security violation detected."""


class SandboxSecurity:
    """Multi-layer security sandbox for Python code execution."""

    # Dangerous patterns (regex)
    DANGEROUS_PATTERNS: List[Tuple[str, str]] = [
        (r"__import__\s*\(", "Dynamic import detected"),
        (r"import\s+os\b", "OS module import blocked"),
        (r"import\s+sys\b", "Sys module import blocked"),
        (r"import\s+subprocess", "Subprocess import blocked"),
        (r"from\s+os\s+import", "OS module import blocked"),
        (r"from\s+sys\s+import", "Sys module import blocked"),
        (r"__builtins__", "Builtins manipulation blocked"),
        (r"__globals__", "Globals access blocked"),
        (r"__getattribute__\s*\(\s*[\"']__builtins__", "Builtins access blocked"),
        (r"__subclasses__", "Subclass enumeration blocked"),
        (r"__mro__", "MRO access blocked"),
        (r"__bases__", "Bases access blocked"),
        (r"\.popen\s*\(", "Popen blocked"),
        (r"\.system\s*\(", "System call blocked"),
        (r"eval\s*\(", "Eval blocked"),
        (r"exec\s*\(", "Exec blocked"),
        (r"compile\s*\(", "Compile blocked"),
        (r"open\s*\(", "File open blocked"),
        (r"file\s*\(", "File constructor blocked"),
        (r"__loader__", "Loader access blocked"),
        (r"__spec__", "Spec access blocked"),
    ]

    # Dangerous attributes
    DANGEROUS_ATTRIBUTES = {
        "__class__", "__bases__", "__base__", "__mro__", "__subclasses__",
        "__globals__", "__builtins__", "__import__", "__loader__", "__spec__",
        "__package__", "__name__", "__doc__", "__cached__", "__file__",
        "__module__", "__qualname__", "__annotations__", "__kwdefaults__",
        "__defaults__", "__code__", "__closure__", "__dict__",
    }

    # Dangerous builtin functions
    DANGEROUS_BUILTINS = {"eval", "exec", "compile", "__import__", "open", "input"}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    @classmethod
    def validate_code(cls, code: str) -> Tuple[bool, Optional[str]]:
        """Validate code for security violations.

        Returns ``(is_valid, error_message)``.
        """
        try:
            cls._check_patterns(code)
            cls._check_ast(code)
            cls._check_structure(code)
            return True, None
        except SecurityError as exc:
            logger.warning(f"Security violation: {exc}")
            return False, str(exc)
        except SyntaxError as exc:
            return False, f"Syntax error: {exc}"
        except Exception as exc:
            logger.error(f"Validation error: {exc}")
            return False, f"Validation error: {exc}"

    @classmethod
    def create_restricted_globals(cls) -> Dict[str, Any]:
        """Create restricted globals dictionary for execution."""
        return {
            "__builtins__": cls._create_safe_builtins(),
            "__name__": "__main__",
            "__doc__": None,
            "__package__": None,
        }

    @classmethod
    def sanitize_code(cls, code: str) -> str:
        """Sanitize code before execution."""
        code = code.replace("\x00", "")
        code = code.replace("\r\n", "\n").replace("\r", "\n")
        code = "\n".join(line.rstrip() for line in code.split("\n"))
        return code

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    @classmethod
    def _check_patterns(cls, code: str) -> None:
        for pattern, message in cls.DANGEROUS_PATTERNS:
            if re.search(pattern, code, re.IGNORECASE):
                raise SecurityError(message)

    @classmethod
    def _check_ast(cls, code: str) -> None:
        try:
            tree = ast.parse(code)
        except SyntaxError:
            raise

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    root_module = alias.name.split(".")[0]
                    if root_module in settings.BLOCKED_MODULES:
                        raise SecurityError(
                            f"Import of '{alias.name}' is not allowed"
                        )
                    if (
                        root_module not in settings.ALLOWED_MODULES
                        and root_module not in settings.ALLOWED_BUILTINS
                    ):
                        logger.warning(f"Suspicious import: {alias.name}")

            elif isinstance(node, ast.ImportFrom):
                module = node.module or ""
                root_module = module.split(".")[0]
                if root_module in settings.BLOCKED_MODULES:
                    raise SecurityError(
                        f"Import from '{module}' is not allowed"
                    )

            elif isinstance(node, ast.Attribute):
                if node.attr in cls.DANGEROUS_ATTRIBUTES:
                    raise SecurityError(
                        f"Access to '{node.attr}' is not allowed"
                    )

            elif isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name):
                    if node.func.id in cls.DANGEROUS_BUILTINS:
                        raise SecurityError(
                            f"Function '{node.func.id}' is not allowed"
                        )

    @classmethod
    def _check_structure(cls, code: str) -> None:
        lines = code.split("\n")
        if len(lines) > 1000:
            raise SecurityError("Code exceeds maximum line count (1000)")
        if len(code) > settings.MAX_CODE_LENGTH:
            raise SecurityError(
                f"Code exceeds maximum length ({settings.MAX_CODE_LENGTH})"
            )
        non_empty = [line for line in lines if line.strip()]
        if non_empty:
            max_indent = max(
                len(line) - len(line.lstrip()) for line in non_empty
            )
            if max_indent > 200:
                raise SecurityError("Excessive indentation detected")

    @classmethod
    def _create_safe_builtins(cls) -> Dict[str, Any]:
        safe: Dict[str, Any] = {}
        for name in settings.ALLOWED_BUILTINS:
            if hasattr(builtins, name):
                safe[name] = getattr(builtins, name)
        safe["input"] = cls._safe_input
        safe["print"] = cls._safe_print
        safe["open"] = cls._safe_open
        return safe

    @staticmethod
    def _safe_input(prompt: str = "") -> str:
        raise RuntimeError("Input not available in this context")

    @staticmethod
    def _safe_print(*args: Any, **kwargs: Any) -> None:
        pass  # overridden by the execution context

    @staticmethod
    def _safe_open(*args: Any, **kwargs: Any) -> None:
        raise SecurityError("File operations are not allowed")
