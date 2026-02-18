"""Application configuration – environment-based settings."""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Application
    APP_NAME: str = "PyTutor 3D Backend"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4

    # Flask
    SECRET_KEY: str = "your-secret-key-change-in-production"

    # Security
    ALLOWED_HOSTS: List[str] = ["*"]
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000",
        "https://pytutor3d.com",
    ]

    # Execution Limits
    MAX_EXECUTION_TIME: int = 10
    MAX_MEMORY_MB: int = 256
    MAX_OUTPUT_LENGTH: int = 10000
    MAX_CODE_LENGTH: int = 50000
    MAX_STEPS: int = 1000

    # Sandbox
    ALLOWED_BUILTINS: List[str] = [
        "abs", "all", "any", "ascii", "bin", "bool", "bytearray", "bytes",
        "chr", "complex", "dict", "dir", "divmod", "enumerate", "filter",
        "float", "format", "frozenset", "hasattr", "hash", "hex", "id",
        "input", "int", "isinstance", "issubclass", "iter", "len", "list",
        "map", "max", "memoryview", "min", "next", "oct", "ord", "pow",
        "print", "range", "repr", "reversed", "round", "set", "slice",
        "sorted", "str", "sum", "tuple", "type", "vars", "zip",
    ]

    BLOCKED_MODULES: List[str] = [
        "os", "sys", "subprocess", "importlib", "builtins", "__builtin__",
        "socket", "urllib", "http", "ftplib", "smtplib", "email", "ctypes",
        "mmap", "resource", "gc", "inspect", "threading", "multiprocessing",
        "asyncio", "concurrent",
    ]

    ALLOWED_MODULES: List[str] = [
        "math", "random", "datetime", "itertools", "collections",
        "functools", "operator", "string", "re", "json", "statistics",
        "decimal", "fractions", "typing", "enum", "dataclasses", "abc",
        "copy", "numbers", "textwrap", "hashlib", "uuid", "time",
    ]

    # Firebase
    FIREBASE_CREDENTIALS_PATH: str = "firebase-service-account.json"
    FIREBASE_API_KEY: str = ""
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_AUTH_DOMAIN: str = ""
    FIREBASE_STORAGE_BUCKET: str = ""

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60


settings = Settings()
