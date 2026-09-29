"""Add private custom exercises, instruction steps, and typed media."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260929_0007"
down_revision: str | None = "20260929_0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint(
        "workout_plan_exercises_exercise_id_fkey",
        "workout_plan_exercises",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "workout_plan_exercises_exercise_id_fkey",
        "workout_plan_exercises",
        "exercises",
        ["exercise_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.add_column("exercises", sa.Column("owner_user_id", sa.Uuid(), nullable=True))
    op.create_foreign_key(
        "fk_exercises_owner_user_id_users",
        "exercises",
        "users",
        ["owner_user_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index(op.f("ix_exercises_owner_user_id"), "exercises", ["owner_user_id"])
    op.alter_column("exercises", "name_en", existing_type=sa.String(200), nullable=True)

    op.create_table(
        "exercise_instruction_steps",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("exercise_id", sa.Uuid(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("text_fa", sa.Text(), nullable=True),
        sa.Column("text_en", sa.Text(), nullable=True),
        sa.CheckConstraint(
            "text_fa IS NOT NULL OR text_en IS NOT NULL",
            name="ck_exercise_instruction_steps_has_text",
        ),
        sa.CheckConstraint("position >= 0", name="ck_exercise_instruction_steps_position"),
        sa.ForeignKeyConstraint(["exercise_id"], ["exercises.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_exercise_instruction_steps_exercise_id"),
        "exercise_instruction_steps",
        ["exercise_id"],
    )
    op.create_index(
        "uq_exercise_instruction_steps_exercise_position",
        "exercise_instruction_steps",
        ["exercise_id", "position"],
        unique=True,
    )

    op.create_table(
        "exercise_media",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("exercise_id", sa.Uuid(), nullable=False),
        sa.Column("media_type", sa.String(10), nullable=False),
        sa.Column("object_key", sa.String(500), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.CheckConstraint("media_type IN ('gif', 'mp4')", name="ck_exercise_media_type"),
        sa.CheckConstraint("position >= 0", name="ck_exercise_media_position"),
        sa.ForeignKeyConstraint(["exercise_id"], ["exercises.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_exercise_media_exercise_id"),
        "exercise_media",
        ["exercise_id"],
    )
    op.create_index(
        "uq_exercise_media_exercise_position",
        "exercise_media",
        ["exercise_id", "position"],
        unique=True,
    )

    op.execute(
        sa.text(
            """
            INSERT INTO exercise_media (id, exercise_id, media_type, object_key, position)
            SELECT gen_random_uuid(), id, 'mp4', video_key, 0
            FROM exercises
            WHERE video_key IS NOT NULL
            """
        )
    )
    op.execute(
        sa.text(
            """
            INSERT INTO exercise_media (id, exercise_id, media_type, object_key, position)
            SELECT gen_random_uuid(), id, 'gif', image_key,
                   CASE WHEN video_key IS NULL THEN 0 ELSE 1 END
            FROM exercises
            WHERE lower(image_key) LIKE '%.gif'
            """
        )
    )


def downgrade() -> None:
    op.drop_index("uq_exercise_media_exercise_position", table_name="exercise_media")
    op.drop_index(op.f("ix_exercise_media_exercise_id"), table_name="exercise_media")
    op.drop_table("exercise_media")
    op.drop_index(
        "uq_exercise_instruction_steps_exercise_position",
        table_name="exercise_instruction_steps",
    )
    op.drop_index(
        op.f("ix_exercise_instruction_steps_exercise_id"),
        table_name="exercise_instruction_steps",
    )
    op.drop_table("exercise_instruction_steps")
    op.execute("UPDATE exercises SET name_en = name_fa WHERE name_en IS NULL")
    op.alter_column("exercises", "name_en", existing_type=sa.String(200), nullable=False)
    op.drop_index(op.f("ix_exercises_owner_user_id"), table_name="exercises")
    op.drop_constraint("fk_exercises_owner_user_id_users", "exercises", type_="foreignkey")
    op.drop_column("exercises", "owner_user_id")
    op.drop_constraint(
        "workout_plan_exercises_exercise_id_fkey",
        "workout_plan_exercises",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "workout_plan_exercises_exercise_id_fkey",
        "workout_plan_exercises",
        "exercises",
        ["exercise_id"],
        ["id"],
        ondelete="RESTRICT",
    )
