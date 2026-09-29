import asyncio
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated

from fastapi import Depends, FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from redis.asyncio import Redis
from sqlalchemy import text

from app.api.router import router
from app.core.config import get_settings
from app.core.exceptions import ErrorResponse, error_content, register_exception_handlers
from app.core.logging import configure_logging
from app.db.session import DbSession, engine
from app.integrations.redis import create_redis, get_redis
from app.integrations.sms import LocalSmsProvider


@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncGenerator[None]:
    configure_logging(settings.log_level)
    redis = create_redis()
    application.state.redis = redis
    application.state.sms_provider = LocalSmsProvider()
    try:
        yield
    finally:
        try:
            await redis.aclose()
        finally:
            await engine.dispose()


settings = get_settings()
swagger_assets = Path(__file__).parent / "static" / "swagger"
app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="ASPA fitness and wellness REST API",
    docs_url=None,
    lifespan=lifespan,
)
app.state.sms_provider = LocalSmsProvider()
app.mount("/static/swagger", StaticFiles(directory=swagger_assets), name="swagger-static")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)
register_exception_handlers(app)
app.include_router(router)


@app.get("/docs", include_in_schema=False)
async def swagger_docs() -> HTMLResponse:
    return get_swagger_ui_html(
        openapi_url=app.openapi_url or "/openapi.json",
        title=f"{app.title} - مستندات",
        swagger_js_url="/static/swagger/swagger-ui-bundle.js",
        swagger_css_url="/static/swagger/swagger-ui.css",
        swagger_favicon_url="/static/swagger/favicon.svg",
    )


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


class ReadinessResponse(BaseModel):
    status: str
    checks: dict[str, str]


@app.get(
    "/ready",
    tags=["health"],
    response_model=ReadinessResponse,
    responses={status.HTTP_503_SERVICE_UNAVAILABLE: {"model": ErrorResponse}},
)
async def readiness(
    session: DbSession,
    redis: Annotated[Redis, Depends(get_redis)],
) -> ReadinessResponse | JSONResponse:
    checks: dict[str, str] = {}

    async def check_database() -> None:
        await session.execute(text("SELECT 1"))

    async def check_redis() -> None:
        await redis.ping()  # pyright: ignore[reportUnknownMemberType]

    for name, check in (("database", check_database), ("redis", check_redis)):
        try:
            async with asyncio.timeout(settings.readiness_timeout_seconds):
                await check()
            checks[name] = "ok"
        except Exception:  # The response deliberately hides infrastructure details.
            checks[name] = "unavailable"

    if all(result == "ok" for result in checks.values()):
        return ReadinessResponse(status="ready", checks=checks)
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content=error_content(
            "service_unavailable",
            "One or more required services are unavailable",
            [{"location": name, "message": result} for name, result in checks.items()],
        ),
    )
