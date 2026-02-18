"""Health check endpoints."""

from __future__ import annotations

from flask import Blueprint, Response, jsonify

from app.config import settings

health_bp = Blueprint("health", __name__)


@health_bp.route("/health")
def health_check():
    return jsonify(
        status="healthy",
        service=settings.APP_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
    )


@health_bp.route("/ready")
def readiness_check():
    return jsonify(
        ready=True,
        checks={
            "executor": "ok",
            "memory": "ok",
        },
    )


@health_bp.route("/metrics")
def metrics():
    try:
        from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

        return Response(
            response=generate_latest(),
            content_type=CONTENT_TYPE_LATEST,
        )
    except ImportError:
        return jsonify(error="prometheus_client not installed")
