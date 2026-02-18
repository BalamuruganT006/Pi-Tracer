"""Authentication endpoints – sign-up, sign-in, profile."""

from __future__ import annotations

import asyncio
from typing import Any, Dict

from flask import Blueprint, request, jsonify, abort

from app.models.user import SignUpRequest, SignInRequest, AuthResponse, UserProfile
from app.services.auth import auth_service, AuthError

auth_bp = Blueprint("auth", __name__)


def _run(coro):
    """Run an async coroutine from synchronous Flask context."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                return pool.submit(asyncio.run, coro).result()
        return loop.run_until_complete(coro)
    except RuntimeError:
        return asyncio.run(coro)


@auth_bp.route("/auth/signup", methods=["POST"])
def sign_up():
    """Register a new user with email & password."""
    data = request.get_json(force=True)
    try:
        req = SignUpRequest(**data)
    except Exception as exc:
        return jsonify(error=str(exc)), 422

    try:
        result = _run(auth_service.sign_up(
            email=req.email,
            password=req.password,
            display_name=req.display_name,
        ))
        return jsonify(AuthResponse(**result).model_dump())
    except AuthError as exc:
        return jsonify(error=str(exc)), 400


@auth_bp.route("/auth/signin", methods=["POST"])
def sign_in():
    """Sign in with email & password."""
    data = request.get_json(force=True)
    try:
        req = SignInRequest(**data)
    except Exception as exc:
        return jsonify(error=str(exc)), 422

    try:
        result = _run(auth_service.sign_in(
            email=req.email,
            password=req.password,
        ))
        return jsonify(AuthResponse(**result).model_dump())
    except AuthError as exc:
        return jsonify(error=str(exc)), 401


@auth_bp.route("/auth/profile")
def get_profile():
    """Get the authenticated user's profile."""
    uid = request.args.get("uid")
    if not uid:
        return jsonify(error="uid query parameter required"), 400
    profile = _run(auth_service.get_user_profile(uid))
    if not profile:
        return jsonify(error="User not found"), 404
    return jsonify(profile)
