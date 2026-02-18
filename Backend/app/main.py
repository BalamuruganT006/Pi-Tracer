"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.api.v1.endpoints import auth, execution, health, sessions
from app.api.v1 import websocket
from app.db.firebase_client import init_firebase
from app.services.executor import execution_service
from app.utils.logger import setup_logging

# Setup logging
setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle hooks."""
    init_firebase()
    print(f"🚀 {settings.APP_NAME} v{settings.VERSION} starting...")
    print(f"🔥 Firebase connected")
    print(f"📡 WebSocket: ws://localhost:{settings.PORT}/ws/execute")
    yield
    print("👋 Shutting down...")
    execution_service.shutdown()


app = FastAPI(
    title=settings.APP_NAME,
    description="Python Tutor 3D Backend – Real-time Python execution with visualization",
    version=settings.VERSION,
    lifespan=lifespan,
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Routes
app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
app.include_router(execution.router, prefix="/api/v1", tags=["execution"])
app.include_router(sessions.router, prefix="/api/v1", tags=["sessions"])
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(websocket.router, tags=["websocket"])


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/api/v1/health",
    }
