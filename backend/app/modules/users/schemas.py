from datetime import date, datetime
from typing import Annotated, Any
from uuid import UUID

from pydantic import (
    BaseModel,
    BeforeValidator,
    ConfigDict,
    EmailStr,
    Field,
    StringConstraints,
    field_validator,
)

from app.modules.users.models import AccountLevel, Gender


def normalize_username(value: Any) -> Any:
    if isinstance(value, str):
        return value.strip().casefold()
    return value


Username = Annotated[
    str,
    BeforeValidator(normalize_username),
    StringConstraints(min_length=3, max_length=50),
]


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    phone_number: str | None = None
    username: str | None = None
    email: EmailStr | None = None
    birthdate: date | None = None
    gender: Gender | None = None
    account_level: AccountLevel
    avatar: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class UserUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: Username | None = None
    email: EmailStr | None = None
    birthdate: date | None = None
    gender: Gender | None = None
    avatar: str | None = Field(default=None, max_length=500)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str | None) -> str | None:
        return value.lower() if value is not None else None

    @field_validator("birthdate")
    @classmethod
    def validate_birthdate(cls, value: date | None) -> date | None:
        if value is None:
            raise ValueError("birthdate cannot be null")
        if value > date.today():
            raise ValueError("birthdate cannot be in the future")
        return value

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, value: Gender | None) -> Gender:
        if value is None:
            raise ValueError("gender cannot be null")
        return value
