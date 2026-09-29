from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock
from uuid import UUID

import jwt
import pytest
from httpx import AsyncClient
from redis.exceptions import ConnectionError as RedisConnectionError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.integrations.redis import get_redis
from app.integrations.sms import LocalSmsProvider
from app.main import app
from app.modules.users.models import AccountLevel, Gender, User

pytestmark = pytest.mark.integration


async def register_user(
    client: AsyncClient,
    *,
    phone_number: str = "09121234567",
    birthdate: str = "1995-04-12",
    gender: str = "female",
) -> dict[str, object]:
    requested = await client.post(
        "/api/auth/register/otp/request",
        json={
            "phone_number": phone_number,
            "birthdate": birthdate,
            "gender": gender,
        },
    )
    assert requested.status_code == 202, requested.text
    provider = app.state.sms_provider
    assert isinstance(provider, LocalSmsProvider)
    normalized = "+98" + phone_number[1:]
    code = provider.sent_codes[normalized]
    verified = await client.post(
        "/api/auth/register/otp/verify",
        json={"phone_number": phone_number, "code": code},
    )
    assert verified.status_code == 201, verified.text
    return verified.json()


async def test_registration_creates_profile_and_logs_user_in(
    integration_client: AsyncClient, db_session: AsyncSession
) -> None:
    payload = await register_user(integration_client)

    assert payload["access_token"]
    assert payload["refresh_token"]
    assert payload["refresh_expires_in"] == 30 * 24 * 60 * 60
    response_user = payload["user"]
    assert isinstance(response_user, dict)
    assert response_user["phone_number"] == "+989121234567"
    assert response_user["birthdate"] == "1995-04-12"
    assert response_user["gender"] == "female"
    assert response_user["account_level"] == "free"
    user = await db_session.get(User, UUID(str(response_user["id"])))
    assert user is not None
    assert user.gender == Gender.FEMALE
    assert user.account_level == AccountLevel.FREE


async def test_login_uses_phone_and_otp_only(integration_client: AsyncClient) -> None:
    registered = await register_user(integration_client, phone_number="09121111111")
    requested = await integration_client.post(
        "/api/auth/login/otp/request", json={"phone_number": "09121111111"}
    )
    assert requested.status_code == 202, requested.text
    provider = app.state.sms_provider
    assert isinstance(provider, LocalSmsProvider)
    code = provider.sent_codes["+989121111111"]

    logged_in = await integration_client.post(
        "/api/auth/login/otp/verify",
        json={"phone_number": "09121111111", "code": code},
    )

    assert logged_in.status_code == 200, logged_in.text
    assert logged_in.json()["user"]["id"] == registered["user"]["id"]
    assert logged_in.json()["refresh_token"]


async def test_refresh_rotation_and_logout_invalidation(
    integration_client: AsyncClient,
) -> None:
    registered = await register_user(integration_client, phone_number="09121000000")
    original_refresh = str(registered["refresh_token"])

    refreshed = await integration_client.post(
        "/api/auth/refresh",
        json={"refresh_token": original_refresh},
    )
    assert refreshed.status_code == 200, refreshed.text
    rotated_refresh = refreshed.json()["refresh_token"]
    assert rotated_refresh != original_refresh
    assert refreshed.json()["user"]["id"] == registered["user"]["id"]

    replay = await integration_client.post(
        "/api/auth/refresh",
        json={"refresh_token": original_refresh},
    )
    assert replay.status_code == 401

    logged_out = await integration_client.post(
        "/api/auth/logout",
        json={"refresh_token": rotated_refresh},
    )
    assert logged_out.status_code == 204
    invalidated = await integration_client.post(
        "/api/auth/refresh",
        json={"refresh_token": rotated_refresh},
    )
    assert invalidated.status_code == 401

    repeated_logout = await integration_client.post(
        "/api/auth/logout",
        json={"refresh_token": rotated_refresh},
    )
    assert repeated_logout.status_code == 204


