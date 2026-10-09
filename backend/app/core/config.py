from functools import lru_cache
from typing import Literal, Self

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "ASPA API"
    environment: Literal["local", "test", "staging", "production"] = "local"
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    database_url: str = "postgresql+asyncpg://aspa:aspa@localhost:5432/aspa"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret_key: str = Field(min_length=32, repr=False)
    jwt_algorithm: Literal["HS256"] = "HS256"
    access_token_expire_minutes: int = Field(default=10080, gt=0)
    refresh_token_expire_days: int = Field(default=30, ge=1, le=365)
    auth_rate_limit_requests: int = Field(default=20, gt=0)
    auth_rate_limit_window_seconds: int = Field(default=60, gt=0)
    otp_expire_seconds: int = Field(default=300, ge=60, le=900)
    otp_resend_cooldown_seconds: int = Field(default=60, ge=1, le=300)
    otp_max_attempts: int = Field(default=5, ge=1, le=10)
    readiness_timeout_seconds: float = Field(default=2.0, gt=0, le=10)
    sms_provider: Literal["local", "http"] = "local"
    sms_http_url: str | None = None
    sms_http_token: str | None = Field(default=None, repr=False)
    s3_endpoint: str | None = None
    s3_region: str = "us-east-1"
    s3_bucket: str | None = None
    s3_access_key: str | None = Field(default=None, repr=False)
    s3_secret_key: str | None = Field(default=None, repr=False)
    media_max_bytes: int = Field(default=20971520, ge=1024, le=104857600)
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @model_validator(mode="after")
    def reject_example_secrets(self) -> Self:
        if self.jwt_secret_key.startswith("replace-with-") or self.jwt_secret_key in {
            "development-only-secret-change-me",
            "replace-with-at-least-32-random-characters",
        }:
            raise ValueError("Set JWT_SECRET_KEY to a randomly generated secret")
        if (
            self.environment in {"staging", "production"}
            and self.jwt_secret_key == "local-compose-secret-change-before-production"
        ):
            raise ValueError("Use a unique JWT secret outside local development")
        if self.environment in {"staging", "production"} and self.sms_provider == "local":
            raise ValueError("Configure SMS_PROVIDER=http outside local development")
        if self.sms_provider == "http" and (
            not self.sms_http_url
            or not self.sms_http_url.startswith("https://")
            or not self.sms_http_token
        ):
            raise ValueError("HTTP SMS requires an HTTPS URL and token")
        return self


@lru_cache
def get_settings() -> Settings:
    # Required settings are supplied and validated by BaseSettings from the environment.
    return Settings()  # pyright: ignore[reportCallIssue]
