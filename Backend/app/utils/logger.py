"""Logging setup – structured JSON logging via structlog."""

from __future__ import annotations

import logging
import sys

from app.config import settings


def get_logger(name: str) -> logging.Logger:
    """Return a stdlib logger for the given module name."""
    return logging.getLogger(name)


def setup_logging() -> None:
    """Configure root logging for the application."""
    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    try:
        import structlog

        structlog.configure(
            processors=[
                structlog.contextvars.merge_contextvars,
                structlog.processors.add_log_level,
                structlog.processors.StackInfoRenderer(),
                structlog.dev.set_exc_info,
                structlog.processors.TimeStamper(fmt="iso"),
                (
                    structlog.dev.ConsoleRenderer()
                    if settings.LOG_FORMAT != "json"
                    else structlog.processors.JSONRenderer()
                ),
            ],
            wrapper_class=structlog.make_filtering_bound_logger(level),
            context_class=dict,
            logger_factory=structlog.PrintLoggerFactory(),
            cache_logger_on_first_use=True,
        )
    except ImportError:
        pass  # structlog optional

    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        stream=sys.stdout,
    )
