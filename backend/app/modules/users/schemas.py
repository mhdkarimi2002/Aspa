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
    model_validator,
)

from app.core.calendars import from_jalali, to_jalali
from app.modules.users.models import AccountLevel, Gender
from app.modules.users.provinces import normalize_province


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
    name: str | None = Field(default=None, max_length=100)
    province: str | None = Field(default=None, max_length=100)
    bio: str | None = Field(default=None, max_length=500)
    profile_link: str | None = Field(default=None, max_length=500)
    email: EmailStr | None = None
    birthdate_jalali: str | None = None
    birthdate: date | None = None
    gender: Gender | None = None
    account_level: AccountLevel
    avatar: str | None = None
    is_active: bool
    is_admin: bool
    created_at: datetime
    updated_at: datetime

    @field_validator("province")
    @classmethod
    def read_province(cls, value: str | None) -> str | None:
        return normalize_province(value, strict=False)


class UserUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: Username | None = None
    name: str | None = Field(default=None, max_length=100)
    province: str | None = Field(default=None, max_length=100)
    bio: str | None = Field(default=None, max_length=500)
    profile_link: str | None = Field(default=None, max_length=500)
    email: EmailStr | None = None
    birthdate_jalali: str | None = None
    birthdate: date | None = None
    gender: Gender | None = None
    avatar: str | None = Field(default=None, max_length=500)

    @field_validator("province")
    @classmethod
    def validate_province(cls, value: str | None) -> str | None:
        return normalize_province(value)

    @field_validator("name", "bio")
    @classmethod
    def trim_profile_text(cls, value: str | None) -> str | None:
        return value.strip() or None if value is not None else None

    @field_validator("profile_link")
    @classmethod
    def validate_profile_link(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        from urllib.parse import urlsplit

        value = value.strip()
        try:
            parsed = urlsplit(value)
            if (
                parsed.scheme not in {"http", "https"}
                or not parsed.hostname
                or any(char.isspace() or ord(char) < 32 for char in value)
            ):
                raise ValueError("Profile link must be an HTTP or HTTPS URL")
            if parsed.username or parsed.password:
                raise ValueError("Profile links cannot contain credentials")
            _ = parsed.port
        except ValueError as exc:
            raise ValueError("Profile link must be a valid HTTP or HTTPS URL") from exc
        return value

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

    @model_validator(mode="after")
    def resolve_calendars(self) -> UserUpdate:
        if "birthdate_jalali" in self.model_fields_set:
            if self.birthdate_jalali is None:
                raise ValueError("birthdate_jalali cannot be null")
            converted = from_jalali(self.birthdate_jalali)
            if "birthdate" in self.model_fields_set and self.birthdate != converted:
                raise ValueError("Birthdate calendars must represent the same day")
            if converted > date.today():
                raise ValueError("birthdate cannot be in the future")
            self.birthdate = converted
        if self.birthdate is not None:
            self.birthdate_jalali = to_jalali(self.birthdate)
        return self
