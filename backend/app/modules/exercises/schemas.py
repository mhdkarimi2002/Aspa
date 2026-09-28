from datetime import datetime
from enum import StrEnum
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

from app.modules.exercises.models import Exercise, ExerciseDifficulty

CatalogName = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)
]
ExerciseName = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)
]


def _empty_muscle_ids() -> list[UUID]:
    return []


class ExerciseSort(StrEnum):
    NAME_FA = "name_fa"
    NAME_EN = "name_en"
    CREATED_AT = "created_at"


class SortDirection(StrEnum):
    ASC = "asc"
    DESC = "desc"


class CatalogReference(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name_fa: str
    name_en: str


class ExerciseResponse(BaseModel):
    id: UUID
    name_fa: str
    name_en: str
    description_fa: str | None
    description_en: str | None
    equipment: CatalogReference | None
    difficulty: ExerciseDifficulty
    image_key: str | None
    video_key: str | None
    primary_muscles: list[CatalogReference]
    secondary_muscles: list[CatalogReference]
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_model(cls, exercise: Exercise) -> ExerciseResponse:
        primary = [
            CatalogReference.model_validate(link.muscle_group)
            for link in exercise.muscle_links
            if link.is_primary
        ]
        secondary = [
            CatalogReference.model_validate(link.muscle_group)
            for link in exercise.muscle_links
            if not link.is_primary
        ]
        return cls(
            id=exercise.id,
            name_fa=exercise.name_fa,
            name_en=exercise.name_en,
            description_fa=exercise.description_fa,
            description_en=exercise.description_en,
            equipment=(
                CatalogReference.model_validate(exercise.equipment)
                if exercise.equipment is not None
                else None
            ),
            difficulty=exercise.difficulty,
            image_key=exercise.image_key,
            video_key=exercise.video_key,
            primary_muscles=primary,
            secondary_muscles=secondary,
            created_at=exercise.created_at,
            updated_at=exercise.updated_at,
        )


class ExercisePage(BaseModel):
    items: list[ExerciseResponse]
    page: int = Field(ge=1)
    page_size: int = Field(ge=1)
    total: int = Field(ge=0)
    pages: int = Field(ge=0)


class MuscleGroupCreate(BaseModel):
    name_fa: CatalogName
    name_en: CatalogName


class ExerciseCreate(BaseModel):
    name_fa: ExerciseName
    name_en: ExerciseName
    description_fa: str | None = Field(default=None, max_length=5000)
    description_en: str | None = Field(default=None, max_length=5000)
    equipment_id: UUID | None = None
    difficulty: ExerciseDifficulty
    image_key: str | None = Field(default=None, max_length=500)
    video_key: str | None = Field(default=None, max_length=500)
    primary_muscle_ids: list[UUID] = Field(min_length=1)
    secondary_muscle_ids: list[UUID] = Field(default_factory=_empty_muscle_ids)

    @model_validator(mode="after")
    def validate_muscles(self) -> ExerciseCreate:
        if len(self.primary_muscle_ids) != len(set(self.primary_muscle_ids)):
            raise ValueError("primary_muscle_ids must not contain duplicates")
        if len(self.secondary_muscle_ids) != len(set(self.secondary_muscle_ids)):
            raise ValueError("secondary_muscle_ids must not contain duplicates")
        overlap = set(self.primary_muscle_ids) & set(self.secondary_muscle_ids)
        if overlap:
            raise ValueError("a muscle group cannot be both primary and secondary")
        return self
