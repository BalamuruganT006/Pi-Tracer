"""Execution data models – request / response schemas."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ExecutionStatus(str, Enum):
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    ERROR = "error"
    TIMEOUT = "timeout"
    CANCELLED = "cancelled"
    SECURITY_VIOLATION = "security_violation"


class ExecutionRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "code": "x = [1, 2, 3]\nfor i in x:\n    print(i)",
                "user_input": "",
                "options": {"trace": True, "max_steps": 1000},
            }
        }
    )

    code: str = Field(
        ..., min_length=1, max_length=50000, description="Python code to execute"
    )
    user_input: Optional[str] = Field(
        default="", max_length=10000, description="Input for input() function"
    )
    session_id: Optional[str] = Field(
        default=None, description="Existing session ID for continuation"
    )
    options: Optional[Dict[str, Any]] = Field(
        default_factory=dict, description="Execution options"
    )

    def model_post_init(self, __context: Any) -> None:
        if self.options is None:
            self.options = {}


class ExecutionMetadata(BaseModel):
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    execution_time_ms: Optional[float] = None
    memory_usage_mb: Optional[float] = None


class ExecutionResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "status": "completed",
                "steps": [],
                "total_steps": 5,
                "stdout": "1\n2\n3\n",
                "stderr": None,
                "execution_time": 0.045,
            }
        }
    )

    session_id: str
    status: ExecutionStatus
    steps: Optional[List[Dict[str, Any]]] = None
    total_steps: int = 0
    current_step: int = 0
    stdout: str = ""
    stderr: Optional[str] = None
    error: Optional[str] = None
    execution_time: Optional[float] = None
    metadata: Optional[ExecutionMetadata] = None


class ExecutionSession(BaseModel):
    """Stored execution session."""

    session_id: str
    code: str
    status: ExecutionStatus
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    trace_data: Optional[List[Dict[str, Any]]] = None
    stdout: str = ""
    stderr: Optional[str] = None
    error: Optional[str] = None
    execution_time: Optional[float] = None
    metadata: Optional[ExecutionMetadata] = None
