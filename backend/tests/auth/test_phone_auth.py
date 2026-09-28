from datetime import UTC, date, datetime
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from pydantic import ValidationError
from redis.asyncio import Redis

from app.core.config import get_settings
from app.core.exceptions import AppError
from app.integrations.sms import SmsProvider
from app.modules.auth import service as service_module
from app.modules.auth.schemas import OtpVerify, PhoneNumberRequest, RegistrationOtpRequest
from app.modules.auth.service import AuthService
from app.modules.users.models import AccountLevel, Gender, User
from app.modules.users.repository import UserRepository


@pytest.mark.parametrize(
    ("provided", "normalized"),
    [
        ("09121234567", "+989121234567"),
        ("989121234567", "+989121234567"),
        ("0098 912 123 4567", "+989121234567"),
        ("۰۹۱۲۱۲۳۴۵۶۷", "+989121234567"),
        ("٠٩١٢١٢٣٤٥٦٧", "+989121234567"),
    ],
)
def test_iranian_phone_numbers_are_normalized(provided: str, normalized: str) -> None:
    assert PhoneNumberRequest(phone_number=provided).phone_number == normalized


@pytest.mark.parametrize("phone_number", ["02112345678", "+14155552671", "091234"])
def test_non_mobile_phone_numbers_are_rejected(phone_number: str) -> None:
    with pytest.raises(ValidationError, match="valid Iranian mobile"):
        PhoneNumberRequest(phone_number=phone_number)


def test_registration_rejects_future_birthdate() -> None:
    with pytest.raises(ValidationError, match="future"):
        RegistrationOtpRequest(
            phone_number="09121234567",
            birthdate=date(2100, 1, 1),
            gender=Gender.FEMALE,
        )


async def test_registration_request_stores_profile_and_sends_code() -> None:
    redis = AsyncMock(spec=Redis)
    redis.set = AsyncMock(return_value=True)
    sms = AsyncMock(spec=SmsProvider)
    repository = AsyncMock(spec=UserRepository)
    repository.get_by_phone_number.return_value = None
    service = AuthService(AsyncMock(), repository, redis, sms)
    data = RegistrationOtpRequest(
        phone_number="09121234567",
        birthdate=date(1995, 4, 12),
        gender=Gender.FEMALE,
    )

    result = await service.request_registration_otp(data)

    assert result.expires_in == 300
    sms.send_otp.assert_awaited_once()
    phone_number, code = sms.send_otp.await_args.args
    assert phone_number == "+989121234567"
    assert len(code) == 6 and code.isdigit()
    redis.execute_command.assert_any_await(
        "HSET",
        service._phone_key(phone_number, "register-otp"),
        "code",
        service._otp_digest(phone_number, code),
        "attempts",
        "0",
        "birthdate",
        "1995-04-12",
        "gender",
        "female",
    )


async def test_registration_verify_creates_profile_and_returns_token() -> None:
    now = datetime.now(UTC)
    user = User(
        id=uuid4(),
        phone_number="+989121234567",
        birthdate=date(1995, 4, 12),
        gender=Gender.FEMALE,
        account_level=AccountLevel.FREE,
        is_active=True,
        created_at=now,
        updated_at=now,
    )
    redis = AsyncMock(spec=Redis)
    redis.execute_command.side_effect = [
        {"birthdate": "1995-04-12", "gender": "female"},
        1,
    ]
    repository = AsyncMock(spec=UserRepository)
    repository.get_by_phone_number.return_value = None
    repository.create.return_value = user
    session = AsyncMock()

    result = await AuthService(session, repository, redis).verify_registration_otp(
        OtpVerify(phone_number="09121234567", code="123456")
    )

    assert result.user.phone_number == "+989121234567"
    assert result.user.gender == Gender.FEMALE
    assert result.user.account_level == AccountLevel.FREE
    assert result.access_token
    repository.create.assert_awaited_once_with(
        phone_number="+989121234567",
        birthdate=date(1995, 4, 12),
        gender=Gender.FEMALE,
    )
    session.commit.assert_awaited_once()


async def test_login_request_sends_otp_without_password() -> None:
    redis = AsyncMock(spec=Redis)
    redis.set = AsyncMock(return_value=True)
    sms = AsyncMock(spec=SmsProvider)
    service = AuthService(AsyncMock(), AsyncMock(spec=UserRepository), redis, sms)

    await service.request_login_otp(PhoneNumberRequest(phone_number="09121234567"))

    sms.send_otp.assert_awaited_once()
    assert service._phone_key("+989121234567", "login-otp") in str(
        redis.execute_command.await_args_list
    )


async def test_local_requests_always_use_fixed_otp(monkeypatch: pytest.MonkeyPatch) -> None:
    local_settings = get_settings().model_copy(update={"environment": "local"})
    monkeypatch.setattr(service_module, "get_settings", lambda: local_settings)
    redis = AsyncMock(spec=Redis)
    redis.set = AsyncMock(return_value=True)
    sms = AsyncMock(spec=SmsProvider)
    service = AuthService(AsyncMock(), AsyncMock(spec=UserRepository), redis, sms)

    result = await service.request_login_otp(PhoneNumberRequest(phone_number="09121234567"))

    sms.send_otp.assert_awaited_once_with("+989121234567", "11111")
    assert result.dev_code == "11111"


@pytest.mark.parametrize(("redis_result", "status_code"), [(-1, 401), (0, 401), (-2, 429)])
async def test_login_verify_rejects_invalid_expired_and_exhausted_codes(
    redis_result: int, status_code: int
) -> None:
    redis = AsyncMock(spec=Redis)
    redis.execute_command.return_value = redis_result
    service = AuthService(AsyncMock(), AsyncMock(spec=UserRepository), redis)

    with pytest.raises(AppError) as error:
        await service.verify_login_otp(OtpVerify(phone_number="09121234567", code="123456"))

    assert error.value.status_code == status_code
