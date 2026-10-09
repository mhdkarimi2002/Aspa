from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import Literal, Self
from uuid import UUID

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, model_validator


class SetInput(BaseModel):
    client_id: UUID
    target_reps: int | None = Field(default=None, ge=1, le=100)
    target_weight_kg: Decimal | None = Field(
        default=None, ge=0, le=1000, max_digits=7, decimal_places=2
    )
    reps: int | None = Field(default=None, ge=0, le=1000)
    weight_kg: Decimal | None = Field(default=None, ge=0, le=1000, max_digits=7, decimal_places=2)
    rpe: Decimal | None = Field(default=None, ge=0, le=10, decimal_places=1)
    rir: int | None = Field(default=None, ge=0, le=20)
    completed_at: AwareDatetime | None = None

    @model_validator(mode="after")
    def completed_set(self) -> Self:
        if self.completed_at and (self.reps is None or self.weight_kg is None):
            raise ValueError(
                "Completed sets require actual reps and weight (use zero for bodyweight)"
            )
        return self


def empty_sets() -> list[SetInput]:
    return []


class ExerciseInput(BaseModel):
    client_id: UUID
    exercise_id: UUID | None
    rest_seconds: int = Field(default=0, ge=0, le=3600)
    sets: list[SetInput] = Field(default_factory=empty_sets, max_length=100)

    @model_validator(mode="after")
    def unique_sets(self) -> Self:
        if len({item.client_id for item in self.sets}) != len(self.sets):
            raise ValueError("Duplicate set client IDs")
        return self


class StartWorkoutRequest(BaseModel):
    plan_id: UUID | None = None
    client_id: UUID | None = None


def empty_exercises() -> list[ExerciseInput]:
    return []


class SyncWorkoutRequest(BaseModel):
    client_id: UUID
    mutation_id: UUID
    expected_version: int = Field(ge=0)
    plan_id: UUID | None = None
    plan_name: str | None = Field(default=None, min_length=1, max_length=120)
    started_at: AwareDatetime
    completed_at: AwareDatetime | None = None
    status: Literal["in_progress", "completed", "cancelled"] = "in_progress"
    exercises: list[ExerciseInput] = Field(default_factory=empty_exercises, max_length=100)

    @model_validator(mode="after")
    def validate_document(self) -> Self:
        now = datetime.now(UTC) + timedelta(minutes=5)
        if self.started_at > now:
            raise ValueError("Start time cannot be in the future")
        if self.status == "completed" and self.completed_at is None:
            raise ValueError("Completed workout requires completed_at")
        if self.status != "completed" and self.completed_at is not None:
            raise ValueError("Only completed workouts have completed_at")
        if self.completed_at and not self.started_at <= self.completed_at <= now:
            raise ValueError("Invalid completion time")
        if len({item.client_id for item in self.exercises}) != len(self.exercises):
            raise ValueError("Duplicate exercise client IDs")
        for exercise in self.exercises:
            for item in exercise.sets:
                if item.completed_at and not self.started_at <= item.completed_at <= (
                    self.completed_at or now
                ):
                    raise ValueError("Set completion is outside the workout")
        return self


class SetResponse(SetInput):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    position: int


class ExerciseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    client_id: UUID
    exercise_id: UUID | None
    name_fa: str
    position: int
    rest_seconds: int
    sets: list[SetResponse]


class WorkoutRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    client_id: UUID | None
    plan_id: UUID | None
    plan_name: str
    status: str
    started_at: datetime
    completed_at: datetime | None
    duration_seconds: int | None
    version: int
    exercises: list[ExerciseResponse]
