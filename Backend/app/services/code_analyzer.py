"""Static analysis – quick pre-execution checks & code insights."""

from __future__ import annotations

import ast
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class AnalysisResult:
    has_input: bool = False
    has_print: bool = False
    has_loops: bool = False
    has_functions: bool = False
    has_classes: bool = False
    has_imports: bool = False
    estimated_steps: int = 0
    warnings: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)


class CodeAnalyzer:
    """Lightweight static analyser for Python source."""

    @staticmethod
    def analyze(code: str) -> AnalysisResult:
        result = AnalysisResult()

        try:
            tree = ast.parse(code)
        except SyntaxError as exc:
            result.errors.append(f"SyntaxError: {exc.msg} (line {exc.lineno})")
            return result

        for node in ast.walk(tree):
            if isinstance(node, (ast.Import, ast.ImportFrom)):
                result.has_imports = True
            elif isinstance(node, (ast.For, ast.While)):
                result.has_loops = True
            elif isinstance(node, ast.FunctionDef):
                result.has_functions = True
            elif isinstance(node, ast.ClassDef):
                result.has_classes = True
            elif isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name):
                    if node.func.id == "input":
                        result.has_input = True
                    elif node.func.id == "print":
                        result.has_print = True

        # Rough step estimate
        result.estimated_steps = len(code.splitlines()) * 2

        return result

    @staticmethod
    def quick_syntax_check(code: str) -> Optional[str]:
        try:
            compile(code, "<string>", "exec")
            return None
        except SyntaxError as exc:
            return f"SyntaxError: {exc.msg} at line {exc.lineno}"
