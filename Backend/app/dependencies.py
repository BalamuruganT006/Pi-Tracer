"""Flask helpers  shared across routes."""

from typing import Dict, Any, Optional
from functools import wraps

from flask import request, jsonify, abort

from app.services.executor import execution_service
from app.services.session_manager import session_manager


def get_session_manager():
    return session_manager


def get_executor():
    return execution_service
