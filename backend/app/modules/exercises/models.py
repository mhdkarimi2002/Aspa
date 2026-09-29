from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class ExerciseDifficulty(StrEnum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class ExerciseMediaType(StrEnum):
    GIF = "gif"
    MP4 = "mp4"


class MuscleGroup(TimestampMixin, Base):
    __tablename__ = "muscle_groups"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name_fa: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Equipment(TimestampMixin, Base):
    __tablename__ = "equipment"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name_fa: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Exercise(TimestampMixin, Base):
    __tablename__ = "exercises"
    __table_args__ = (
        CheckConstraint(
            "difficulty IN ('beginner', 'intermediate', 'advanced')",
            name="ck_exercises_difficulty",
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    name_fa: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description_fa: Mapped[str | None] = mapped_column(Text, nullable=True)
    equipment_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("equipment.id", ondelete="SET NULL"), nullable=True, index=True
    )
    difficulty: Mapped[ExerciseDifficulty] = mapped_column(String(20), nullable=False)
    image_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    video_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    equipment: Mapped[Equipment | None] = relationship(lazy="joined")
    muscle_links: Mapped[list[ExerciseMuscle]] = relationship(
        back_populates="exercise", cascade="all, delete-orphan", lazy="selectin"
    )
    instruction_steps: Mapped[list[ExerciseInstructionStep]] = relationship(
        back_populates="exercise",
        cascade="all, delete-orphan",
        order_by="ExerciseInstructionStep.position",
        lazy="selectin",
    )
    media: Mapped[list[ExerciseMedia]] = relationship(
        back_populates="exercise",
        cascade="all, delete-orphan",
        order_by="ExerciseMedia.position",
        lazy="selectin",
    )


class ExerciseMuscle(Base):
    __tablename__ = "exercise_muscles"

    exercise_id: Mapped[UUID] = mapped_column(
        ForeignKey("exercises.id", ondelete="CASCADE"), primary_key=True
    )
    muscle_group_id: Mapped[UUID] = mapped_column(
        ForeignKey("muscle_groups.id", ondelete="CASCADE"), primary_key=True
    )
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False)

    exercise: Mapped[Exercise] = relationship(back_populates="muscle_links")
    muscle_group: Mapped[MuscleGroup] = relationship(lazy="joined")


class ExerciseInstructionStep(Base):
    __tablename__ = "exercise_instruction_steps"
    __table_args__ = (
        CheckConstraint("position >= 0", name="ck_exercise_instruction_steps_position"),
        Index(
            "uq_exercise_instruction_steps_exercise_position",
            "exercise_id",
            "position",
            unique=True,
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    exercise_id: Mapped[UUID] = mapped_column(
        ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False, index=True
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    text_fa: Mapped[str] = mapped_column(Text, nullable=False)

    exercise: Mapped[Exercise] = relationship(back_populates="instruction_steps")


class ExerciseMedia(Base):
    __tablename__ = "exercise_media"
    __table_args__ = (
        CheckConstraint("position >= 0", name="ck_exercise_media_position"),
        CheckConstraint("media_type IN ('gif', 'mp4')", name="ck_exercise_media_type"),
        Index(
            "uq_exercise_media_exercise_position",
            "exercise_id",
            "position",
            unique=True,
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    exercise_id: Mapped[UUID] = mapped_column(
        ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False, index=True
    )
    media_type: Mapped[ExerciseMediaType] = mapped_column(String(10), nullable=False)
    object_key: Mapped[str] = mapped_column(String(500), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)

    exercise: Mapped[Exercise] = relationship(back_populates="media")
