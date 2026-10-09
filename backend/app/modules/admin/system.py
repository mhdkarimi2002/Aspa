import asyncio
from typing import Annotated, cast

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from redis.asyncio import Redis
from sqlalchemy import text

from app.core.config import get_settings
from app.core.observability import request_counts, request_seconds
from app.db.session import DbSession
from app.integrations.redis import get_redis
from app.modules.auth.dependencies import CurrentAdmin

router = APIRouter(prefix="/admin/system", tags=["admin system"])


class SystemResponse(BaseModel):
    checks: dict[str, str]
    redis: dict[str, int]
    requests: dict[str, int]
    request_seconds: dict[str, float]


@router.get("", response_model=SystemResponse)
async def system_status(
    _: CurrentAdmin, session: DbSession, redis: Annotated[Redis, Depends(get_redis)]
) -> SystemResponse:
    checks: dict[str, str] = {}
    redis_stats: dict[str, int] = {}
    try:
        async with asyncio.timeout(get_settings().readiness_timeout_seconds):
            await session.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception:
        checks["database"] = "unavailable"
    try:
        async with asyncio.timeout(get_settings().readiness_timeout_seconds):
            info = cast(dict[str, object], await redis.execute_command("INFO"))  # pyright: ignore[reportUnknownMemberType]
        redis_stats = {
            key: int(str(info.get(key, 0)))
            for key in (
                "connected_clients",
                "used_memory",
                "evicted_keys",
                "total_commands_processed",
            )
        }
        checks["redis"] = "ok"
    except Exception:
        checks["redis"] = "unavailable"
    checks["storage"] = "configured" if get_settings().s3_bucket else "not_configured"
    return SystemResponse(
        checks=checks,
        redis=redis_stats,
        requests=dict(request_counts),
        request_seconds=dict(request_seconds),
    )
