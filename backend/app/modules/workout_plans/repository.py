from uuid import UUID

from sqlalchemy import or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.exercises.models import Exercise, ExerciseMuscle
from app.modules.workout_plans.models import (
    WorkoutPlan,
    WorkoutPlanDay,
    WorkoutPlanExercise,
    WorkoutPlanShare,
)


class WorkoutPlanRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    @staticmethod
    def _details():
        return (
            selectinload(WorkoutPlan.days)
            .selectinload(WorkoutPlanDay.exercises)
            .selectinload(WorkoutPlanExercise.exercise)
            .selectinload(Exercise.muscle_links)
            .joinedload(ExerciseMuscle.muscle_group)
        )

    @staticmethod
    def _target_sets():
        return (
            selectinload(WorkoutPlan.days)
            .selectinload(WorkoutPlanDay.exercises)
            .selectinload(WorkoutPlanExercise.target_sets)
        )

    async def list_owned(self, user_id: UUID, *, include_archived: bool) -> list[WorkoutPlan]:
        statement = select(WorkoutPlan).where(WorkoutPlan.user_id == user_id)
        if not include_archived:
            statement = statement.where(WorkoutPlan.is_archived.is_(False))
        result = await self.session.scalars(
            statement.options(self._details(), self._target_sets()).order_by(
                WorkoutPlan.updated_at.desc(), WorkoutPlan.id
            )
        )
        return list(result.all())

    async def get_owned(self, plan_id: UUID, user_id: UUID) -> WorkoutPlan | None:
        return await self.session.scalar(
            select(WorkoutPlan)
            .where(WorkoutPlan.id == plan_id, WorkoutPlan.user_id == user_id)
            .options(self._details(), self._target_sets())
            .execution_options(populate_existing=True)
        )

    async def get_active(self, user_id: UUID) -> WorkoutPlan | None:
        return await self.session.scalar(
            select(WorkoutPlan)
            .where(WorkoutPlan.user_id == user_id, WorkoutPlan.is_active.is_(True))
            .options(self._details(), self._target_sets())
            .execution_options(populate_existing=True)
        )

    async def clear_active(self, user_id: UUID, *, keep_plan_id: UUID) -> None:
        await self.session.execute(
            update(WorkoutPlan)
            .where(
                WorkoutPlan.user_id == user_id,
                WorkoutPlan.id != keep_plan_id,
                WorkoutPlan.is_active.is_(True),
            )
            .values(is_active=False)
        )

    async def get_active_exercise(self, exercise_id: UUID, user_id: UUID) -> Exercise | None:
        return await self.session.scalar(
            select(Exercise).where(
                Exercise.id == exercise_id,
                Exercise.is_active.is_(True),
                or_(Exercise.owner_user_id.is_(None), Exercise.owner_user_id == user_id),
            )
        )

    async def get_share_by_digest(self, digest: str) -> WorkoutPlanShare | None:
        return await self.session.scalar(
            select(WorkoutPlanShare).where(WorkoutPlanShare.token_digest == digest)
        )

    async def get_owned_share(
        self, share_id: UUID, plan_id: UUID, user_id: UUID
    ) -> WorkoutPlanShare | None:
        return await self.session.scalar(
            select(WorkoutPlanShare).where(
                WorkoutPlanShare.id == share_id,
                WorkoutPlanShare.plan_id == plan_id,
                WorkoutPlanShare.owner_user_id == user_id,
            )
        )

    async def list_owned_shares(self, plan_id: UUID, user_id: UUID) -> list[WorkoutPlanShare]:
        result = await self.session.scalars(
            select(WorkoutPlanShare)
            .where(WorkoutPlanShare.plan_id == plan_id, WorkoutPlanShare.owner_user_id == user_id)
            .order_by(WorkoutPlanShare.created_at.desc())
        )
        return list(result.all())

    def add(self, value: object) -> None:
        self.session.add(value)

    async def flush(self) -> None:
        await self.session.flush()

    async def delete(self, value: object) -> None:
        await self.session.delete(value)
