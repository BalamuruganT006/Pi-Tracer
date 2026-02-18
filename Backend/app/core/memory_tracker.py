"""Heap object tracking – utilities used by the trace collector."""

from __future__ import annotations

import sys
from typing import Any, Dict, Optional


class MemoryTracker:
    """Tracks heap-allocated objects and assigns stable IDs."""

    def __init__(self) -> None:
        self._id_map: Dict[int, int] = {}
        self._next_id: int = 1

    def get_id(self, obj: Any) -> int:
        """Return a stable integer ID for *obj*, creating one if needed."""
        py_id = id(obj)
        if py_id not in self._id_map:
            self._id_map[py_id] = self._next_id
            self._next_id += 1
        return self._id_map[py_id]

    def known(self, obj: Any) -> bool:
        return id(obj) in self._id_map

    def size_of(self, obj: Any) -> Optional[int]:
        try:
            return sys.getsizeof(obj)
        except Exception:
            return None

    def reset(self) -> None:
        self._id_map.clear()
        self._next_id = 1
