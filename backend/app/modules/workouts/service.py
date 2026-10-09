import hashlib
from datetime import UTC, date, datetime
from uuid import UUID, uuid4

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import AppError
from app.modules.exercises.models import Exercise
from app.modules.users.models import User
from app.modules.workout_plans.models import WorkoutRun
from app.modules.workout_plans.repository import WorkoutPlanRepository
from app.modules.workouts.models import WorkoutExercise, WorkoutMutation, WorkoutSet
from app.modules.workouts.schemas import ExerciseInput, StartWorkoutRequest, SyncWorkoutRequest


class WorkoutService:
    def __init__(self, session: AsyncSession, user_id: UUID) -> None:
        self.session = session
        self.user_id = user_id
        self.plans = WorkoutPlanRepository(session)

    async def lock_user(self) -> None:
        # Serialize creation and edits for one owner; different users remain independent.
        await self.session.scalar(select(User).where(User.id == self.user_id).with_for_update())

    async def owned(self, run_id: UUID) -> WorkoutRun:
        run = await self.session.scalar(
            select(WorkoutRun)
            .where(WorkoutRun.id == run_id, WorkoutRun.user_id == self.user_id)
            .options(selectinload(WorkoutRun.exercises).selectinload(WorkoutExercise.sets))
            .execution_options(populate_existing=True)
        )
        if run is None:
            raise AppError("Workout not found", status_code=404, code="not_found")
        return run

    async def active(self) -> WorkoutRun:
        run_id = await self.session.scalar(
            select(WorkoutRun.id).where(
                WorkoutRun.user_id == self.user_id, WorkoutRun.status == "in_progress"
            )
        )
        if run_id is None:
            raise AppError("No active workout", status_code=404, code="not_found")
        return await self.owned(run_id)

    async def check_active(self) -> None:
        run_id = await self.session.scalar(
            select(WorkoutRun.id).where(
                WorkoutRun.user_id == self.user_id, WorkoutRun.status == "in_progress"
            )
        )
        if run_id:
            raise AppError("Finish or cancel the current workout first", status_code=409)

    async def new_run(self, data: StartWorkoutRequest, started_at: datetime) -> WorkoutRun:
        name = "تمرین آزاد"
        exercises: list[WorkoutExercise] = []
        if data.plan_id:
            plan = await self.plans.get_owned(data.plan_id, self.user_id)
            if plan is None:
                raise AppError("Workout plan not found", status_code=404, code="not_found")
            items = [item for day in plan.days for item in day.exercises]
            if plan.is_archived or not items:
                raise AppError("This plan cannot be started", status_code=409)
            name = plan.name
            for position, item in enumerate(items):
                if await self.plans.get_active_exercise(item.exercise_id, self.user_id) is None:
                    raise AppError("Plan contains an unavailable exercise", status_code=409)
                exercises.append(
                    WorkoutExercise(
                        client_id=uuid4(),
                        exercise_id=item.exercise_id,
                        name_fa=item.exercise.name_fa,
                        position=position,
                        rest_seconds=item.rest_seconds,
                        sets=[
                            WorkoutSet(
                                client_id=uuid4(),
                                position=target.position,
                                target_reps=target.target_reps,
                                target_weight_kg=target.target_weight_kg,
                            )
                            for target in item.target_sets
                        ],
                    )
                )
        return WorkoutRun(
            user_id=self.user_id,
            plan_id=data.plan_id,
            client_id=data.client_id or uuid4(),
            plan_name=name,
            status="in_progress",
            started_at=started_at,
            version=0,
            exercises=exercises,
        )

    async def start(self, data: StartWorkoutRequest) -> WorkoutRun:
        await self.lock_user()
        if data.client_id:
            run = await self.session.scalar(
                select(WorkoutRun).where(
                    WorkoutRun.user_id == self.user_id, WorkoutRun.client_id == data.client_id
                )
            )
            if run:
                if run.plan_id != data.plan_id:
                    raise AppError("Client ID belongs to another workout", status_code=409)
                return await self.owned(run.id)
        await self.check_active()
        run = await self.new_run(data, datetime.now(UTC))
        self.session.add(run)
        await self.session.commit()
        return await self.owned(run.id)

    async def history(
        self,
        limit: int,
        offset: int,
        exercise_id: UUID | None = None,
        completed_date: date | None = None,
    ) -> list[WorkoutRun]:
        query = select(WorkoutRun).where(
            WorkoutRun.user_id == self.user_id, WorkoutRun.status == "completed"
        )
        if completed_date is not None:
            query = query.where(
                func.date(func.timezone("Asia/Tehran", WorkoutRun.completed_at)) == completed_date
            )
        if exercise_id:
            query = query.where(
                WorkoutRun.id.in_(
                    select(WorkoutExercise.run_id)
                    .join(WorkoutSet)
                    .where(
                        WorkoutExercise.exercise_id == exercise_id,
                        WorkoutSet.completed_at.is_not(None),
                        WorkoutSet.reps > 0,
                    )
                )
            )
        runs = await self.session.scalars(
            query.options(selectinload(WorkoutRun.exercises).selectinload(WorkoutExercise.sets))
            .order_by(WorkoutRun.completed_at.desc(), WorkoutRun.id.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(runs.all())

    @staticmethod
    def mutable(run: WorkoutRun, version: int) -> None:
        if run.version != version:
            raise AppError(
                "Workout changed; fetch it and reconcile before retrying",
                status_code=409,
                code="version_conflict",
            )
        if run.status != "in_progress":
            raise AppError("Finished workouts cannot be edited", status_code=409)

    async def replace_exercises(
        self, run: WorkoutRun, values: list[ExerciseInput], *, offline_completed: bool = False
    ) -> None:
        old = {item.client_id: item for item in run.exercises}
        replacements: list[WorkoutExercise] = []
        for position, value in enumerate(values):
            previous = old.get(value.client_id)
            if previous and previous.exercise_id != value.exercise_id:
                raise AppError("Exercise client ID cannot change its exercise", status_code=409)
            if previous:
                name = previous.name_fa
            else:
                if value.exercise_id is None:
                    raise AppError("Exercise not found", status_code=404, code="not_found")
                if offline_completed:
                    # Historical offline logs survive catalog deactivation; private ownership
                    # is still enforced. These references cannot create new live plans.
                    exercise = await self.session.scalar(
                        select(Exercise).where(
                            Exercise.id == value.exercise_id,
                            or_(
                                Exercise.owner_user_id.is_(None),
                                Exercise.owner_user_id == self.user_id,
                            ),
                        )
                    )
                else:
                    exercise = await self.plans.get_active_exercise(value.exercise_id, self.user_id)
                if exercise is None:
                    raise AppError("Exercise not found", status_code=404, code="not_found")
                name = exercise.name_fa
            old_sets = {item.client_id: item for item in previous.sets} if previous else {}
            sets: list[WorkoutSet] = []
            for set_position, item in enumerate(value.sets):
                old_set = old_sets.get(item.client_id)
                sets.append(
                    WorkoutSet(
                        id=old_set.id if old_set else uuid4(),
                        client_id=item.client_id,
                        position=set_position,
                        target_reps=old_set.target_reps if old_set else item.target_reps,
                        target_weight_kg=old_set.target_weight_kg
                        if old_set
                        else item.target_weight_kg,
                        reps=item.reps,
                        weight_kg=item.weight_kg,
                        rpe=item.rpe,
                        rir=item.rir,
                        completed_at=item.completed_at,
                    )
                )
            replacements.append(
                WorkoutExercise(
                    id=previous.id if previous else uuid4(),
                    client_id=value.client_id,
                    exercise_id=value.exercise_id,
                    name_fa=name,
                    position=position,
                    rest_seconds=value.rest_seconds,
                    sets=sets,
                )
            )
        run.exercises.clear()
        await self.session.flush()
        run.exercises = replacements

    async def sync(self, data: SyncWorkoutRequest) -> WorkoutRun:
        await self.lock_user()
        digest = hashlib.sha256(data.model_dump_json().encode()).hexdigest()
        run = await self.session.scalar(
            select(WorkoutRun).where(
                WorkoutRun.user_id == self.user_id, WorkoutRun.client_id == data.client_id
            )
        )
        if run:
            run = await self.owned(run.id)
            mutation = await self.session.get(WorkoutMutation, (run.id, data.mutation_id))
            if mutation:
                if mutation.digest != digest:
                    raise AppError("Mutation ID reused with different data", status_code=409)
                return run
            self.mutable(run, data.expected_version)
            if run.plan_id != data.plan_id or run.started_at != data.started_at:
                raise AppError("Workout source and start time cannot change", status_code=409)
        else:
            if data.expected_version != 0:
                raise AppError("Unknown workout version", status_code=409, code="version_conflict")
            if data.status == "in_progress":
                await self.check_active()
            plan = await self.plans.get_owned(data.plan_id, self.user_id) if data.plan_id else None
            if data.status == "in_progress" and data.plan_id and (plan is None or plan.is_archived):
                raise AppError("Workout plan unavailable", status_code=404, code="not_found")
            run = WorkoutRun(
                user_id=self.user_id,
                client_id=data.client_id,
                plan_id=plan.id if plan else None,
                plan_name=data.plan_name or (plan.name if plan else "تمرین آزاد"),
                started_at=data.started_at,
                status=data.status,
                version=0,
                exercises=[],
            )
            self.session.add(run)
            await self.session.flush()
        await self.replace_exercises(
            run, data.exercises, offline_completed=data.status == "completed"
        )
        if data.plan_name is not None:
            run.plan_name = data.plan_name
        run.status = data.status
        run.completed_at = data.completed_at
        run.duration_seconds = (
            int((data.completed_at - run.started_at).total_seconds()) if data.completed_at else None
        )
        run.version += 1
        self.session.add(
            WorkoutMutation(run_id=run.id, mutation_id=data.mutation_id, digest=digest)
        )
        await self.session.commit()
        return await self.owned(run.id)

    async def finish(self, run_id: UUID, cancel: bool) -> WorkoutRun:
        await self.lock_user()
        run = await self.owned(run_id)
        target = "cancelled" if cancel else "completed"
        if run.status == target:
            return run
        if run.status != "in_progress":
            raise AppError("Workout already finished", status_code=409)
        run.status = target
        run.version += 1
        if not cancel:
            now = datetime.now(UTC)
            run.completed_at = now
            run.duration_seconds = max(0, int((now - run.started_at).total_seconds()))
        await self.session.commit()
        return await self.owned(run.id)
