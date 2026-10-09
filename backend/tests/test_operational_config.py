import pytest
from pydantic import ValidationError

from app.core.config import Settings

SECRET = "test-only-secret-not-for-deployment-0123456789"


def test_production_rejects_local_sms():
    with pytest.raises(ValidationError, match="SMS_PROVIDER"):
        Settings(_env_file=None, jwt_secret_key=SECRET, environment="production")


def test_http_sms_requires_authenticated_https():
    with pytest.raises(ValidationError, match="HTTPS"):
        Settings(
            _env_file=None,
            jwt_secret_key=SECRET,
            sms_provider="http",
            sms_http_url="http://invalid",
            sms_http_token="test",
        )
    settings = Settings(
        _env_file=None,
        jwt_secret_key=SECRET,
        environment="production",
        sms_provider="http",
        sms_http_url="https://sms.example.test/send",
        sms_http_token="test",
    )
    assert settings.sms_provider == "http"


async def test_request_id_on_errors_and_success(client):
    healthy = await client.get("/health")
    missing = await client.get("/does-not-exist")
    assert healthy.headers["X-Request-ID"] != missing.headers["X-Request-ID"]
    assert missing.status_code == 404


def test_seed_models_load_without_importing_the_api():
    import subprocess
    import sys

    result = subprocess.run(
        [
            sys.executable,
            "-c",
            "import app.db.seed; from sqlalchemy.orm import configure_mappers; configure_mappers()",
        ],
        capture_output=True,
        text=True,
        timeout=10,
    )
    assert result.returncode == 0, result.stderr


async def test_unexpected_errors_keep_request_id():
    from fastapi import FastAPI
    from httpx import ASGITransport, AsyncClient

    from app.core.exceptions import register_exception_handlers
    from app.core.observability import RequestTelemetry

    application = FastAPI()
    application.add_middleware(RequestTelemetry)
    register_exception_handlers(application)

    @application.get("/boom")
    async def boom():
        raise RuntimeError("test error")

    async with AsyncClient(
        transport=ASGITransport(app=application, raise_app_exceptions=False), base_url="http://test"
    ) as client:
        response = await client.get("/boom")
    assert response.status_code == 500
    assert response.headers["X-Request-ID"] != "unknown"
    assert response.json()["error"]["code"] == "internal_error"
