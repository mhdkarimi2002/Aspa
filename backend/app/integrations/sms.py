"""SMS provider integration boundary.

The local provider deliberately keeps OTPs in process memory instead of logging
them. It is suitable for local development only and can be replaced by an
adapter for the production SMS vendor without changing the auth module.
"""

from typing import Protocol


class SmsProvider(Protocol):
    async def send_otp(self, phone_number: str, code: str) -> None: ...


class LocalSmsProvider:
    def __init__(self) -> None:
        self.sent_codes: dict[str, str] = {}

    async def send_otp(self, phone_number: str, code: str) -> None:
        self.sent_codes[phone_number] = code


class HttpSmsProvider:
    """HTTPS SMS relay contract: POST {phone_number, code} with bearer authentication."""

    async def send_otp(self, phone_number: str, code: str) -> None:
        import httpx

        from app.core.config import get_settings
        from app.core.exceptions import AppError

        settings = get_settings()
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(
                    settings.sms_http_url or "",
                    headers={"Authorization": f"Bearer {settings.sms_http_token}"},
                    json={"phone_number": phone_number, "code": code},
                )
                response.raise_for_status()
        except httpx.HTTPError as exc:
            # Provider URLs, response bodies and submitted OTPs are never included.
            raise AppError("SMS delivery temporarily unavailable", status_code=503) from exc


def create_sms_provider() -> SmsProvider:
    from app.core.config import get_settings

    return HttpSmsProvider() if get_settings().sms_provider == "http" else LocalSmsProvider()
