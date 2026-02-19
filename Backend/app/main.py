"""Flask application entry point."""

from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO

from app.config import settings
from app.utils.logger import setup_logging

# Setup logging
setup_logging()

# Flask app & SocketIO instance (created at import time so blueprints can reference socketio)
app = Flask(__name__)
app.config["SECRET_KEY"] = settings.SECRET_KEY

# CORS
CORS(
    app,
    origins=settings.CORS_ORIGINS,
    supports_credentials=True,
    allow_headers=["*"],
    methods=["*"],
)

# SocketIO (gevent for production-ready async WebSocket)
socketio = SocketIO(
    app,
    cors_allowed_origins=settings.CORS_ORIGINS,
    async_mode="threading",
)

# ------------------------------------------------------------------
# Register blueprints (imported after app creation to avoid circular deps)
# ------------------------------------------------------------------
from app.api.v1.endpoints.execution import execution_bp  # noqa: E402
from app.api.v1.endpoints.sessions import sessions_bp    # noqa: E402
from app.api.v1.endpoints.health import health_bp        # noqa: E402
from app.api.v1.endpoints.stream import stream_bp        # noqa: E402

app.register_blueprint(execution_bp, url_prefix="/api/v1")
app.register_blueprint(sessions_bp, url_prefix="/api/v1")
app.register_blueprint(health_bp, url_prefix="/api/v1")
app.register_blueprint(stream_bp, url_prefix="/api/v1")

# Note: WebSocket events removed - using SSE/HTTP alternatives instead


@app.before_request
def _startup_once():
    """Lazy one-time initialisation on first request (replaces lifespan)."""
    if not getattr(app, "_pi_tracer_ready", False):
        print(f"🚀 {settings.APP_NAME} v{settings.VERSION} starting...")
        print(f"📡 WebSocket: ws://localhost:{settings.PORT}/socket.io")
        app._pi_tracer_ready = True


@app.route("/")
def root():
    return jsonify(
        name=settings.APP_NAME,
        version=settings.VERSION,
        docs="/api/v1/health",
        health="/api/v1/health",
    )


@app.errorhandler(Exception)
def handle_exception(e):
    """Global error handler that returns JSON."""
    import traceback
    traceback.print_exc()
    return jsonify(error=str(e)), getattr(e, "code", 500)

# ------------------------------------------------------------------
# Entry-point when run directly: python -m app.main
# ------------------------------------------------------------------
if __name__ == "__main__":
    socketio.run(
        app,
        host=settings.HOST,
        port=settings.PORT,
        debug=True,
    )
