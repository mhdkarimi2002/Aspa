from datetime import date
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.models import Gender, User


class UserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, user_id: UUID) -> User | None:
        return await self.session.get(User, user_id)

    async def get_by_phone_number(self, phone_number: str) -> User | None:
        result = await self.session.execute(select(User).where(User.phone_number == phone_number))
        return result.scalar_one_or_none()

    async def create(self, *, phone_number: str, birthdate: date, gender: Gender) -> User:
        user = User(phone_number=phone_number, birthdate=birthdate, gender=gender)
        self.session.add(user)
        await self.session.flush()
        await self.session.refresh(user)
        return user

    async def delete(self, user: User) -> None:
        await self.session.delete(user)
