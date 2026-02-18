"""Seed sample data for development / testing."""

from __future__ import annotations

SAMPLE_PROGRAMS = [
    {
        "title": "Hello World",
        "code": 'print("Hello, World!")',
    },
    {
        "title": "Variables & Types",
        "code": "x = 42\ny = 3.14\nname = 'Alice'\nis_student = True\nprint(x, y, name, is_student)",
    },
    {
        "title": "List Operations",
        "code": "nums = [1, 2, 3]\nnums.append(4)\nfor n in nums:\n    print(n)",
    },
    {
        "title": "Function Definition",
        "code": "def greet(name):\n    return f'Hello, {name}!'\n\nmsg = greet('World')\nprint(msg)",
    },
    {
        "title": "Fibonacci",
        "code": "def fib(n):\n    if n <= 1:\n        return n\n    return fib(n - 1) + fib(n - 2)\n\nfor i in range(8):\n    print(fib(i))",
    },
]

if __name__ == "__main__":
    import json

    print(json.dumps(SAMPLE_PROGRAMS, indent=2))
