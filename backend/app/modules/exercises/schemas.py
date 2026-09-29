from datetime import datetime
from enum import StrEnum
from typing import Annotated
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    field_validator,
    model_validator,
)

from app.modules.exercises.models import Exercise, ExerciseDifficulty, ExerciseMediaType

CatalogName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
ExerciseName = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)
]
InstructionText = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)
]


def _empty_muscle_ids() -> list[UUID]:
    return []


class ExerciseSort(StrEnum):
    NAME_FA = "name_fa"
    CREATED_AT = "created_at"


class SortDirection(StrEnum):
    ASC = "asc"
    DESC = "desc"


class CatalogReference(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name_fa: str


class InstructionStepInput(BaseModel):
    text_fa: InstructionText


class InstructionStepResponse(InstructionStepInput):
    id: UUID
    position: int


class ExerciseMediaInput(BaseModel):
    media_type: ExerciseMediaType
    object_key: str = Field(min_length=1, max_length=500)


class ExerciseMediaResponse(ExerciseMediaInput):
    id: UUID
    position: int


def _empty_instruction_steps() -> list[InstructionStepInput]:
    return []


def _empty_media() -> list[ExerciseMediaInput]:
    return []


class ExerciseResponse(BaseModel):
    id: UUID
    name_fa: str
    description_fa: str | None
    equipment: CatalogReference | None
    difficulty: ExerciseDifficulty
    image_key: str | None
    video_key: str | None
    is_custom: bool
    can_edit: bool
    primary_muscles: list[CatalogReference]
    secondary_muscles: list[CatalogReference]
    instruction_steps: list[InstructionStepResponse]
    media: list[ExerciseMediaResponse]
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_model(
        cls, exercise: Exercise, *, viewer_user_id: UUID | None = None
    ) -> ExerciseResponse:
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
            description_fa=exercise.description_fa,
            equipment=(
                CatalogReference.model_validate(exercise.equipment)
                if exercise.equipment is not None
                else None
            ),
            difficulty=exercise.difficulty,
            image_key=exercise.image_key,
            video_key=exercise.video_key,
            is_custom=exercise.owner_user_id is not None,
            can_edit=(
                exercise.owner_user_id is not None and exercise.owner_user_id == viewer_user_id
            ),
            primary_muscles=primary,
            secondary_muscles=secondary,
            instruction_steps=[
                InstructionStepResponse(
                    id=step.id,
                    position=step.position,
                    text_fa=step.text_fa,
                )
                for step in exercise.instruction_steps
            ],
            media=[
                ExerciseMediaResponse(
                    id=item.id,
                    position=item.position,
                    media_type=item.media_type,
                    object_key=item.object_key,
                )
                for item in exercise.media
            ],
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


class ExerciseCreate(BaseModel):
    name_fa: ExerciseName
    description_fa: str | None = Field(default=None, max_length=5000)
    equipment_id: UUID | None = None
    difficulty: ExerciseDifficulty
    image_key: str | None = Field(default=None, max_length=500)
    video_key: str | None = Field(default=None, max_length=500)
    primary_muscle_ids: list[UUID] = Field(min_length=1)
    secondary_muscle_ids: list[UUID] = Field(default_factory=_empty_muscle_ids)
    instruction_steps: list[InstructionStepInput] = Field(default_factory=_empty_instruction_steps)
    media: list[ExerciseMediaInput] = Field(default_factory=_empty_media)

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


class CustomExerciseCreate(BaseModel):
    name_fa: ExerciseName
    description_fa: str = Field(min_length=1, max_length=5000)
    equipment_id: UUID | None = None
    difficulty: ExerciseDifficulty = ExerciseDifficulty.BEGINNER
    primary_muscle_ids: list[UUID] = Field(min_length=1)
    secondary_muscle_ids: list[UUID] = Field(default_factory=_empty_muscle_ids)
    instruction_steps: list[InstructionStepInput] = Field(min_length=1)
    media: list[ExerciseMediaInput] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_muscles(self) -> CustomExerciseCreate:
        if len(self.primary_muscle_ids) != len(set(self.primary_muscle_ids)):
            raise ValueError("primary_muscle_ids must not contain duplicates")
        if len(self.secondary_muscle_ids) != len(set(self.secondary_muscle_ids)):
            raise ValueError("secondary_muscle_ids must not contain duplicates")
        if set(self.primary_muscle_ids) & set(self.secondary_muscle_ids):
            raise ValueError("a muscle group cannot be both primary and secondary")
        return self


class CustomExerciseUpdate(BaseModel):
    name_fa: ExerciseName | None = None
    description_fa: str | None = Field(default=None, min_length=1, max_length=5000)
    equipment_id: UUID | None = None
    difficulty: ExerciseDifficulty | None = None
    primary_muscle_ids: list[UUID] | None = Field(default=None, min_length=1)
    secondary_muscle_ids: list[UUID] | None = None
    instruction_steps: list[InstructionStepInput] | None = Field(default=None, min_length=1)
    media: list[ExerciseMediaInput] | None = Field(default=None, min_length=1)

    @field_validator("name_fa", "description_fa")
    @classmethod
    def prevent_required_fields_from_being_cleared(cls, value: str | None) -> str:
        if value is None:
            raise ValueError("field cannot be null")
        return value

    @model_validator(mode="after")
    def validate_muscles(self) -> CustomExerciseUpdate:
        primary = self.primary_muscle_ids
        secondary = self.secondary_muscle_ids
        if primary is not None and len(primary) != len(set(primary)):
            raise ValueError("primary_muscle_ids must not contain duplicates")
        if secondary is not None and len(secondary) != len(set(secondary)):
            raise ValueError("secondary_muscle_ids must not contain duplicates")
        if primary is not None and secondary is not None and set(primary) & set(secondary):
            raise ValueError("a muscle group cannot be both primary and secondary")
        return self
