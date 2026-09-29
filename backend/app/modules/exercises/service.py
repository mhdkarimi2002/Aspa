from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError
from app.modules.exercises.models import (
    Exercise,
    ExerciseDifficulty,
    ExerciseInstructionStep,
    ExerciseMedia,
    ExerciseMuscle,
    MuscleGroup,
)
from app.modules.exercises.repository import ExerciseRepository
from app.modules.exercises.schemas import (
    CatalogReference,
    CustomExerciseCreate,
    CustomExerciseUpdate,
    ExerciseCreate,
    ExercisePage,
    ExerciseResponse,
    ExerciseSort,
    MuscleGroupCreate,
    SortDirection,
)


def _blank_to_none(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


class ExerciseService:
    def __init__(self, session: AsyncSession, repository: ExerciseRepository) -> None:
        self.session = session
        self.repository = repository

    async def _commit(self) -> None:
        try:
            await self.session.commit()
        except IntegrityError as exc:
            await self.session.rollback()
            raise AppError(
                "Catalog record conflicts with existing data",
                status_code=409,
                code="conflict",
            ) from exc

    async def list_exercises(
        self,
        *,
        page: int,
        page_size: int,
        search: str | None,
        muscle_group_id: UUID | None,
        equipment_id: UUID | None,
        difficulty: ExerciseDifficulty | None,
        sort: ExerciseSort,
        direction: SortDirection,
        viewer_user_id: UUID | None,
    ) -> ExercisePage:
        normalized_search = search.strip() if search else None
        exercises, total = await self.repository.list_exercises(
            page=page,
            page_size=page_size,
            search=normalized_search or None,
            muscle_group_id=muscle_group_id,
            equipment_id=equipment_id,
            difficulty=difficulty.value if difficulty is not None else None,
            sort=sort,
            direction=direction,
            viewer_user_id=viewer_user_id,
        )
        return ExercisePage(
            items=[
                ExerciseResponse.from_model(exercise, viewer_user_id=viewer_user_id)
                for exercise in exercises
            ],
            page=page,
            page_size=page_size,
            total=total,
            pages=(total + page_size - 1) // page_size,
        )

    async def get_exercise(
        self, exercise_id: UUID, viewer_user_id: UUID | None
    ) -> ExerciseResponse:
        exercise = await self.repository.get_visible(exercise_id, viewer_user_id)
        if exercise is None:
            raise AppError("Exercise not found", status_code=404, code="not_found")
        return ExerciseResponse.from_model(exercise, viewer_user_id=viewer_user_id)

    async def list_muscle_groups(self) -> list[CatalogReference]:
        return [
            CatalogReference.model_validate(group)
            for group in await self.repository.list_muscle_groups()
        ]

    async def list_equipment(self) -> list[CatalogReference]:
        return [
            CatalogReference.model_validate(item) for item in await self.repository.list_equipment()
        ]

    async def create_muscle_group(self, data: MuscleGroupCreate) -> CatalogReference:
        existing = await self.repository.find_muscle_group_by_name(data.name_fa)
        if existing is not None:
            raise AppError(
                "A muscle group with this name already exists",
                status_code=409,
                code="conflict",
            )
        group = MuscleGroup(name_fa=data.name_fa, is_active=True)
        self.repository.add(group)
        await self._commit()
        return CatalogReference.model_validate(group)

    async def delete_muscle_group(self, muscle_group_id: UUID) -> None:
        group = await self.repository.get_muscle_group(muscle_group_id)
        if group is None:
            raise AppError("Muscle group not found", status_code=404, code="not_found")
        if await self.repository.muscle_group_in_use(muscle_group_id):
            raise AppError(
                "Muscle group is assigned to an exercise and cannot be deleted",
                status_code=409,
                code="conflict",
            )
        await self.repository.delete(group)
        await self._commit()

    async def create_exercise(self, data: ExerciseCreate) -> ExerciseResponse:
        muscle_ids = set(data.primary_muscle_ids) | set(data.secondary_muscle_ids)
        groups = await self.repository.active_muscle_groups(muscle_ids)
        if len(groups) != len(muscle_ids):
            raise AppError("Muscle group not found", status_code=404, code="not_found")
        if data.equipment_id is not None and (
            await self.repository.get_active_equipment(data.equipment_id) is None
        ):
            raise AppError("Equipment not found", status_code=404, code="not_found")

        exercise = Exercise(
            name_fa=data.name_fa,
            description_fa=_blank_to_none(data.description_fa),
            equipment_id=data.equipment_id,
            difficulty=data.difficulty,
            image_key=_blank_to_none(data.image_key),
            video_key=_blank_to_none(data.video_key),
            is_active=True,
        )
        groups_by_id = {group.id: group for group in groups}
        exercise.muscle_links = [
            ExerciseMuscle(muscle_group=groups_by_id[muscle_id], is_primary=True)
            for muscle_id in data.primary_muscle_ids
        ] + [
            ExerciseMuscle(muscle_group=groups_by_id[muscle_id], is_primary=False)
            for muscle_id in data.secondary_muscle_ids
        ]
        exercise.instruction_steps = [
            ExerciseInstructionStep(
                position=position,
                text_fa=step.text_fa,
            )
            for position, step in enumerate(data.instruction_steps)
        ]
        exercise.media = [
            ExerciseMedia(
                position=position,
                media_type=item.media_type,
                object_key=item.object_key.strip(),
            )
            for position, item in enumerate(data.media)
        ]
        self.repository.add(exercise)
        await self._commit()
        created = await self.repository.get_active(exercise.id)
        if created is None:
            raise AppError("Exercise not found", status_code=404, code="not_found")
        return ExerciseResponse.from_model(created)

    async def create_custom_exercise(
        self, user_id: UUID, data: CustomExerciseCreate
    ) -> ExerciseResponse:
        muscle_ids = set(data.primary_muscle_ids) | set(data.secondary_muscle_ids)
        groups = await self.repository.active_muscle_groups(muscle_ids)
        if len(groups) != len(muscle_ids):
            raise AppError("Muscle group not found", status_code=404, code="not_found")
        if data.equipment_id is not None and (
            await self.repository.get_active_equipment(data.equipment_id) is None
        ):
            raise AppError("Equipment not found", status_code=404, code="not_found")

        exercise = Exercise(
            owner_user_id=user_id,
            name_fa=data.name_fa,
            description_fa=data.description_fa.strip(),
            equipment_id=data.equipment_id,
            difficulty=data.difficulty,
            is_active=True,
        )
        groups_by_id = {group.id: group for group in groups}
        exercise.muscle_links = [
            ExerciseMuscle(muscle_group=groups_by_id[muscle_id], is_primary=True)
            for muscle_id in data.primary_muscle_ids
        ] + [
            ExerciseMuscle(muscle_group=groups_by_id[muscle_id], is_primary=False)
            for muscle_id in data.secondary_muscle_ids
        ]
        exercise.instruction_steps = [
            ExerciseInstructionStep(
                position=position,
                text_fa=step.text_fa,
            )
            for position, step in enumerate(data.instruction_steps)
        ]
        exercise.media = [
            ExerciseMedia(
                position=position,
                media_type=item.media_type,
                object_key=item.object_key.strip(),
            )
            for position, item in enumerate(data.media)
        ]
        self.repository.add(exercise)
        await self._commit()
        created = await self.repository.get_owned_custom(exercise.id, user_id)
        if created is None:
            raise AppError("Exercise not found", status_code=404, code="not_found")
        return ExerciseResponse.from_model(created, viewer_user_id=user_id)

    async def update_custom_exercise(
        self, exercise_id: UUID, user_id: UUID, data: CustomExerciseUpdate
    ) -> ExerciseResponse:
        exercise = await self.repository.get_owned_custom(exercise_id, user_id)
        if exercise is None:
            raise AppError("Exercise not found", status_code=404, code="not_found")

        for field in ("name_fa", "description_fa"):
            if field in data.model_fields_set:
                value = getattr(data, field)
                setattr(exercise, field, value.strip() if isinstance(value, str) else value)
        if data.difficulty is not None:
            exercise.difficulty = data.difficulty
        if "equipment_id" in data.model_fields_set:
            if data.equipment_id is not None and (
                await self.repository.get_active_equipment(data.equipment_id) is None
            ):
                raise AppError("Equipment not found", status_code=404, code="not_found")
            exercise.equipment_id = data.equipment_id

        if data.primary_muscle_ids is not None or data.secondary_muscle_ids is not None:
            primary_ids = (
                data.primary_muscle_ids
                if data.primary_muscle_ids is not None
                else [link.muscle_group_id for link in exercise.muscle_links if link.is_primary]
            )
            secondary_ids = (
                data.secondary_muscle_ids
                if data.secondary_muscle_ids is not None
                else [link.muscle_group_id for link in exercise.muscle_links if not link.is_primary]
            )
            if set(primary_ids) & set(secondary_ids):
                raise AppError("A muscle group cannot be both primary and secondary")
            muscle_ids = set(primary_ids) | set(secondary_ids)
            groups = await self.repository.active_muscle_groups(muscle_ids)
            if len(groups) != len(muscle_ids):
                raise AppError("Muscle group not found", status_code=404, code="not_found")
            groups_by_id = {group.id: group for group in groups}
            exercise.muscle_links.clear()
            await self.session.flush()
            exercise.muscle_links = [
                ExerciseMuscle(muscle_group=groups_by_id[muscle_id], is_primary=True)
                for muscle_id in primary_ids
            ] + [
                ExerciseMuscle(muscle_group=groups_by_id[muscle_id], is_primary=False)
                for muscle_id in secondary_ids
            ]

        if data.instruction_steps is not None:
            exercise.instruction_steps.clear()
            await self.session.flush()
            exercise.instruction_steps = [
                ExerciseInstructionStep(
                    position=position,
                    text_fa=step.text_fa,
                )
                for position, step in enumerate(data.instruction_steps)
            ]
        if data.media is not None:
            exercise.media.clear()
            await self.session.flush()
            exercise.media = [
                ExerciseMedia(
                    position=position,
                    media_type=item.media_type,
                    object_key=item.object_key.strip(),
                )
                for position, item in enumerate(data.media)
            ]
        await self._commit()
        updated = await self.repository.get_owned_custom(exercise.id, user_id)
        if updated is None:
            raise AppError("Exercise not found", status_code=404, code="not_found")
        return ExerciseResponse.from_model(updated, viewer_user_id=user_id)

    async def delete_exercise(self, exercise_id: UUID, user_id: UUID) -> None:
        exercise = await self.repository.get_exercise(exercise_id)
        if exercise is None:
            raise AppError("Exercise not found", status_code=404, code="not_found")
        if exercise.owner_user_id is not None and exercise.owner_user_id != user_id:
            raise AppError("Exercise not found", status_code=404, code="not_found")
        if await self.repository.exercise_in_use(exercise_id):
            raise AppError(
                "Exercise is used by a workout plan and cannot be deleted",
                status_code=409,
                code="conflict",
            )
        await self.repository.delete(exercise)
        try:
            await self.session.commit()
        except IntegrityError as exc:
            await self.session.rollback()
            raise AppError(
                "Exercise is used by a workout plan and cannot be deleted",
                status_code=409,
                code="conflict",
            ) from exc
