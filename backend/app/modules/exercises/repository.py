from uuid import UUID

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy.sql.elements import ColumnElement

from app.modules.exercises.models import Equipment, Exercise, ExerciseMuscle, MuscleGroup
from app.modules.exercises.schemas import ExerciseSort, SortDirection


class ExerciseRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    @staticmethod
    def _with_details(statement: Select[tuple[Exercise]]) -> Select[tuple[Exercise]]:
        return statement.options(
            joinedload(Exercise.equipment),
            selectinload(Exercise.muscle_links).joinedload(ExerciseMuscle.muscle_group),
        )

    async def list_exercises(
        self,
        *,
        page: int,
        page_size: int,
        search: str | None,
        muscle_group_id: UUID | None,
        equipment_id: UUID | None,
        difficulty: str | None,
        sort: ExerciseSort,
        direction: SortDirection,
    ) -> tuple[list[Exercise], int]:
        conditions: list[ColumnElement[bool]] = [Exercise.is_active.is_(True)]
        if search:
            escaped = search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
            pattern = f"%{escaped}%"
            conditions.append(
                or_(
                    Exercise.name_fa.ilike(pattern, escape="\\"),
                    Exercise.name_en.ilike(pattern, escape="\\"),
                )
            )
        if muscle_group_id is not None:
            conditions.append(
                Exercise.muscle_links.any(ExerciseMuscle.muscle_group_id == muscle_group_id)
            )
        if equipment_id is not None:
            conditions.append(Exercise.equipment_id == equipment_id)
        if difficulty is not None:
            conditions.append(Exercise.difficulty == difficulty)

        total = await self.session.scalar(
            select(func.count()).select_from(Exercise).where(*conditions)
        )
        sort_column = {
            ExerciseSort.NAME_FA: Exercise.name_fa,
            ExerciseSort.NAME_EN: Exercise.name_en,
            ExerciseSort.CREATED_AT: Exercise.created_at,
        }[sort]
        order = sort_column.desc() if direction is SortDirection.DESC else sort_column.asc()
        statement = (
            select(Exercise)
            .where(*conditions)
            .order_by(order, Exercise.id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        exercises = list((await self.session.scalars(self._with_details(statement))).all())
        return exercises, total or 0

    async def get_active(self, exercise_id: UUID) -> Exercise | None:
        statement = select(Exercise).where(Exercise.id == exercise_id, Exercise.is_active.is_(True))
        return await self.session.scalar(self._with_details(statement))

    async def get_exercise(self, exercise_id: UUID) -> Exercise | None:
        return await self.session.get(Exercise, exercise_id)

    async def get_muscle_group(self, muscle_group_id: UUID) -> MuscleGroup | None:
        return await self.session.get(MuscleGroup, muscle_group_id)

    async def find_muscle_group_by_name(self, name_fa: str, name_en: str) -> MuscleGroup | None:
        return await self.session.scalar(
            select(MuscleGroup).where(
                or_(MuscleGroup.name_fa == name_fa, MuscleGroup.name_en == name_en)
            )
        )

    async def active_muscle_groups(self, muscle_group_ids: set[UUID]) -> list[MuscleGroup]:
        if not muscle_group_ids:
            return []
        result = await self.session.scalars(
            select(MuscleGroup).where(
                MuscleGroup.id.in_(muscle_group_ids),
                MuscleGroup.is_active.is_(True),
            )
        )
        return list(result.all())

    async def get_active_equipment(self, equipment_id: UUID) -> Equipment | None:
        return await self.session.scalar(
            select(Equipment).where(Equipment.id == equipment_id, Equipment.is_active.is_(True))
        )

    async def muscle_group_in_use(self, muscle_group_id: UUID) -> bool:
        link = await self.session.scalar(
            select(ExerciseMuscle.exercise_id)
            .where(ExerciseMuscle.muscle_group_id == muscle_group_id)
            .limit(1)
        )
        return link is not None

    def add(self, value: object) -> None:
        self.session.add(value)

    async def delete(self, value: object) -> None:
        await self.session.delete(value)

    async def list_muscle_groups(self) -> list[MuscleGroup]:
        result = await self.session.scalars(
            select(MuscleGroup)
            .where(MuscleGroup.is_active.is_(True))
            .order_by(MuscleGroup.name_fa, MuscleGroup.id)
        )
        return list(result.all())

    async def list_equipment(self) -> list[Equipment]:
        result = await self.session.scalars(
            select(Equipment)
            .where(Equipment.is_active.is_(True))
            .order_by(Equipment.name_fa, Equipment.id)
        )
        return list(result.all())
