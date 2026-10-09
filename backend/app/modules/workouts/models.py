from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class WorkoutExercise(Base):
    __tablename__ = "workout_exercises"
    __table_args__ = (
        UniqueConstraint("run_id", "client_id", name="uq_workout_exercises_client"),
        CheckConstraint("position >= 0", name="ck_workout_exercises_position"),
        CheckConstraint("rest_seconds BETWEEN 0 AND 3600", name="ck_workout_exercises_rest"),
    )
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    run_id: Mapped[UUID] = mapped_column(
        ForeignKey("workout_runs.id", ondelete="CASCADE"), index=True
    )
    client_id: Mapped[UUID] = mapped_column(nullable=False)
    exercise_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("exercises.id", ondelete="SET NULL"), nullable=True, index=True
    )
    name_fa: Mapped[str] = mapped_column(String(200))
    position: Mapped[int] = mapped_column(Integer)
    rest_seconds: Mapped[int] = mapped_column(Integer, default=0)
    sets: Mapped[list[WorkoutSet]] = relationship(
        cascade="all, delete-orphan", order_by="WorkoutSet.position", lazy="selectin"
    )


class WorkoutSet(Base):
    __tablename__ = "workout_sets"
    __table_args__ = (
        UniqueConstraint("workout_exercise_id", "client_id", name="uq_workout_sets_client"),
        CheckConstraint("position >= 0", name="ck_workout_sets_position"),
        CheckConstraint("reps BETWEEN 0 AND 1000 OR reps IS NULL", name="ck_workout_sets_reps"),
        CheckConstraint(
            "weight_kg BETWEEN 0 AND 1000 OR weight_kg IS NULL", name="ck_workout_sets_weight"
        ),
        CheckConstraint("rpe BETWEEN 0 AND 10 OR rpe IS NULL", name="ck_workout_sets_rpe"),
        CheckConstraint("rir BETWEEN 0 AND 20 OR rir IS NULL", name="ck_workout_sets_rir"),
    )
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    workout_exercise_id: Mapped[UUID] = mapped_column(
        ForeignKey("workout_exercises.id", ondelete="CASCADE"), index=True
    )
    client_id: Mapped[UUID] = mapped_column(nullable=False)
    position: Mapped[int] = mapped_column(Integer)
    target_reps: Mapped[int | None] = mapped_column(Integer, nullable=True)
    target_weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(7, 2), nullable=True)
    reps: Mapped[int | None] = mapped_column(Integer, nullable=True)
    weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(7, 2), nullable=True)
    rpe: Mapped[Decimal | None] = mapped_column(Numeric(3, 1), nullable=True)
    rir: Mapped[int | None] = mapped_column(Integer, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class WorkoutMutation(Base):
    __tablename__ = "workout_mutations"
    run_id: Mapped[UUID] = mapped_column(
        ForeignKey("workout_runs.id", ondelete="CASCADE"), primary_key=True
    )
    mutation_id: Mapped[UUID] = mapped_column(primary_key=True)
    digest: Mapped[str] = mapped_column(String(64))
