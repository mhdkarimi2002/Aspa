from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.elements import ColumnElement

from app.core.exceptions import AppError
from app.modules.admin.models import AdminAuditLog
from app.modules.admin.schemas import (
    AdminCatalogCreate,
    AdminCatalogItem,
    AdminCatalogUpdate,
    AdminExercisePage,
    AdminExerciseResponse,
    AdminExerciseStatus,
    AdminExerciseUpdate,
    AdminUserPage,
    AdminUserUpdate,
)
from app.modules.exercises.models import (
    Equipment,
    Exercise,
    ExerciseInstructionStep,
    ExerciseMedia,
    ExerciseMuscle,
    MuscleGroup,
)
from app.modules.exercises.repository import ExerciseRepository
from app.modules.exercises.schemas import ExerciseResponse
from app.modules.users.models import User
from app.modules.users.schemas import UserResponse


def _admin_exercise(exercise: Exercise) -> AdminExerciseResponse:
    return AdminExerciseResponse.model_validate(
        {**ExerciseResponse.from_model(exercise).model_dump(), "is_active": exercise.is_active}
    )


class AdminService:
    def __init__(self, session: AsyncSession, actor_id: UUID) -> None:
        self.session = session
        self.actor_id = actor_id
        self.exercises = ExerciseRepository(session)

    def audit(self, action: str, target_type: str, target_id: UUID) -> None:
        self.session.add(
            AdminAuditLog(
                actor_user_id=self.actor_id,
                action=action,
                target_type=target_type,
                target_id=target_id,
            )
        )

    async def _commit(self) -> None:
        try:
            await self.session.commit()
        except IntegrityError as exc:
            await self.session.rollback()
            raise AppError("رکورد تکراری است", status_code=409, code="conflict") from exc

    async def list_users(
        self, *, page: int, page_size: int, search: str | None, is_active: bool | None
    ) -> AdminUserPage:
        conditions: list[ColumnElement[bool]] = []
        if search:
            escaped = search.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
            pattern = f"%{escaped}%"
            conditions.append(
                or_(
                    User.phone_number.ilike(pattern, escape="\\"),
                    User.username.ilike(pattern, escape="\\"),
                    User.email.ilike(pattern, escape="\\"),
                )
            )
        if is_active is not None:
            conditions.append(User.is_active.is_(is_active))
        total = await self.session.scalar(select(func.count()).select_from(User).where(*conditions))
        users = await self.session.scalars(
            select(User)
            .where(*conditions)
            .order_by(User.created_at.desc(), User.id)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        count = total or 0
        return AdminUserPage(
            items=[UserResponse.model_validate(user) for user in users],
            page=page,
            page_size=page_size,
            total=count,
            pages=(count + page_size - 1) // page_size,
        )

    async def get_user(self, user_id: UUID) -> UserResponse:
        user = await self.session.get(User, user_id)
        if user is None:
            raise AppError("کاربر پیدا نشد", status_code=404, code="not_found")
        return UserResponse.model_validate(user)

    async def update_user(
        self, user_id: UUID, actor_id: UUID, data: AdminUserUpdate
    ) -> UserResponse:
        user = await self.session.get(User, user_id)
        if user is None:
            raise AppError("کاربر پیدا نشد", status_code=404, code="not_found")
        if not data.model_fields_set:
            raise AppError("تغییری ارسال نشده است")
        if "is_active" in data.model_fields_set:
            if data.is_active is None:
                raise AppError("وضعیت حساب نامعتبر است")
            if user_id == actor_id and not data.is_active:
                raise AppError("مدیر نمی‌تواند حساب خود را غیرفعال کند", status_code=409)
            user.is_active = data.is_active
        if "account_level" in data.model_fields_set:
            if data.account_level is None:
                raise AppError("سطح حساب نامعتبر است")
            user.account_level = data.account_level
        self.audit("user.update", "user", user.id)
        await self._commit()
        await self.session.refresh(user)
        return UserResponse.model_validate(user)

    async def list_exercises(
        self, *, page: int, page_size: int, search: str | None, is_active: bool | None
    ) -> AdminExercisePage:
        conditions: list[ColumnElement[bool]] = [Exercise.owner_user_id.is_(None)]
        if search:
            escaped = search.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
            conditions.append(Exercise.name_fa.ilike(f"%{escaped}%", escape="\\"))
        if is_active is not None:
            conditions.append(Exercise.is_active.is_(is_active))
        total = await self.session.scalar(
            select(func.count()).select_from(Exercise).where(*conditions)
        )
        statement = (
            select(Exercise)
            .where(*conditions)
            .order_by(Exercise.created_at.desc(), Exercise.id)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        exercises = await self.session.scalars(self.exercises.with_details(statement))
        count = total or 0
        return AdminExercisePage(
            items=[_admin_exercise(exercise) for exercise in exercises],
            page=page,
            page_size=page_size,
            total=count,
            pages=(count + page_size - 1) // page_size,
        )

    async def get_exercise(self, exercise_id: UUID) -> AdminExerciseResponse:
        exercise = await self.session.scalar(
            self.exercises.with_details(
                select(Exercise).where(Exercise.id == exercise_id, Exercise.owner_user_id.is_(None))
            )
        )
        if exercise is None:
            raise AppError("تمرین پیدا نشد", status_code=404, code="not_found")
        return _admin_exercise(exercise)

    async def update_exercise(
        self, exercise_id: UUID, data: AdminExerciseUpdate
    ) -> AdminExerciseResponse:
        exercise = await self.session.scalar(
            self.exercises.with_details(
                select(Exercise).where(Exercise.id == exercise_id, Exercise.owner_user_id.is_(None))
            )
        )
        if exercise is None:
            raise AppError("تمرین پیدا نشد", status_code=404, code="not_found")
        ids = set(data.primary_muscle_ids) | set(data.secondary_muscle_ids)
        groups = await self.exercises.active_muscle_groups(ids)
        if len(groups) != len(ids):
            raise AppError("گروه عضلانی پیدا نشد", status_code=404)
        if data.equipment_id is not None and (
            await self.exercises.get_active_equipment(data.equipment_id) is None
        ):
            raise AppError("تجهیزات پیدا نشد", status_code=404)
        by_id = {group.id: group for group in groups}
        exercise.name_fa = data.name_fa
        exercise.description_fa = data.description_fa
        exercise.equipment_id = data.equipment_id
        exercise.difficulty = data.difficulty
        exercise.image_key = data.image_key
        exercise.video_key = data.video_key
        exercise.is_active = data.is_active
        exercise.muscle_links.clear()
        exercise.instruction_steps.clear()
        exercise.media.clear()
        await self.session.flush()
        exercise.muscle_links = [
            ExerciseMuscle(muscle_group=by_id[group_id], is_primary=is_primary)
            for values, is_primary in (
                (data.primary_muscle_ids, True),
                (data.secondary_muscle_ids, False),
            )
            for group_id in values
        ]
        exercise.instruction_steps = [
            ExerciseInstructionStep(position=i, text_fa=step.text_fa)
            for i, step in enumerate(data.instruction_steps)
        ]
        exercise.media = [
            ExerciseMedia(position=i, media_type=item.media_type, object_key=item.object_key)
            for i, item in enumerate(data.media)
        ]
        self.audit("exercise.update", "exercise", exercise.id)
        await self._commit()
        return await self.get_exercise(exercise_id)

    async def set_exercise_status(
        self, exercise_id: UUID, data: AdminExerciseStatus
    ) -> AdminExerciseResponse:
        exercise = await self.session.scalar(
            select(Exercise).where(Exercise.id == exercise_id, Exercise.owner_user_id.is_(None))
        )
        if exercise is None:
            raise AppError("تمرین پیدا نشد", status_code=404, code="not_found")
        exercise.is_active = data.is_active
        self.audit("exercise.status", "exercise", exercise.id)
        await self._commit()
        return await self.get_exercise(exercise_id)

    async def list_catalog(self, kind: str) -> list[AdminCatalogItem]:
        model = MuscleGroup if kind == "muscle-groups" else Equipment
        items = await self.session.scalars(select(model).order_by(model.name_fa, model.id))
        return [AdminCatalogItem.model_validate(item) for item in items]

    async def create_catalog(self, kind: str, data: AdminCatalogCreate) -> AdminCatalogItem:
        model = MuscleGroup if kind == "muscle-groups" else Equipment
        item = model(name_fa=data.name_fa, is_active=True)
        self.session.add(item)
        await self.session.flush()
        self.audit("catalog.create", kind, item.id)
        await self._commit()
        return AdminCatalogItem.model_validate(item)

    async def update_catalog(
        self, kind: str, item_id: UUID, data: AdminCatalogUpdate
    ) -> AdminCatalogItem:
        model = MuscleGroup if kind == "muscle-groups" else Equipment
        item = await self.session.get(model, item_id)
        if item is None:
            raise AppError("مورد پیدا نشد", status_code=404, code="not_found")
        if not data.model_fields_set:
            raise AppError("تغییری ارسال نشده است")
        if "name_fa" in data.model_fields_set:
            if data.name_fa is None:
                raise AppError("نام نامعتبر است")
            item.name_fa = data.name_fa
        if "is_active" in data.model_fields_set:
            if data.is_active is None:
                raise AppError("وضعیت نامعتبر است")
            item.is_active = data.is_active
        self.audit("catalog.update", kind, item.id)
        await self._commit()
        return AdminCatalogItem.model_validate(item)
