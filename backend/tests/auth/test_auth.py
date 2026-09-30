from datetime import UTC, date, datetime
from unittest.mock import AsyncMock
from uuid import uuid4

from httpx import AsyncClient

from app.main import app
from app.modules.auth.dependencies import get_auth_service, get_current_user
from app.modules.auth.schemas import AuthResponse
from app.modules.auth.service import AuthService
from app.modules.users.models import AccountLevel, Gender, User
from app.modules.users.schemas import UserResponse


def make_user() -> User:
    now = datetime.now(UTC)
    return User(
        id=uuid4(),
        phone_number="+989121234567",
        birthdate=date(1995, 4, 12),
        gender=Gender.FEMALE,
        account_level=AccountLevel.FREE,
        is_active=True,
        is_admin=False,
        created_at=now,
        updated_at=now,
    )


async def test_phone_otp_routes_and_current_user(client: AsyncClient) -> None:
    user = make_user()
    response = AuthResponse(
        access_token="test-token",
        refresh_token="test-refresh-token-that-is-long-enough",
        refresh_expires_in=2_592_000,
        user=UserResponse.model_validate(user),
    )
    auth_service = AsyncMock(spec=AuthService)
    auth_service.verify_registration_otp.return_value = response
    auth_service.verify_login_otp.return_value = response
    auth_service.refresh.return_value = response

    async def override_auth_service() -> AuthService:
        return auth_service

    async def override_current_user() -> User:
        return user

    app.dependency_overrides[get_auth_service] = override_auth_service
    app.dependency_overrides[get_current_user] = override_current_user

    registered = await client.post(
        "/api/auth/register/otp/verify",
        json={"phone_number": "09121234567", "code": "123456"},
    )
    logged_in = await client.post(
        "/api/auth/login/otp/verify",
        json={"phone_number": "09121234567", "code": "123456"},
    )
    refreshed = await client.post(
        "/api/auth/refresh",
        json={"refresh_token": response.refresh_token},
    )
    logged_out = await client.post(
        "/api/auth/logout",
        json={"refresh_token": response.refresh_token},
    )
    me = await client.get("/api/users/me")

    assert registered.status_code == 201
    assert logged_in.status_code == 200
    assert refreshed.status_code == 200
    assert logged_out.status_code == 204
    assert me.status_code == 200
    assert me.json()["phone_number"] == user.phone_number
    assert me.json()["account_level"] == "free"
