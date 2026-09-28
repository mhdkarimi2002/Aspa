import hashlib
import hmac
import secrets
from datetime import date
from typing import cast

from redis.asyncio import Redis
from redis.exceptions import RedisError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import AppError
from app.core.security import create_access_token
from app.integrations.sms import SmsProvider
from app.modules.auth.schemas import (
    AuthResponse,
    OtpRequestResponse,
    OtpVerify,
    PhoneNumberRequest,
    RegistrationOtpRequest,
)
from app.modules.users.models import Gender, User
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserResponse

_VERIFY_OTP = """
local expected = redis.call('HGET', KEYS[1], 'code')
if not expected then return -1 end
local attempts = tonumber(redis.call('HGET', KEYS[1], 'attempts') or '0')
if attempts >= tonumber(ARGV[2]) then return -2 end
if expected ~= ARGV[1] then
    attempts = redis.call('HINCRBY', KEYS[1], 'attempts', 1)
    if attempts >= tonumber(ARGV[2]) then return -2 end
    return 0
end
redis.call('DEL', KEYS[1])
redis.call('DEL', KEYS[2])
return 1
"""


class AuthService:
    def __init__(
        self,
        session: AsyncSession,
        users: UserRepository,
        redis: Redis | None = None,
        sms_provider: SmsProvider | None = None,
    ) -> None:
        self.session = session
        self.users = users
        self.redis = redis
        self.sms_provider = sms_provider

    @staticmethod
    def _phone_key(phone_number: str, purpose: str) -> str:
        settings = get_settings()
        identifier = hmac.new(
            settings.jwt_secret_key.encode(), phone_number.encode(), hashlib.sha256
        ).hexdigest()
        return f"aspa:{settings.environment}:auth:{purpose}:{identifier}"

    @staticmethod
    def _otp_digest(phone_number: str, code: str) -> str:
        secret = get_settings().jwt_secret_key.encode()
        return hmac.new(secret, f"{phone_number}:{code}".encode(), hashlib.sha256).hexdigest()

    async def _send_otp(
        self,
        phone_number: str,
        *,
        purpose: str,
        metadata: dict[str, str] | None = None,
    ) -> OtpRequestResponse:
        if self.redis is None or self.sms_provider is None:
            raise RuntimeError("OTP dependencies are not configured")
        settings = get_settings()
        otp_key = self._phone_key(phone_number, f"{purpose}-otp")
        cooldown_key = self._phone_key(phone_number, f"{purpose}-cooldown")
        try:
            allowed = await self.redis.set(
                cooldown_key,
                "1",
                ex=settings.otp_resend_cooldown_seconds,
                nx=True,
            )
            if not allowed:
                raise AppError(
                    "Please wait before requesting another OTP",
                    status_code=429,
                    headers={"Retry-After": str(settings.otp_resend_cooldown_seconds)},
                )
            code = (
                "11111"
                if settings.environment == "local"
                else f"{secrets.randbelow(1_000_000):06d}"
            )
            values: list[str] = [
                "code",
                self._otp_digest(phone_number, code),
                "attempts",
                "0",
            ]
            for key, value in (metadata or {}).items():
                values.extend((key, value))
            await self.redis.execute_command("HSET", otp_key, *values)  # pyright: ignore[reportUnknownMemberType]
            await self.redis.execute_command(  # pyright: ignore[reportUnknownMemberType]
                "EXPIRE", otp_key, settings.otp_expire_seconds
            )
            try:
                await self.sms_provider.send_otp(phone_number, code)
            except Exception as exc:
                await self.redis.delete(otp_key, cooldown_key)
                raise AppError("Could not send OTP", status_code=503) from exc
        except RedisError as exc:
            raise AppError("Authentication temporarily unavailable", status_code=503) from exc
        return OtpRequestResponse(
            expires_in=settings.otp_expire_seconds,
            dev_code=code if settings.environment == "local" else None,
        )

    async def _verify_otp(self, data: OtpVerify, *, purpose: str) -> None:
        if self.redis is None:
            raise RuntimeError("OTP dependencies are not configured")
        settings = get_settings()
        otp_key = self._phone_key(data.phone_number, f"{purpose}-otp")
        cooldown_key = self._phone_key(data.phone_number, f"{purpose}-cooldown")
        try:
            result = cast(
                int,
                await self.redis.execute_command(  # pyright: ignore[reportUnknownMemberType]
                    "EVAL",
                    _VERIFY_OTP,
                    2,
                    otp_key,
                    cooldown_key,
                    self._otp_digest(data.phone_number, data.code),
                    settings.otp_max_attempts,
                ),
            )
        except RedisError as exc:
            raise AppError("Authentication temporarily unavailable", status_code=503) from exc
        if result == -1:
            raise AppError("OTP is invalid or expired", status_code=401)
        if result == -2:
            raise AppError("Too many invalid OTP attempts", status_code=429)
        if result == 0:
            raise AppError("OTP is invalid or expired", status_code=401)

    async def request_registration_otp(self, data: RegistrationOtpRequest) -> OtpRequestResponse:
        if await self.users.get_by_phone_number(data.phone_number) is not None:
            raise AppError("An account with this phone number already exists", status_code=409)
        return await self._send_otp(
            data.phone_number,
            purpose="register",
            metadata={"birthdate": data.birthdate.isoformat(), "gender": data.gender.value},
        )

    async def verify_registration_otp(self, data: OtpVerify) -> AuthResponse:
        if self.redis is None:
            raise RuntimeError("OTP dependencies are not configured")
        otp_key = self._phone_key(data.phone_number, "register-otp")
        try:
            metadata = cast(
                dict[str, str],
                await self.redis.execute_command("HGETALL", otp_key),  # pyright: ignore[reportUnknownMemberType]
            )
        except RedisError as exc:
            raise AppError("Authentication temporarily unavailable", status_code=503) from exc
        await self._verify_otp(data, purpose="register")
        try:
            birthdate = date.fromisoformat(metadata["birthdate"])
            gender = Gender(metadata["gender"])
        except (KeyError, ValueError) as exc:
            raise AppError("Registration data is invalid or expired", status_code=401) from exc
        if await self.users.get_by_phone_number(data.phone_number) is not None:
            raise AppError("An account with this phone number already exists", status_code=409)
        try:
            user = await self.users.create(
                phone_number=data.phone_number,
                birthdate=birthdate,
                gender=gender,
            )
            await self.session.commit()
        except IntegrityError as exc:
            await self.session.rollback()
            raise AppError(
                "An account with this phone number already exists", status_code=409
            ) from exc
        return self._auth_response(user)

    async def request_login_otp(self, data: PhoneNumberRequest) -> OtpRequestResponse:
        return await self._send_otp(data.phone_number, purpose="login")

    async def verify_login_otp(self, data: OtpVerify) -> AuthResponse:
        await self._verify_otp(data, purpose="login")
        user = await self.users.get_by_phone_number(data.phone_number)
        if user is None:
            raise AppError("OTP is invalid or expired", status_code=401)
        if not user.is_active:
            raise AppError("User is inactive", status_code=403)
        return self._auth_response(user)

    @staticmethod
    def _auth_response(user: User) -> AuthResponse:
        return AuthResponse(
            access_token=create_access_token(user.id),
            user=UserResponse.model_validate(user),
        )
