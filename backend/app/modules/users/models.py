from datetime import date
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import Boolean, CheckConstraint, Date, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class Gender(StrEnum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


class AccountLevel(StrEnum):
    FREE = "free"
    PRO = "pro"


class User(TimestampMixin, Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            "gender IN ('male', 'female', 'other', 'prefer_not_to_say')",
            name="ck_users_gender",
        ),
        CheckConstraint(
            "account_level IN ('free', 'pro')",
            name="ck_users_account_level",
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    phone_number: Mapped[str | None] = mapped_column(
        String(13), unique=True, index=True, nullable=True
    )
    username: Mapped[str | None] = mapped_column(String(50), unique=True, index=True, nullable=True)
    email: Mapped[str | None] = mapped_column(String(320), unique=True, index=True, nullable=True)
    birthdate: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[Gender | None] = mapped_column(String(20), nullable=True)
    account_level: Mapped[AccountLevel] = mapped_column(
        String(10), default=AccountLevel.FREE, nullable=False
    )
    avatar: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
