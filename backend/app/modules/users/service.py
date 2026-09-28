from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError
from app.modules.users.models import User
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
