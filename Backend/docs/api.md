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

## WebSocket (Socket.IO)

### Execute (streaming)

Connect via Socket.IO to `http://localhost:8000` with query params:

```
?session_id=...&streaming=true
```

**Emit event `execute`:**

```json
{ "code": "print('hi')", "user_input": "" }
```

**Receive `message` events (per step):**

```json
{ "type": "step", "data": { "step": 1, "line": 1, "code": "print('hi')", ... } }
```

**Receive `message` (completion):**

```json
{ "type": "complete", "success": true, "stdout": "hi\n", "execution_time": 0.02 }
```

### Collaborate

Emit `join_room` with `{ "room_id": "<room_id>" }` to join.
Emit `broadcast` with `{ "room_id": "<room_id>", "data": { ... } }` to broadcast.

---

## Running

```bash
# Development
python -m app.main

# Or with flask CLI
flask --app app.main:app run --host 0.0.0.0 --port 8000 --reload

# Production (gunicorn)
gunicorn --worker-class gevent -w 4 -b 0.0.0.0:8000 app.main:app

# Docker
docker-compose -f docker/docker-compose.yml up --build

# Tests
pytest tests/ -v --cov=app
```
