# PyTutor 3D Backend – API Reference

## Base URL

```
http://localhost:8000/api/v1
```

---

## Endpoints

### Health

| Method | Path       | Description       |
|--------|------------|-------------------|
| GET    | `/health`  | Health check      |
| GET    | `/ready`   | Readiness check   |
| GET    | `/metrics` | Prometheus metrics |

### Execution

| Method | Path              | Description                        |
|--------|-------------------|------------------------------------|
| POST   | `/execute`        | Execute code with full trace       |
| POST   | `/execute/simple` | Execute without tracing (faster)   |
| GET    | `/execute/stream` | SSE stream of execution steps      |

#### POST `/execute`

**Request body:**

```json
{
  "code": "x = [1, 2, 3]\nfor i in x:\n    print(i)",
  "user_input": "",
  "session_id": null,
  "options": {
    "trace": true,
    "max_steps": 1000
  }
}
```

**Response:**

```json
{
  "session_id": "550e8400-...",
  "status": "completed",
  "steps": [ ... ],
  "total_steps": 12,
  "current_step": 12,
  "stdout": "1\n2\n3\n",
  "stderr": null,
  "error": null,
  "execution_time": 0.045
}
```

### Sessions

| Method | Path                   | Description        |
|--------|------------------------|--------------------|
| GET    | `/sessions`            | List sessions      |
| GET    | `/sessions/{id}`       | Get session by ID  |
| DELETE | `/sessions/{id}`       | Delete session     |

---

## WebSocket

### Execute (streaming)

```
ws://localhost:8000/ws/execute?session_id=...&streaming=true
```

**Send:**

```json
{ "action": "execute", "code": "print('hi')", "user_input": "" }
```

**Receive (per step):**

```json
{ "type": "step", "data": { "step": 1, "line": 1, "code": "print('hi')", ... } }
```

**Receive (completion):**

```json
{ "type": "complete", "success": true, "stdout": "hi\n", "execution_time": 0.02 }
```

### Collaborate

```
ws://localhost:8000/ws/collaborate/{room_id}
```

Broadcasts JSON messages to all other participants in the room.

---

## Running

```bash
# Development
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Docker
docker-compose -f docker/docker-compose.yml up --build

# Tests
pytest tests/ -v --cov=app
```
