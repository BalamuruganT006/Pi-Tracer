"""Trace / step models – one entry per execution step."""

from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_serializer


def _safe_serialize(v: Any) -> Any:
    """Convert non-JSON-serializable values to strings."""
    if v is None or isinstance(v, (str, int, float, bool)):
        return v
    if isinstance(v, (list, tuple)):
        return [_safe_serialize(item) for item in v]
    if isinstance(v, dict):
        return {str(k): _safe_serialize(val) for k, val in v.items()}
    # Functions, classes, instances, etc.
    try:
        return str(v)
    except Exception:
        return repr(v)


class VariableType(str, Enum):
    INT = "int"
    FLOAT = "float"
    STR = "str"
    BOOL = "bool"
    LIST = "list"
    TUPLE = "tuple"
    DICT = "dict"
    SET = "set"
    FUNCTION = "function"
    CLASS = "class"
    INSTANCE = "instance"
    NONE = "NoneType"
    MODULE = "module"
    OTHER = "other"


class Variable(BaseModel):
    name: str
    value: Any
    type: VariableType
    type_str: str = Field(description="String representation of type")
    id: Optional[int] = Field(None, description="Heap object ID if applicable")
    is_mutable: bool = False
    is_sequence: bool = False
    length: Optional[int] = None
    repr: str = Field("", description="String representation for display")

    @field_serializer("value")
    @classmethod
    def serialize_value(cls, v: Any) -> Any:
        return _safe_serialize(v)


class HeapObject(BaseModel):
    id: int
    type: VariableType
    type_str: str
    value: Any
    repr: str
    size: Optional[int] = None
    length: Optional[int] = None
    references: List[int] = Field(
        default_factory=list, description="Referenced heap IDs"
    )

    @field_serializer("value")
    @classmethod
    def serialize_value(cls, v: Any) -> Any:
        return _safe_serialize(v)


class Frame(BaseModel):
    name: str
    line: int
    filename: str = "<string>"
    locals: Dict[str, Variable] = Field(default_factory=dict)
    globals: Dict[str, str] = Field(
        default_factory=dict, description="Global variable names"
    )
    is_module_level: bool = True


class ExecutionEvent(str, Enum):
    LINE = "line"
    CALL = "call"
    RETURN = "return"
    EXCEPTION = "exception"
    START = "start"
    END = "end"


class ExecutionStep(BaseModel):
    step: int = Field(..., ge=0)
    line: int = Field(..., ge=0)
    code: str = Field(..., description="Source code line")
    event: ExecutionEvent
    event_data: Optional[Dict[str, Any]] = None
    frames: List[Frame] = Field(default_factory=list)
    heap: List[HeapObject] = Field(default_factory=list)
    stdout: str = ""
    exception: Optional[Dict[str, str]] = None
    timestamp: Optional[float] = None
    memory_usage: Optional[int] = None


class TraceData(BaseModel):
    code: str
    steps: List[ExecutionStep]
    total_steps: int
    final_state: Optional[Dict[str, Any]] = None
    max_steps_reached: bool = False
