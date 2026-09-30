import re
from datetime import date
from typing import Annotated, Any

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field, field_validator

from app.modules.users.models import Gender
from app.modules.users.schemas import UserResponse

_DIGIT_TRANSLATION = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")


def normalize_iranian_phone_number(value: Any) -> str:
    if not isinstance(value, str):
        raise ValueError("Phone number must be a string")
    phone = re.sub(r"[\s()-]", "", value.translate(_DIGIT_TRANSLATION))
    if phone.startswith("0098"):
        phone = "+98" + phone[4:]
    elif phone.startswith("98"):
        phone = "+" + phone
    elif phone.startswith("09"):
        phone = "+98" + phone[1:]
    if not re.fullmatch(r"\+989\d{9}", phone):
        raise ValueError("Enter a valid Iranian mobile number")
    return phone


IranianPhoneNumber = Annotated[str, BeforeValidator(normalize_iranian_phone_number)]


class PhoneNumberRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    phone_number: IranianPhoneNumber


class RegistrationOtpRequest(PhoneNumberRequest):
    birthdate: date
    gender: Gender

    @field_validator("birthdate")
    @classmethod
    def validate_birthdate(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("birthdate cannot be in the future")
        return value


class OtpVerify(PhoneNumberRequest):
    code: str = Field(pattern=r"^\d{5,6}$")


class OtpRequestResponse(BaseModel):
    message: str = "If the number can receive messages, an OTP has been sent"
    expires_in: int
    dev_code: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    refresh_expires_in: int
    token_type: str = "bearer"


class AuthResponse(TokenResponse):
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    refresh_token: str = Field(min_length=32, max_length=512)


class LocalAdminLogin(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: str
    password: str
