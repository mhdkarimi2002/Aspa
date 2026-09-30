from datetime import datetime
from decimal import Decimal
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

PlanName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]


class WorkoutPlanCreate(BaseModel):
    name: PlanName
    description: str | None = Field(default=None, max_length=2000)


class WorkoutPlanUpdate(BaseModel):
    name: PlanName | None = None
    description: str | None = Field(default=None, max_length=2000)
    is_archived: bool | None = None


class WorkoutPlanDayCreate(BaseModel):
    name: PlanName
    position: int | None = Field(default=None, ge=0)


class WorkoutPlanDayUpdate(BaseModel):
    name: PlanName | None = None
    position: int | None = Field(default=None, ge=0)


class PlanSetInput(BaseModel):
    target_reps: int = Field(ge=1, le=100)
    target_weight_kg: Decimal | None = Field(default=None, ge=0, le=1000, decimal_places=2)


class WorkoutPlanExerciseCreate(BaseModel):
    exercise_id: UUID
    sets: int = Field(ge=1, le=20)
    min_reps: int = Field(ge=1, le=100)
    max_reps: int = Field(ge=1, le=100)
    rest_seconds: int = Field(default=90, ge=0, le=3600)
    notes: str | None = Field(default=None, max_length=500)
    position: int | None = Field(default=None, ge=0)
    target_sets: list[PlanSetInput] | None = None

    @model_validator(mode="after")
    def validate_rep_range(self) -> WorkoutPlanExerciseCreate:
        if self.max_reps < self.min_reps:
            raise ValueError("max_reps must be greater than or equal to min_reps")
        if self.target_sets is not None:
            if len(self.target_sets) != self.sets:
                raise ValueError("target_sets length must equal sets")
        return self


class WorkoutPlanExerciseUpdate(BaseModel):
    sets: int | None = Field(default=None, ge=1, le=20)
    min_reps: int | None = Field(default=None, ge=1, le=100)
    max_reps: int | None = Field(default=None, ge=1, le=100)
    rest_seconds: int | None = Field(default=None, ge=0, le=3600)
    notes: str | None = Field(default=None, max_length=500)
    position: int | None = Field(default=None, ge=0)


class PlanSetsUpdate(BaseModel):
    target_sets: list[PlanSetInput] = Field(min_length=1, max_length=20)


class ExerciseOrderUpdate(BaseModel):
    exercise_ids: list[UUID] = Field(min_length=1)

    @model_validator(mode="after")
    def reject_duplicates(self) -> ExerciseOrderUpdate:
        if len(self.exercise_ids) != len(set(self.exercise_ids)):
            raise ValueError("exercise_ids must not contain duplicates")
        return self


class PlanExerciseReference(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name_fa: str


class MuscleCoverageItem(BaseModel):
    id: UUID
    name_fa: str
    primary_exercise_count: int = Field(ge=0)
    secondary_exercise_count: int = Field(ge=0)


class WorkoutPlanExerciseResponse(BaseModel):
    id: UUID
    exercise: PlanExerciseReference
    position: int
    sets: int
    min_reps: int
    max_reps: int
    rest_seconds: int
    notes: str | None
    target_sets: list[PlanSetInput]


class WorkoutPlanDayResponse(BaseModel):
    id: UUID
    name: str
    position: int
    exercises: list[WorkoutPlanExerciseResponse]


class WorkoutPlanResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    is_archived: bool
    is_active: bool
    days: list[WorkoutPlanDayResponse]
    exercises: list[WorkoutPlanExerciseResponse]
    muscle_coverage: list[MuscleCoverageItem]
    created_at: datetime
    updated_at: datetime


class PlanShareCreate(BaseModel):
    expires_in_days: int | None = Field(default=None, ge=1, le=30)


class PlanShareLinkResponse(BaseModel):
    id: UUID
    token: str
    expires_at: datetime | None


class PlanShareStatus(BaseModel):
    id: UUID
    created_at: datetime
    expires_at: datetime | None
    revoked_at: datetime | None


class SharedPlanPreview(BaseModel):
    name: str
    description: str | None
    days: list[WorkoutPlanDayResponse]
    exercises: list[WorkoutPlanExerciseResponse] = []
    muscle_coverage: list[MuscleCoverageItem]
