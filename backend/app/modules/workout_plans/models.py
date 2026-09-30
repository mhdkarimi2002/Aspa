from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.modules.exercises.models import Exercise


class WorkoutPlan(TimestampMixin, Base):
    __tablename__ = "workout_plans"
    __table_args__ = (
        Index(
            "uq_workout_plans_one_active_per_user",
            "user_id",
            unique=True,
            postgresql_where=text("is_active"),
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    legacy_day_groups: Mapped[list[dict[str, object]] | None] = mapped_column(JSON, nullable=True)

    days: Mapped[list[WorkoutPlanDay]] = relationship(
        back_populates="plan",
        cascade="all, delete-orphan",
        order_by="WorkoutPlanDay.position",
        lazy="selectin",
    )


class WorkoutPlanDay(TimestampMixin, Base):
    __tablename__ = "workout_plan_days"
    __table_args__ = (CheckConstraint("position >= 0", name="ck_workout_plan_days_position"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    plan_id: Mapped[UUID] = mapped_column(
        ForeignKey("workout_plans.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)

    plan: Mapped[WorkoutPlan] = relationship(back_populates="days")
    exercises: Mapped[list[WorkoutPlanExercise]] = relationship(
        back_populates="day",
        cascade="all, delete-orphan",
        order_by="WorkoutPlanExercise.position",
        lazy="selectin",
    )


class WorkoutPlanExercise(TimestampMixin, Base):
    __tablename__ = "workout_plan_exercises"
    __table_args__ = (
        CheckConstraint("position >= 0", name="ck_workout_plan_exercises_position"),
        CheckConstraint("sets BETWEEN 1 AND 20", name="ck_workout_plan_exercises_sets"),
        CheckConstraint("min_reps BETWEEN 1 AND 100", name="ck_workout_plan_exercises_min_reps"),
        CheckConstraint(
            "max_reps BETWEEN min_reps AND 100",
            name="ck_workout_plan_exercises_max_reps",
        ),
        CheckConstraint(
            "rest_seconds BETWEEN 0 AND 3600",
            name="ck_workout_plan_exercises_rest_seconds",
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    day_id: Mapped[UUID] = mapped_column(
        ForeignKey("workout_plan_days.id", ondelete="CASCADE"), nullable=False, index=True
    )
    exercise_id: Mapped[UUID] = mapped_column(
        ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False, index=True
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    sets: Mapped[int] = mapped_column(Integer, nullable=False)
    min_reps: Mapped[int] = mapped_column(Integer, nullable=False)
    max_reps: Mapped[int] = mapped_column(Integer, nullable=False)
    rest_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)

    day: Mapped[WorkoutPlanDay] = relationship(back_populates="exercises")
    exercise: Mapped[Exercise] = relationship(lazy="joined")
    target_sets: Mapped[list[WorkoutPlanSet]] = relationship(
        back_populates="plan_exercise",
        cascade="all, delete-orphan",
        order_by="WorkoutPlanSet.position",
        lazy="selectin",
    )


class WorkoutPlanSet(Base):
    __tablename__ = "workout_plan_sets"
    __table_args__ = (
        CheckConstraint("position >= 0", name="ck_workout_plan_sets_position"),
        CheckConstraint("target_reps BETWEEN 1 AND 100", name="ck_workout_plan_sets_reps"),
        CheckConstraint(
            "target_weight_kg BETWEEN 0 AND 1000 OR target_weight_kg IS NULL",
            name="ck_workout_plan_sets_weight",
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    plan_exercise_id: Mapped[UUID] = mapped_column(
        ForeignKey("workout_plan_exercises.id", ondelete="CASCADE"), nullable=False, index=True
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    target_reps: Mapped[int] = mapped_column(Integer, nullable=False)
    target_weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(7, 2), nullable=True)
    plan_exercise: Mapped[WorkoutPlanExercise] = relationship(back_populates="target_sets")


class WorkoutPlanShare(Base):
    __tablename__ = "workout_plan_shares"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    plan_id: Mapped[UUID] = mapped_column(
        ForeignKey("workout_plans.id", ondelete="CASCADE"), nullable=False, index=True
    )
    owner_user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    token_digest: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    snapshot: Mapped[dict[str, object]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class WorkoutRun(Base):
    __tablename__ = "workout_runs"
    __table_args__ = (
        CheckConstraint(
            "status IN ('in_progress', 'completed', 'cancelled')",
            name="ck_workout_runs_status",
        ),
        CheckConstraint(
            "duration_seconds >= 0 OR duration_seconds IS NULL",
            name="ck_workout_runs_duration",
        ),
        UniqueConstraint("user_id", "client_id", name="uq_workout_runs_user_client_id"),
        Index(
            "uq_workout_runs_one_in_progress_per_user",
            "user_id",
            unique=True,
            postgresql_where=text("status = 'in_progress'"),
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    plan_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("workout_plans.id", ondelete="SET NULL"), nullable=True, index=True
    )
    client_id: Mapped[UUID | None] = mapped_column(nullable=True)
    plan_name: Mapped[str] = mapped_column(String(120), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
