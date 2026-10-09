from uuid import UUID

from sqlalchemy import String, delete
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError
from app.modules.users.models import User, UserAvatar
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserUpdate


class UserService:
    def __init__(self, session: AsyncSession, repository: UserRepository) -> None:
        self.session = session
        self.repository = repository

    async def get_active_user(self, user_id: UUID) -> User:
        user = await self.repository.get_by_id(user_id)
        if user is None or not user.is_active:
            raise AppError("User not found or inactive", status_code=401)
        return user

    async def update_profile(self, user: User, data: UserUpdate) -> User:
        if (
            "avatar" in data.model_fields_set
            and data.avatar
            and data.avatar.startswith("/api/users/avatars/")
        ):
            try:
                photo = await self.session.get(
                    UserAvatar, UUID(data.avatar.removeprefix("/api/users/avatars/"))
                )
            except ValueError as exc:
                raise AppError("Invalid photo", status_code=422) from exc
            if photo is None or photo.user_id != user.id:
                raise AppError("Photo not found", status_code=422)
        if "avatar" in data.model_fields_set:
            await self.session.execute(
                delete(UserAvatar).where(
                    UserAvatar.user_id == user.id,
                    ("/api/users/avatars/" + UserAvatar.id.cast(String)) != (data.avatar or ""),
                )
            )
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(user, field, value)
        try:
            await self.session.commit()
        except IntegrityError as exc:
            await self.session.rollback()
            raise AppError("Username or email is already in use", status_code=409) from exc
        await self.session.refresh(user)
        return user

    async def delete_account(self, user: User) -> None:
        await self.repository.delete(user)
        await self.session.commit()