async def test_profile_update_and_account_deletion(integration_client: AsyncClient) -> None:
    registered = await register_user(integration_client, phone_number="09122222222")
    headers = {"Authorization": f"Bearer {registered['access_token']}"}

    updated = await integration_client.patch(
        "/api/users/me",
        headers=headers,
        json={
            "username": "  Athlete_One  ",
            "email": "ATHLETE@example.com",
            "avatar": "avatars/athlete-one.webp",
            "gender": "prefer_not_to_say",
            "birthdate": "1994-03-11",
        },
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["username"] == "athlete_one"
    assert updated.json()["email"] == "athlete@example.com"
    assert updated.json()["avatar"] == "avatars/athlete-one.webp"
    assert updated.json()["gender"] == "prefer_not_to_say"

    forbidden_level_change = await integration_client.patch(
        "/api/users/me",
        headers=headers,
        json={"account_level": "pro"},
    )
    assert forbidden_level_change.status_code == 422
    assert (await integration_client.get("/api/users/me", headers=headers)).json()[
        "account_level"
    ] == "free"

    deleted = await integration_client.delete("/api/users/me", headers=headers)
    assert deleted.status_code == 204
    assert (await integration_client.get("/api/users/me", headers=headers)).status_code == 401


async def test_duplicate_registration_is_rejected(integration_client: AsyncClient) -> None:
    await register_user(integration_client, phone_number="09123333333")
    duplicate = await integration_client.post(
        "/api/auth/register/otp/request",
        json={
            "phone_number": "09123333333",
            "birthdate": "1990-01-01",
            "gender": "male",
        },
    )
    assert duplicate.status_code == 409


async def test_unknown_phone_cannot_login(integration_client: AsyncClient) -> None:
    requested = await integration_client.post(
        "/api/auth/login/otp/request", json={"phone_number": "09124444444"}
    )
    assert requested.status_code == 202
    provider = app.state.sms_provider
    assert isinstance(provider, LocalSmsProvider)
    code = provider.sent_codes["+989124444444"]
    verified = await integration_client.post(
        "/api/auth/login/otp/verify",
        json={"phone_number": "09124444444", "code": code},
    )
    assert verified.status_code == 401


@pytest.mark.parametrize("authorization", [None, "Bearer garbage", "Basic garbage"])
async def test_protected_route_rejects_invalid_auth(
    integration_client: AsyncClient, authorization: str | None
) -> None:
    headers = {"Authorization": authorization} if authorization else {}
    response = await integration_client.get("/api/users/me", headers=headers)
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


async def test_real_redis_rate_limit(integration_client: AsyncClient) -> None:
    for _ in range(get_settings().auth_rate_limit_requests):
        response = await integration_client.post("/api/auth/login/otp/request", json={})
        assert response.status_code == 422
    response = await integration_client.post(
        "/api/auth/login/otp/request", json={"phone_number": "09125555555"}
    )
    assert response.status_code == 429
    assert int(response.headers["retry-after"]) > 0


async def test_registration_validation(
    integration_client: AsyncClient, db_session: AsyncSession
) -> None:
    response = await integration_client.post(
        "/api/auth/register/otp/request",
        json={
            "phone_number": "09126666666",
            "birthdate": "2100-01-01",
            "gender": "female",
        },
    )
    assert response.status_code == 422
    assert (await db_session.execute(select(User))).scalars().all() == []


async def test_expired_bearer_rejected(integration_client: AsyncClient) -> None:
    registered = await register_user(integration_client, phone_number="09127777777")
    past = datetime.now(UTC) - timedelta(minutes=1)
    token = jwt.encode(
        {"sub": registered["user"]["id"], "iat": past, "exp": past},
        get_settings().jwt_secret_key,
        algorithm="HS256",
    )
    response = await integration_client.get(
        "/api/users/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 401


async def test_redis_outage_fails_closed(integration_client: AsyncClient) -> None:
    unavailable = AsyncMock()
    unavailable.execute_command.side_effect = RedisConnectionError("test outage")
    unavailable.set.side_effect = RedisConnectionError("test outage")
    unavailable.ping.side_effect = RedisConnectionError("test outage")

    async def override_redis() -> object:
        return unavailable

    app.dependency_overrides[get_redis] = override_redis
    response = await integration_client.post(
        "/api/auth/login/otp/request", json={"phone_number": "09128888888"}
    )
    assert response.status_code == 503
    ready = await integration_client.get("/ready")
    assert ready.status_code == 503


async def test_health_and_readiness(integration_client: AsyncClient) -> None:
    health = await integration_client.get("/health")
    ready = await integration_client.get("/ready")
    assert health.status_code == 200
    assert health.json() == {"status": "ok"}
    assert ready.status_code == 200, ready.text


async def test_validation_and_not_found_use_error_envelope(
    integration_client: AsyncClient,
) -> None:
    validation = await integration_client.post("/api/auth/login/otp/request", json={})
    missing = await integration_client.get("/does-not-exist")
    assert validation.status_code == 422
    assert validation.json()["error"]["code"] == "validation_error"
    assert missing.status_code == 404


async def test_openapi_describes_phone_only_auth(integration_client: AsyncClient) -> None:
    schema = (await integration_client.get("/openapi.json")).json()
    assert "/api/auth/register/otp/request" in schema["paths"]
    assert "/api/auth/register/otp/verify" in schema["paths"]
    assert "/api/auth/login/otp/request" in schema["paths"]
    assert "/api/auth/login/otp/verify" in schema["paths"]
    assert "/api/auth/refresh" in schema["paths"]
    assert "/api/auth/logout" in schema["paths"]
    assert "/api/auth/login" not in schema["paths"]
    assert "/api/users/me" in schema["paths"]
