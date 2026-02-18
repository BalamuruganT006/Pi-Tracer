"""Health check endpoints."""

from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import Response

from app.config import settings

router = APIRouter()


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }


@router.get("/ready")
async def readiness_check():
    return {
        "ready": True,
        "checks": {
            "executor": "ok",
            "memory": "ok",
        },
    }


@router.get("/metrics")
async def metrics():
    try:
        from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

        return Response(
            content=generate_latest(),
            media_type=CONTENT_TYPE_LATEST,
        )
    except ImportError:
        return {"error": "prometheus_client not installed"}
