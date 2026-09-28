from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError
from app.modules.exercises.models import Exercise, ExerciseDifficulty, ExerciseMuscle, MuscleGroup
from app.modules.exercises.repository import ExerciseRepository
from app.modules.exercises.schemas import (
    CatalogReference,
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
        )
        return ExercisePage(
            items=[ExerciseResponse.from_model(exercise) for exercise in exercises],
            page=page,
            page_size=page_size,
            total=total,
            pages=(total + page_size - 1) // page_size,
        )

    async def get_exercise(self, exercise_id: UUID) -> ExerciseResponse:
        exercise = await self.repository.get_active(exercise_id)
        if exercise is None:
            raise AppError("Exercise not found", status_code=404, code="not_found")
        return ExerciseResponse.from_model(exercise)

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
        existing = await self.repository.find_muscle_group_by_name(data.name_fa, data.name_en)
        if existing is not None:
            raise AppError(
                "A muscle group with this name already exists",
                status_code=409,
                code="conflict",
            )
        group = MuscleGroup(name_fa=data.name_fa, name_en=data.name_en, is_active=True)
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
            name_en=data.name_en,
            description_fa=_blank_to_none(data.description_fa),
            description_en=_blank_to_none(data.description_en),
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
        self.repository.add(exercise)
        await self._commit()
        created = await self.repository.get_active(exercise.id)
        if created is None:
            raise AppError("Exercise not found", status_code=404, code="not_found")
        return ExerciseResponse.from_model(created)

    async def delete_exercise(self, exercise_id: UUID) -> None:
        exercise = await self.repository.get_exercise(exercise_id)
        if exercise is None:
            raise AppError("Exercise not found", status_code=404, code="not_found")
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
