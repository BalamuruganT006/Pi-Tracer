"""Trace data collection using sys.settrace."""

from __future__ import annotations

import builtins
import sys
import time
import types
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional

from app.config import settings
from app.models.trace import (
    ExecutionEvent,
    ExecutionStep,
    Frame,
    HeapObject,
    TraceData,
    Variable,
    VariableType,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)


# ------------------------------------------------------------------
# Internal state
# ------------------------------------------------------------------

@dataclass
class CollectorState:
    """Mutable state carried throughout a single trace run."""

    steps: List[ExecutionStep] = field(default_factory=list)
    heap_objects: Dict[int, HeapObject] = field(default_factory=dict)
    object_id_map: Dict[int, int] = field(default_factory=dict)
    next_heap_id: int = 1
    stdout_buffer: List[str] = field(default_factory=list)
    call_stack: List[Frame] = field(default_factory=list)
    current_step: int = 0
    code_lines: List[str] = field(default_factory=list)
    start_time: float = 0.0
    max_steps_reached: bool = False

    # ---- heap helpers ----

    def get_heap_id(self, obj: Any) -> int:
        obj_id = id(obj)
        if obj_id in self.object_id_map:
            return self.object_id_map[obj_id]
        heap_id = self.next_heap_id
        self.next_heap_id += 1
        self.object_id_map[obj_id] = heap_id
        self.heap_objects[heap_id] = self._create_heap_object(obj, heap_id)
        return heap_id

    def _create_heap_object(self, obj: Any, heap_id: int) -> HeapObject:
        type_name = type(obj).__name__
        var_type = classify_type(obj)
        value, repr_str, length = serialize_object(obj, self)
        references = self._get_references(obj)
        return HeapObject(
            id=heap_id,
            type=var_type,
            type_str=type_name,
            value=value,
            repr=repr_str,
            size=sys.getsizeof(obj) if hasattr(obj, "__sizeof__") else None,
            length=length,
            references=references,
        )

    def _get_references(self, obj: Any) -> List[int]:
        refs: List[int] = []
        vt = classify_type(obj)
        mutable_types = {
            VariableType.LIST, VariableType.DICT, VariableType.SET,
            VariableType.TUPLE, VariableType.INSTANCE,
        }
        if vt in (VariableType.LIST, VariableType.TUPLE):
            for item in obj:
                if classify_type(item) in mutable_types:
                    refs.append(self.get_heap_id(item))
        elif vt == VariableType.DICT:
            for v in obj.values():
                if classify_type(v) in mutable_types:
                    refs.append(self.get_heap_id(v))
        elif vt == VariableType.SET:
            for item in obj:
                if classify_type(item) in mutable_types:
                    refs.append(self.get_heap_id(item))
        return list(set(refs))


# ------------------------------------------------------------------
# Helpers (module-level for pickle-ability)
# ------------------------------------------------------------------

def classify_type(obj: Any) -> VariableType:
    if obj is None:
        return VariableType.NONE
    if isinstance(obj, bool):
        return VariableType.BOOL
    if isinstance(obj, int):
        return VariableType.INT
    if isinstance(obj, float):
        return VariableType.FLOAT
    if isinstance(obj, str):
        return VariableType.STR
    if isinstance(obj, list):
        return VariableType.LIST
    if isinstance(obj, tuple):
        return VariableType.TUPLE
    if isinstance(obj, dict):
        return VariableType.DICT
    if isinstance(obj, set):
        return VariableType.SET
    if isinstance(obj, types.FunctionType):
        return VariableType.FUNCTION
    if isinstance(obj, type):
        return VariableType.CLASS
    if hasattr(obj, "__class__") and not isinstance(obj, type):
        return VariableType.INSTANCE
    return VariableType.OTHER


def serialize_object(
    obj: Any, state: CollectorState | None = None
) -> tuple[Any, str, int | None]:
    """Return ``(value, repr_str, length)``."""
    vt = classify_type(obj)

    if vt == VariableType.NONE:
        return None, "None", None
    if vt in (VariableType.INT, VariableType.FLOAT, VariableType.BOOL):
        return obj, repr(obj), None
    if vt == VariableType.STR:
        s = str(obj)
        if len(s) > 100:
            s = s[:100] + "..."
        return s, repr(obj), len(obj)
    if vt in (VariableType.LIST, VariableType.TUPLE):
        items = []
        for i, item in enumerate(obj):
            if i >= 50:
                items.append("...")
                break
            items.append(_serialize_reference(item, state))
        return items, repr(obj)[:200], len(obj)
    if vt == VariableType.DICT:
        items: dict[str, Any] = {}
        for i, (k, v) in enumerate(obj.items()):
            if i >= 50:
                items["..."] = "..."
                break
            items[str(k)[:50]] = _serialize_reference(v, state)
        return items, repr(obj)[:200], len(obj)
    if vt == VariableType.SET:
        items_list: list[Any] = []
        for i, item in enumerate(obj):
            if i >= 50:
                items_list.append("...")
                break
            items_list.append(_serialize_reference(item, state))
        return items_list, repr(obj)[:200], len(obj)
    if vt == VariableType.FUNCTION:
        return (
            {"name": obj.__name__,
             "args": str(obj.__code__.co_varnames[:obj.__code__.co_argcount])
             if hasattr(obj, "__code__") else "?"},
            f"<function {obj.__name__}>",
            None,
        )
    if vt == VariableType.CLASS:
        return {"name": obj.__name__}, f"<class {obj.__name__}>", None
    if vt == VariableType.INSTANCE:
        cn = obj.__class__.__name__
        return {"class": cn}, f"<{cn} object>", None
    return str(type(obj)), repr(obj)[:100], None


