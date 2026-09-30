"""Promote an existing user from an operator-controlled shell."""

import asyncio
import sys

from sqlalchemy import select

from app.db.session import engine, session_factory
from app.modules.admin.models import AdminAuditLog
from app.modules.auth.schemas import normalize_iranian_phone_number
from app.modules.users.models import User


async def grant_admin(phone_number: str) -> None:
    normalized = normalize_iranian_phone_number(phone_number)
    try:
        async with session_factory() as session:
            user = await session.scalar(select(User).where(User.phone_number == normalized))
            if user is None or not user.is_active:
                raise ValueError("کاربر فعال با این شماره پیدا نشد")
            if user.is_admin:
                print("این کاربر از قبل مدیر است")
                return
            user.is_admin = True
            session.add(
                AdminAuditLog(
                    actor_user_id=None,
                    action="admin.bootstrap",
                    target_type="user",
                    target_id=user.id,
                )
            )
            await session.commit()
            print("دسترسی مدیریت برای کاربر فعال شد")
    finally:
        await engine.dispose()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("شمارهٔ تلفن کاربر موجود را وارد کنید")
    asyncio.run(grant_admin(sys.argv[1]))
