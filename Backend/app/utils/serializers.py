"""Data serialization helpers."""

from __future__ import annotations

from typing import Any, Dict, List

try:
    import orjson

    def to_json(obj: Any) -> bytes:
        return orjson.dumps(obj)

    def from_json(data: bytes | str) -> Any:
        return orjson.loads(data)

except ImportError:
    import json

    def to_json(obj: Any) -> bytes:  # type: ignore[misc]
        return json.dumps(obj, default=str).encode()

    def from_json(data: bytes | str) -> Any:  # type: ignore[misc]
        return json.loads(data)


def serialize_trace_steps(steps: List[Dict[str, Any]]) -> bytes:
    """Serialize a list of trace step dicts to JSON bytes."""
    return to_json(steps)
