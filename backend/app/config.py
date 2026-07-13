from __future__ import annotations

from pydantic_settings import BaseSettings
from functools import lru_cache
import json


class Settings(BaseSettings):
    APP_NAME: str = "SoulClone"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days for dev convenience
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    ALGORITHM: str = "HS256"
    LOGIN_MAX_FAILURES: int = 5
    LOGIN_FAILURE_WINDOW_SECONDS: int = 300

    # Database — development uses SQLite, production uses PostgreSQL
    DATABASE_URL: str = "sqlite+aiosqlite:///./soulclone_dev.db"

    # Redis — "memory" selects fakeredis; any other value uses real Redis
    REDIS_URL: str = "memory"

    OPENAI_API_KEY: str | None = None
    OPENAI_BASE_URL: str | None = None
    ANTHROPIC_API_KEY: str | None = None
    DEFAULT_LLM_MODEL: str = "gpt-4o"
    LLM_FALLBACK_MODELS: str = ""
    LLM_TIMEOUT_SECONDS: float = 45.0
    LLM_MAX_ATTEMPTS_PER_MODEL: int = 2
    LLM_RETRY_BASE_SECONDS: float = 1.0
    LLM_MODEL_COSTS_JSON: str = "{}"
    AI_APPROVAL_TTL_SECONDS: int = 600

    CORS_ORIGINS: str = "http://localhost:5173"
    MAX_UPLOAD_SIZE_MB: int = 10

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT.lower() in ("development", "dev", "local")

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() in ("production", "prod")

    @property
    def is_testing(self) -> bool:
        return self.ENVIRONMENT.lower() in ("testing", "test")

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def use_memory_redis(self) -> bool:
        return self.REDIS_URL.lower() in ("memory", "", "fakeredis")

    @property
    def llm_fallback_models_list(self) -> list[str]:
        return [
            model.strip()
            for model in self.LLM_FALLBACK_MODELS.split(",")
            if model.strip()
        ]

    @property
    def llm_model_costs(self) -> dict[str, dict[str, float]]:
        try:
            parsed = json.loads(self.LLM_MODEL_COSTS_JSON)
        except (TypeError, ValueError):
            return {}
        if not isinstance(parsed, dict):
            return {}
        normalized: dict[str, dict[str, float]] = {}
        for model, rates in parsed.items():
            if not isinstance(rates, dict):
                continue
            try:
                normalized[str(model)] = {
                    "input": float(rates.get("input", 0)),
                    "output": float(rates.get("output", 0)),
                }
            except (TypeError, ValueError):
                continue
        return normalized


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
