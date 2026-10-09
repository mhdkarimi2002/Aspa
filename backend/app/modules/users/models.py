from datetime import date
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import Boolean, CheckConstraint, Date, ForeignKey, LargeBinary, String, event
from sqlalchemy.engine import Connection
from sqlalchemy.orm import Mapped, Mapper, mapped_column

from app.core.calendars import to_jalali
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
            "(birthdate IS NULL) = (birthdate_jalali IS NULL)", name="ck_users_birthdate_pair"
        ),
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
    name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    province: Mapped[str | None] = mapped_column(String(100), nullable=True)
    bio: Mapped[str | None] = mapped_column(String(500), nullable=True)
    profile_link: Mapped[str | None] = mapped_column(String(500), nullable=True)
    email: Mapped[str | None] = mapped_column(String(320), unique=True, index=True, nullable=True)
    birthdate_jalali: Mapped[str | None] = mapped_column(String(10), nullable=True)
    birthdate: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[Gender | None] = mapped_column(String(20), nullable=True)
    account_level: Mapped[AccountLevel] = mapped_column(
        String(10), default=AccountLevel.FREE, nullable=False
    )
    avatar: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


@event.listens_for(User, "before_insert")
@event.listens_for(User, "before_update")
def synchronize_birthdate(_: Mapper[User], __: Connection, user: User) -> None:
    user.birthdate_jalali = to_jalali(user.birthdate) if user.birthdate else None


class UserAvatar(Base):
    __tablename__ = "user_avatars"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    data: Mapped[bytes] = mapped_column(LargeBinary)
