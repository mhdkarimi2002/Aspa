import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError
from app.modules.workout_plans.models import (
    WorkoutPlan,
    WorkoutPlanDay,
    WorkoutPlanExercise,
    WorkoutPlanSet,
    WorkoutPlanShare,
)
from app.modules.workout_plans.repository import WorkoutPlanRepository
from app.modules.workout_plans.schemas import (
    ExerciseOrderUpdate,
    MuscleCoverageItem,
    PlanExerciseReference,
    PlanSetInput,
    PlanSetsUpdate,
    PlanShareCreate,
    PlanShareLinkResponse,
    PlanShareStatus,
    SharedPlanPreview,
    WorkoutPlanCreate,
    WorkoutPlanDayCreate,
    WorkoutPlanDayResponse,
    WorkoutPlanDayUpdate,
    WorkoutPlanExerciseCreate,
    WorkoutPlanExerciseResponse,
    WorkoutPlanExerciseUpdate,
    WorkoutPlanResponse,
    WorkoutPlanUpdate,
)


class WorkoutPlanService:
    def __init__(self, session: AsyncSession, repository: WorkoutPlanRepository) -> None:
        self.session = session
        self.repository = repository

    @staticmethod
    def _response(plan: WorkoutPlan) -> WorkoutPlanResponse:
        coverage: dict[UUID, MuscleCoverageItem] = {}
        for day in plan.days:
            for item in day.exercises:
                for link in item.exercise.muscle_links:
                    muscle = link.muscle_group
                    summary = coverage.setdefault(
                        muscle.id,
                        MuscleCoverageItem(
                            id=muscle.id,
                            name_fa=muscle.name_fa,
                            primary_exercise_count=0,
                            secondary_exercise_count=0,
                        ),
                    )
                    if link.is_primary:
                        summary.primary_exercise_count += 1
                    else:
                        summary.secondary_exercise_count += 1
        return WorkoutPlanResponse(
            id=plan.id,
            name=plan.name,
            description=plan.description,
            is_archived=plan.is_archived,
            is_active=plan.is_active,
            days=[
                WorkoutPlanDayResponse(
                    id=day.id,
                    name=day.name,
                    position=day.position,
                    exercises=[
                        WorkoutPlanExerciseResponse(
                            id=item.id,
                            exercise=PlanExerciseReference.model_validate(item.exercise),
                            position=item.position,
                            sets=item.sets,
                            min_reps=item.min_reps,
                            max_reps=item.max_reps,
                            rest_seconds=item.rest_seconds,
                            notes=item.notes,
                            target_sets=[
                                PlanSetInput(
                                    target_reps=target.target_reps,
                                    target_weight_kg=target.target_weight_kg,
                                )
                                for target in item.target_sets
                            ],
                        )
                        for item in day.exercises
                    ],
                )
                for day in plan.days
            ],
            muscle_coverage=sorted(
                coverage.values(),
                key=lambda item: (
                    -item.primary_exercise_count,
                    -item.secondary_exercise_count,
                    item.name_fa,
                ),
            ),
            created_at=plan.created_at,
            updated_at=plan.updated_at,
        )

    async def _owned(self, plan_id: UUID, user_id: UUID) -> WorkoutPlan:
        plan = await self.repository.get_owned(plan_id, user_id)
        if plan is None:
            raise AppError("Workout plan not found", status_code=404, code="not_found")
        return plan

    @staticmethod
    def _day(plan: WorkoutPlan, day_id: UUID) -> WorkoutPlanDay:
        day = next((item for item in plan.days if item.id == day_id), None)
        if day is None:
            raise AppError("Workout plan day not found", status_code=404, code="not_found")
        return day

    @staticmethod
    def _plan_exercise(day: WorkoutPlanDay, item_id: UUID) -> WorkoutPlanExercise:
        item = next((value for value in day.exercises if value.id == item_id), None)
        if item is None:
            raise AppError("Workout plan exercise not found", status_code=404, code="not_found")
        return item

    async def _commit_and_get(self, plan_id: UUID, user_id: UUID) -> WorkoutPlanResponse:
        await self.session.commit()
        return self._response(await self._owned(plan_id, user_id))

    async def list_plans(self, user_id: UUID, include_archived: bool) -> list[WorkoutPlanResponse]:
        return [
            self._response(plan)
            for plan in await self.repository.list_owned(user_id, include_archived=include_archived)
        ]

    async def create_plan(self, user_id: UUID, data: WorkoutPlanCreate) -> WorkoutPlanResponse:
        plan = WorkoutPlan(
            user_id=user_id,
            name=data.name.strip(),
            description=data.description,
            is_archived=False,
        )
        self.repository.add(plan)
        await self.repository.flush()
        return await self._commit_and_get(plan.id, user_id)

    async def get_plan(self, plan_id: UUID, user_id: UUID) -> WorkoutPlanResponse:
        return self._response(await self._owned(plan_id, user_id))

    async def update_plan(
        self, plan_id: UUID, user_id: UUID, data: WorkoutPlanUpdate
    ) -> WorkoutPlanResponse:
        plan = await self._owned(plan_id, user_id)
        if data.name is not None:
            plan.name = data.name.strip()
        if "description" in data.model_fields_set:
            plan.description = data.description
        if data.is_archived is not None:
            plan.is_archived = data.is_archived
            if data.is_archived:
                plan.is_active = False
        return await self._commit_and_get(plan.id, user_id)

    async def get_active_plan(self, user_id: UUID) -> WorkoutPlanResponse:
        plan = await self.repository.get_active(user_id)
        if plan is None:
            raise AppError("Active workout plan not found", status_code=404, code="not_found")
        return self._response(plan)

    async def activate_plan(self, plan_id: UUID, user_id: UUID) -> WorkoutPlanResponse:
        plan = await self._owned(plan_id, user_id)
        if plan.is_archived:
            raise AppError(
                "Archived workout plans cannot be activated",
                status_code=409,
                code="archived_plan",
            )
        await self.repository.clear_active(user_id, keep_plan_id=plan.id)
        plan.is_active = True
        return await self._commit_and_get(plan.id, user_id)

    async def deactivate_plan(self, plan_id: UUID, user_id: UUID) -> WorkoutPlanResponse:
        plan = await self._owned(plan_id, user_id)
        plan.is_active = False
        return await self._commit_and_get(plan.id, user_id)

    async def delete_plan(self, plan_id: UUID, user_id: UUID) -> None:
        plan = await self._owned(plan_id, user_id)
        await self.repository.delete(plan)
        await self.session.commit()

    async def duplicate_plan(self, plan_id: UUID, user_id: UUID) -> WorkoutPlanResponse:
        source = await self._owned(plan_id, user_id)
        copy = WorkoutPlan(
            user_id=user_id,
            name=f"{source.name[:113]} (Copy)",
            description=source.description,
            is_archived=False,
        )
        for source_day in source.days:
            day = WorkoutPlanDay(name=source_day.name, position=source_day.position)
            day.exercises = [
                WorkoutPlanExercise(
                    exercise_id=item.exercise_id,
                    position=item.position,
                    sets=item.sets,
                    min_reps=item.min_reps,
                    max_reps=item.max_reps,
                    rest_seconds=item.rest_seconds,
                    notes=item.notes,
                    target_sets=[
                        WorkoutPlanSet(
                            position=target.position,
                            target_reps=target.target_reps,
                            target_weight_kg=target.target_weight_kg,
                        )
                        for target in item.target_sets
                    ],
                )
                for item in source_day.exercises
            ]
            copy.days.append(day)
        self.repository.add(copy)
        await self.repository.flush()
        return await self._commit_and_get(copy.id, user_id)

    async def create_day(
        self, plan_id: UUID, user_id: UUID, data: WorkoutPlanDayCreate
    ) -> WorkoutPlanResponse:
        plan = await self._owned(plan_id, user_id)
        position = min(
            data.position if data.position is not None else len(plan.days), len(plan.days)
        )
        for day in plan.days:
            if day.position >= position:
                day.position += 1
        plan.days.append(WorkoutPlanDay(name=data.name.strip(), position=position))
        return await self._commit_and_get(plan.id, user_id)

    async def update_day(
        self, plan_id: UUID, day_id: UUID, user_id: UUID, data: WorkoutPlanDayUpdate
    ) -> WorkoutPlanResponse:
        plan = await self._owned(plan_id, user_id)
        day = self._day(plan, day_id)
        if data.name is not None:
            day.name = data.name.strip()
        if data.position is not None:
            ordered = [value for value in plan.days if value.id != day.id]
            ordered.insert(min(data.position, len(ordered)), day)
            for position, value in enumerate(ordered):
                value.position = position
        return await self._commit_and_get(plan.id, user_id)

    async def delete_day(self, plan_id: UUID, day_id: UUID, user_id: UUID) -> None:
        plan = await self._owned(plan_id, user_id)
        day = self._day(plan, day_id)
        await self.repository.delete(day)
        for position, value in enumerate(item for item in plan.days if item.id != day.id):
            value.position = position
        await self.session.commit()

    async def add_exercise(
        self,
        plan_id: UUID,
        day_id: UUID,
        user_id: UUID,
        data: WorkoutPlanExerciseCreate,
    ) -> WorkoutPlanResponse:
        plan = await self._owned(plan_id, user_id)
        day = self._day(plan, day_id)
        if await self.repository.get_active_exercise(data.exercise_id, user_id) is None:
            raise AppError("Exercise not found", status_code=404, code="not_found")
        position = min(
            data.position if data.position is not None else len(day.exercises),
            len(day.exercises),
        )
        for item in day.exercises:
            if item.position >= position:
                item.position += 1
        targets = data.target_sets or [
            PlanSetInput(target_reps=data.min_reps) for _ in range(data.sets)
        ]
        day.exercises.append(
            WorkoutPlanExercise(
                exercise_id=data.exercise_id,
                position=position,
                sets=data.sets,
                min_reps=min(target.target_reps for target in targets),
                max_reps=max(
                    data.max_reps if data.target_sets is None else target.target_reps
                    for target in targets
                ),
                rest_seconds=data.rest_seconds,
                notes=data.notes,
                target_sets=[
                    WorkoutPlanSet(
                        position=position,
                        target_reps=target.target_reps,
                        target_weight_kg=target.target_weight_kg,
                    )
                    for position, target in enumerate(targets)
                ],
            )
        )
        return await self._commit_and_get(plan.id, user_id)

    async def update_exercise(
        self,
        plan_id: UUID,
        day_id: UUID,
        item_id: UUID,
        user_id: UUID,
        data: WorkoutPlanExerciseUpdate,
    ) -> WorkoutPlanResponse:
        plan = await self._owned(plan_id, user_id)
        day = self._day(plan, day_id)
        item = self._plan_exercise(day, item_id)
        for field in ("sets", "rest_seconds"):
            if field in data.model_fields_set and getattr(data, field) is not None:
                setattr(item, field, getattr(data, field))
        if "notes" in data.model_fields_set:
            item.notes = data.notes
        min_reps = data.min_reps if data.min_reps is not None else item.min_reps
        max_reps = data.max_reps if data.max_reps is not None else item.max_reps
        if max_reps < min_reps:
            raise AppError("max_reps must be greater than or equal to min_reps")
        item.min_reps = min_reps
        item.max_reps = max_reps
        if data.sets is not None:
            if data.sets < len(item.target_sets):
                del item.target_sets[data.sets :]
            else:
                item.target_sets.extend(
                    WorkoutPlanSet(
                        position=position,
                        target_reps=item.min_reps,
                        target_weight_kg=item.target_sets[-1].target_weight_kg
                        if item.target_sets
                        else None,
                    )
                    for position in range(len(item.target_sets), data.sets)
                )
        if data.min_reps is not None or data.max_reps is not None:
            for target in item.target_sets:
                target.target_reps = min(max(target.target_reps, min_reps), max_reps)
        if data.position is not None:
            ordered = [value for value in day.exercises if value.id != item.id]
            ordered.insert(min(data.position, len(ordered)), item)
            for position, value in enumerate(ordered):
                value.position = position
        return await self._commit_and_get(plan.id, user_id)

    async def replace_target_sets(
        self,
        plan_id: UUID,
        day_id: UUID,
        item_id: UUID,
        user_id: UUID,
        data: PlanSetsUpdate,
    ) -> WorkoutPlanResponse:
        plan = await self._owned(plan_id, user_id)
        item = self._plan_exercise(self._day(plan, day_id), item_id)
        item.target_sets = [
            WorkoutPlanSet(
                position=position,
                target_reps=target.target_reps,
                target_weight_kg=target.target_weight_kg,
            )
            for position, target in enumerate(data.target_sets)
        ]
        item.sets = len(data.target_sets)
        item.min_reps = min(target.target_reps for target in data.target_sets)
        item.max_reps = max(target.target_reps for target in data.target_sets)
        return await self._commit_and_get(plan.id, user_id)

    async def remove_exercise(
        self, plan_id: UUID, day_id: UUID, item_id: UUID, user_id: UUID
    ) -> None:
        plan = await self._owned(plan_id, user_id)
        day = self._day(plan, day_id)
        item = self._plan_exercise(day, item_id)
        await self.repository.delete(item)
        for position, value in enumerate(value for value in day.exercises if value.id != item.id):
            value.position = position
        await self.session.commit()

    async def reorder_exercises(
        self,
        plan_id: UUID,
        day_id: UUID,
        user_id: UUID,
        data: ExerciseOrderUpdate,
    ) -> WorkoutPlanResponse:
        plan = await self._owned(plan_id, user_id)
        day = self._day(plan, day_id)
        existing = {item.id: item for item in day.exercises}
        if set(data.exercise_ids) != set(existing):
            raise AppError("exercise_ids must contain every exercise in the day exactly once")
        for position, item_id in enumerate(data.exercise_ids):
            existing[item_id].position = position
        return await self._commit_and_get(plan.id, user_id)

    @staticmethod
    def _share_digest(token: str) -> str:
        return hashlib.sha256(token.encode()).hexdigest()

    async def create_share(
        self, plan_id: UUID, user_id: UUID, data: PlanShareCreate
    ) -> PlanShareLinkResponse:
        plan = await self._owned(plan_id, user_id)
        if plan.is_archived or not any(day.exercises for day in plan.days):
            raise AppError("Only non-empty, unarchived plans can be shared", status_code=409)
        if any(
            item.exercise.owner_user_id is not None or not item.exercise.is_active
            for day in plan.days
            for item in day.exercises
        ):
            raise AppError(
                "Plans with private or inactive exercises cannot be shared", status_code=409
            )
        content = self._response(plan)
        snapshot = SharedPlanPreview(
            name=content.name,
            description=content.description,
            days=content.days,
            muscle_coverage=content.muscle_coverage,
        )
        token = secrets.token_urlsafe(32)
        now = datetime.now(UTC)
        share = WorkoutPlanShare(
            plan_id=plan.id,
            owner_user_id=user_id,
            token_digest=self._share_digest(token),
            snapshot=snapshot.model_dump(mode="json"),
            created_at=now,
            expires_at=now + timedelta(days=data.expires_in_days)
            if data.expires_in_days is not None
            else None,
        )
        self.repository.add(share)
        await self.session.commit()
        return PlanShareLinkResponse(id=share.id, token=token, expires_at=share.expires_at)

    async def revoke_share(self, plan_id: UUID, share_id: UUID, user_id: UUID) -> None:
        share = await self.repository.get_owned_share(share_id, plan_id, user_id)
        if share is None:
            raise AppError("Share link not found", status_code=404, code="not_found")
        share.revoked_at = datetime.now(UTC)
        await self.session.commit()

    async def list_shares(self, plan_id: UUID, user_id: UUID) -> list[PlanShareStatus]:
        await self._owned(plan_id, user_id)
        return [
            PlanShareStatus(
                id=share.id,
                created_at=share.created_at,
                expires_at=share.expires_at,
                revoked_at=share.revoked_at,
            )
            for share in await self.repository.list_owned_shares(plan_id, user_id)
        ]

    async def _available_share(self, token: str) -> WorkoutPlanShare:
        share = await self.repository.get_share_by_digest(self._share_digest(token))
        now = datetime.now(UTC)
        if (
            share is None
            or share.revoked_at is not None
            or (share.expires_at is not None and share.expires_at <= now)
        ):
            raise AppError("Shared plan not found", status_code=404, code="not_found")
        return share

    async def preview_share(self, token: str) -> SharedPlanPreview:
        share = await self._available_share(token)
        return SharedPlanPreview.model_validate(share.snapshot)

    async def import_share(self, token: str, user_id: UUID) -> WorkoutPlanResponse:
        content = await self.preview_share(token)
        exercise_ids = {item.exercise.id for day in content.days for item in day.exercises}
        for exercise_id in exercise_ids:
            exercise = await self.repository.get_active_exercise(exercise_id, user_id)
            if exercise is None or exercise.owner_user_id is not None:
                raise AppError("A shared exercise is no longer available", status_code=409)
        copy = WorkoutPlan(
            user_id=user_id,
            name=content.name,
            description=content.description,
            is_archived=False,
            is_active=False,
        )
        for source_day in content.days:
            day = WorkoutPlanDay(name=source_day.name, position=source_day.position)
            day.exercises = [
                WorkoutPlanExercise(
                    exercise_id=item.exercise.id,
                    position=item.position,
                    sets=len(item.target_sets),
                    min_reps=min(target.target_reps for target in item.target_sets),
                    max_reps=max(target.target_reps for target in item.target_sets),
                    rest_seconds=item.rest_seconds,
                    notes=item.notes,
                    target_sets=[
                        WorkoutPlanSet(
                            position=position,
                            target_reps=target.target_reps,
                            target_weight_kg=target.target_weight_kg,
                        )
                        for position, target in enumerate(item.target_sets)
                    ],
                )
                for item in source_day.exercises
            ]
            copy.days.append(day)
        self.repository.add(copy)
        await self.repository.flush()
        return await self._commit_and_get(copy.id, user_id)
