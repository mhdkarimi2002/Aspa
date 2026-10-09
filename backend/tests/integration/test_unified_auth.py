from uuid import UUID, uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.modules.auth.service import AuthService
from app.modules.users.models import User

pytestmark = pytest.mark.integration


async def test_unified_auth_cookie_and_dual_calendars(
    integration_client: AsyncClient, db_session: AsyncSession
) -> None:
    client = integration_client
    phone = f"09{uuid4().int % 10**9:09d}"
    normalized = "+98" + phone[1:]
    requested = await client.post("/api/auth/otp/request", json={"phone_number": phone})
    assert requested.status_code == 202
    code = app.state.sms_provider.sent_codes[normalized]
    assert len(code) == 5
    invalid = await client.post(
        "/api/auth/otp/verify", json={"phone_number": phone, "code": "123456"}
    )
    assert invalid.status_code == 422
    login = await client.post(
        "/api/auth/otp/verify",
        json={"phone_number": phone, "code": code},
        headers={"X-Session-Mode": "cookie"},
    )
    assert login.status_code == 200, login.text
    identity = login.json()["user"]["id"]
    assert login.json()["user"]["birthdate"] is None
    cookie = login.headers["set-cookie"]
    assert "HttpOnly" in cookie and "SameSite=strict" in cookie
    no_header = await client.post("/api/auth/session/refresh")
    assert no_header.status_code == 403
    refresh = await client.post("/api/auth/session/refresh", headers={"X-Session-Mode": "cookie"})
    assert refresh.status_code == 200
    assert refresh.json()["user"]["id"] == identity
    headers = {"Authorization": f"Bearer {refresh.json()['access_token']}"}
    saved = await client.patch(
        "/api/users/me",
        headers=headers,
        json={"birthdate_jalali": "۱۳۷۳-۱۰-۱۲"},  # noqa: RUF001
    )
    assert saved.status_code == 200, saved.text
    assert saved.json()["birthdate"] == "1995-01-02"
    assert saved.json()["birthdate_jalali"] == "1373-10-12"
    saved = await client.patch("/api/users/me", headers=headers, json={"birthdate": "2021-03-21"})
    assert saved.status_code == 200
    assert saved.json()["birthdate_jalali"] == "1400-01-01"
    user = await db_session.get(User, UUID(identity))
    assert user and user.birthdate_jalali == "1400-01-01"
    mismatch = await client.patch(
        "/api/users/me",
        headers=headers,
        json={"birthdate": "2021-03-21", "birthdate_jalali": "1373-10-12"},
    )
    assert mismatch.status_code == 422
    logout = await client.post("/api/auth/session/logout", headers={"X-Session-Mode": "cookie"})
    assert logout.status_code == 204
    assert "aspa_refresh" not in client.cookies
    assert (
        await client.post("/api/auth/session/refresh", headers={"X-Session-Mode": "cookie"})
    ).status_code == 401
    await app.state.redis.delete(AuthService._phone_key(normalized, "access-cooldown"))
    requested = await client.post("/api/auth/otp/request", json={"phone_number": phone})
    login = await client.post(
        "/api/auth/otp/verify",
        json={"phone_number": phone, "code": app.state.sms_provider.sent_codes[normalized]},
    )
    assert login.status_code == 200
    assert login.json()["user"]["id"] == identity