def _serialize_reference(obj: Any, state: CollectorState | None) -> Any:
    vt = classify_type(obj)
    heap_types = {
        VariableType.LIST, VariableType.DICT, VariableType.SET,
        VariableType.TUPLE, VariableType.INSTANCE,
    }
    if vt in heap_types and state is not None:
        heap_id = state.get_heap_id(obj)
        return {"__ref__": heap_id, "__type__": vt.value}
    return serialize_object(obj, state)[0]


# ------------------------------------------------------------------
# TraceCollector
# ------------------------------------------------------------------

class TraceCollector:
    """Collects execution trace using ``sys.settrace``."""

    def __init__(self, code: str, user_input: str = "") -> None:
        self.code = code
        self.user_input = user_input
        self.state = CollectorState()
        self.state.code_lines = code.split("\n")
        self.original_trace: Any = None
        self.input_lines = user_input.split("\n") if user_input else []
        self.input_index = 0
        self.stdout_capture: List[str] = []

    # ---- sys.settrace callback ----

    def trace_function(
        self,
        frame: types.FrameType,
        event: str,
        arg: Any,
    ) -> Optional[Callable[..., Any]]:
        if self._is_internal_frame(frame):
            return self.trace_function
        if self.state.current_step >= settings.MAX_STEPS:
            self.state.max_steps_reached = True
            return None

        if event == "line":
            self._handle_line(frame)
        elif event == "call":
            self._handle_call(frame, arg)
        elif event == "return":
            self._handle_return(frame, arg)
        elif event == "exception":
            self._handle_exception(frame, arg)

        return self.trace_function

    # ---- event handlers ----

    def _handle_line(self, frame: types.FrameType) -> None:
        self.state.current_step += 1
        self._create_step(frame, ExecutionEvent.LINE)

    def _handle_call(self, frame: types.FrameType, arg: Any) -> None:
        self.state.current_step += 1
        self._create_step(
            frame, ExecutionEvent.CALL,
            {"function": frame.f_code.co_name},
        )

    def _handle_return(self, frame: types.FrameType, arg: Any) -> None:
        self.state.current_step += 1
        self._create_step(
            frame, ExecutionEvent.RETURN,
            {"return_value": _serialize_reference(arg, self.state)},
        )

    def _handle_exception(self, frame: types.FrameType, arg: Any) -> None:
        self.state.current_step += 1
        exc_type, exc_value, _ = arg
        self._create_step(
            frame, ExecutionEvent.EXCEPTION,
            {"exception_type": exc_type.__name__, "exception_msg": str(exc_value)},
        )

    # ---- step creation ----

    def _create_step(
        self,
        frame: types.FrameType,
        event: ExecutionEvent,
        event_data: Optional[Dict[str, Any]] = None,
    ) -> None:
        lineno = frame.f_lineno
        code_line = ""
        if 1 <= lineno <= len(self.state.code_lines):
            code_line = self.state.code_lines[lineno - 1].rstrip()

        frames = self._build_frames(frame)
        heap = list(self.state.heap_objects.values())
        stdout = "".join(self.stdout_capture)
        self.stdout_capture.clear()

        step = ExecutionStep(
            step=self.state.current_step,
            line=lineno,
            code=code_line,
            event=event,
            event_data=event_data or {},
            frames=frames,
            heap=heap,
            stdout=stdout,
            timestamp=time.time() - self.state.start_time,
        )
        self.state.steps.append(step)

    # ---- frame helpers ----

    @staticmethod
    def _is_internal_frame(frame: types.FrameType) -> bool:
        filename = frame.f_code.co_filename
        patterns = [
            "trace_collector.py", "executor.py", "sandbox.py",
            "importlib", "<frozen", "collections", "typing",
            "abc.py", "dataclasses.py", "multiprocessing", "spawn",
            "concurrent", "threading", "runpy",
        ]
        return any(p in filename for p in patterns)

    def _build_frames(self, current_frame: types.FrameType) -> List[Frame]:
        frames: List[Frame] = []
        frame: Optional[types.FrameType] = current_frame
        while frame:
            if not self._is_internal_frame(frame):
                frames.insert(0, self._create_frame(frame))
            frame = frame.f_back
        return frames

    # Internal names to filter from locals (injected by multiprocessing/spawn)
    _INTERNAL_NAMES = frozenset([
        "spawn_main", "_main", "freeze_support", "set_start_method",
        "Process", "Queue", "pool", "_fork", "_forkserver",
    ])

    def _create_frame(self, frame: types.FrameType) -> Frame:
        code = frame.f_code
        locals_dict: Dict[str, Variable] = {}
        for name, value in frame.f_locals.items():
            # Skip dunder names and internal multiprocessing names
            if name.startswith("__") or name.endswith("__"):
                continue
            if name in self._INTERNAL_NAMES:
                continue
            if callable(value) and hasattr(value, "__module__") and value.__module__ and "multiprocessing" in value.__module__:
                continue
            locals_dict[name] = self._create_variable(name, value)

        globals_names = {
            name: name
            for name in frame.f_globals
            if not name.startswith("__") 
            and not name.endswith("__")
            and name not in self._INTERNAL_NAMES
        }

        return Frame(
            name=code.co_name or "<module>",
            line=frame.f_lineno,
            filename=code.co_filename,
            locals=locals_dict,
            globals=globals_names,
            is_module_level=(code.co_name == "<module>"),
        )

    def _create_variable(self, name: str, value: Any) -> Variable:
        var_type = classify_type(value)
        type_str = type(value).__name__
        is_mutable = var_type in (VariableType.LIST, VariableType.DICT, VariableType.SET)
        is_sequence = var_type in (VariableType.LIST, VariableType.TUPLE, VariableType.STR)

        length: Optional[int] = None
        if hasattr(value, "__len__") and not isinstance(value, (type, types.FunctionType)):
            try:
                length = len(value)
            except Exception:
                pass

        heap_types = {
            VariableType.LIST, VariableType.DICT, VariableType.SET,
            VariableType.TUPLE, VariableType.INSTANCE,
        }
        if var_type in heap_types:
            heap_id = self.state.get_heap_id(value)
            repr_str = f"<{type_str} ref={heap_id}>"
            display_value: Any = f"ref:{heap_id}"
        else:
            _, repr_str, _ = serialize_object(value, self.state)
            display_value = value
            heap_id = None

        return Variable(
            name=name,
            value=display_value,
            type=var_type,
            type_str=type_str,
            id=heap_id,
            is_mutable=is_mutable,
            is_sequence=is_sequence,
            length=length,
            repr=repr_str,
        )

    # ---- custom builtins ----

    def _custom_input(self, prompt: str = "") -> str:
        if self.input_index < len(self.input_lines):
            result = self.input_lines[self.input_index]
            self.input_index += 1
            self.stdout_capture.append(f"{prompt}{result}\n")
            return result
        self.stdout_capture.append(f"{prompt}\n")
        return ""

    def _custom_print(self, *args: Any, sep: str = " ", end: str = "\n", **kwargs: Any) -> None:
        output = sep.join(str(a) for a in args) + end
        self.stdout_capture.append(output)

    @staticmethod
    def _blocked_open(*args: Any, **kwargs: Any) -> None:
        raise PermissionError("File operations are not allowed")

    def _create_safe_builtins(self) -> Dict[str, Any]:
        safe: Dict[str, Any] = {}
        for name in settings.ALLOWED_BUILTINS:
            if hasattr(builtins, name):
                safe[name] = getattr(builtins, name)
        safe["input"] = self._custom_input
        safe["print"] = self._custom_print
        safe["open"] = self._blocked_open
        return safe

    # ---- main entry point ----

    def execute(self) -> TraceData:
        """Execute code with tracing enabled and return the full trace."""
        self.state.start_time = time.time()

        # Initial "start" step
        self.state.steps.append(
            ExecutionStep(
                step=0,
                line=1,
                code=self.state.code_lines[0] if self.state.code_lines else "",
                event=ExecutionEvent.START,
                frames=[Frame(name="<module>", line=1, locals={}, globals={})],
                heap=[],
                stdout="",
            )
        )

        exec_globals: Dict[str, Any] = {
            "__builtins__": self._create_safe_builtins(),
            "__name__": "__main__",
            "__doc__": None,
        }

        self.original_trace = sys.gettrace()
        sys.settrace(self.trace_function)

        try:
            compiled = compile(self.code, "<string>", "exec")
            exec(compiled, exec_globals)  # noqa: S102

            self.state.steps.append(
                ExecutionStep(
                    step=self.state.current_step + 1,
                    line=len(self.state.code_lines),
                    code="",
                    event=ExecutionEvent.END,
                    frames=self.state.steps[-1].frames if self.state.steps else [],
                    heap=list(self.state.heap_objects.values()),
                    stdout="".join(self.stdout_capture),
                )
            )
        except Exception as exc:
            if not any(s.event == ExecutionEvent.EXCEPTION for s in self.state.steps):
                self.state.steps.append(
                    ExecutionStep(
                        step=self.state.current_step + 1,
                        line=len(self.state.code_lines),
                        code="",
                        event=ExecutionEvent.EXCEPTION,
                        frames=self.state.steps[-1].frames if self.state.steps else [],
                        heap=list(self.state.heap_objects.values()),
                        stdout="".join(self.stdout_capture),
                        exception={"type": type(exc).__name__, "message": str(exc)},
                    )
                )
        finally:
            sys.settrace(self.original_trace)

        return TraceData(
            code=self.code,
            steps=self.state.steps,
            total_steps=len(self.state.steps),
            max_steps_reached=self.state.max_steps_reached,
        )
