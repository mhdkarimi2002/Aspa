"""workout tracking and reviewed media

Revision ID: 20261009_0014
Revises: 20260930_0013
Create Date: 2026-10-09 12:04:52.615710
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20261009_0014"
down_revision: str | None = "20260930_0013"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("UPDATE workout_runs SET client_id = id WHERE client_id IS NULL")
    op.create_table(
        "media_assets",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("object_key", sa.String(length=500), nullable=False),
        sa.Column("content_type", sa.String(length=100), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("review_status", sa.String(length=20), nullable=False),
        sa.Column("rights_status", sa.String(length=20), nullable=False),
        sa.Column("rights_reference", sa.String(length=1000), nullable=True),
        sa.Column("uploaded_by", sa.Uuid(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "review_status IN ('pending', 'approved', 'rejected')", name="ck_media_review"
        ),
        sa.CheckConstraint(
            "rights_status IN ('unknown', 'owned', 'licensed', 'public_domain')",
            name="ck_media_rights",
        ),
        sa.ForeignKeyConstraint(["uploaded_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("object_key"),
    )
    op.create_table(
        "workout_exercises",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("run_id", sa.Uuid(), nullable=False),
        sa.Column("client_id", sa.Uuid(), nullable=False),
        sa.Column("exercise_id", sa.Uuid(), nullable=True),
        sa.Column("name_fa", sa.String(length=200), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("rest_seconds", sa.Integer(), nullable=False),
        sa.CheckConstraint("position >= 0", name="ck_workout_exercises_position"),
        sa.CheckConstraint("rest_seconds BETWEEN 0 AND 3600", name="ck_workout_exercises_rest"),
        sa.ForeignKeyConstraint(["exercise_id"], ["exercises.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["run_id"], ["workout_runs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("run_id", "client_id", name="uq_workout_exercises_client"),
    )
    op.create_index(
        op.f("ix_workout_exercises_exercise_id"), "workout_exercises", ["exercise_id"], unique=False
    )
    op.create_index(
        op.f("ix_workout_exercises_run_id"), "workout_exercises", ["run_id"], unique=False
    )
    op.create_table(
        "workout_mutations",
        sa.Column("run_id", sa.Uuid(), nullable=False),
        sa.Column("mutation_id", sa.Uuid(), nullable=False),
        sa.Column("digest", sa.String(length=64), nullable=False),
        sa.ForeignKeyConstraint(["run_id"], ["workout_runs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("run_id", "mutation_id"),
    )
    op.create_table(
        "workout_sets",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("workout_exercise_id", sa.Uuid(), nullable=False),
        sa.Column("client_id", sa.Uuid(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("target_reps", sa.Integer(), nullable=True),
        sa.Column("target_weight_kg", sa.Numeric(precision=7, scale=2), nullable=True),
        sa.Column("reps", sa.Integer(), nullable=True),
        sa.Column("weight_kg", sa.Numeric(precision=7, scale=2), nullable=True),
        sa.Column("rpe", sa.Numeric(precision=3, scale=1), nullable=True),
        sa.Column("rir", sa.Integer(), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("position >= 0", name="ck_workout_sets_position"),
        sa.CheckConstraint("reps BETWEEN 0 AND 1000 OR reps IS NULL", name="ck_workout_sets_reps"),
        sa.CheckConstraint("rir BETWEEN 0 AND 20 OR rir IS NULL", name="ck_workout_sets_rir"),
        sa.CheckConstraint("rpe BETWEEN 0 AND 10 OR rpe IS NULL", name="ck_workout_sets_rpe"),
        sa.CheckConstraint(
            "weight_kg BETWEEN 0 AND 1000 OR weight_kg IS NULL", name="ck_workout_sets_weight"
        ),
        sa.ForeignKeyConstraint(
            ["workout_exercise_id"], ["workout_exercises.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("workout_exercise_id", "client_id", name="uq_workout_sets_client"),
    )
    op.create_index(
        op.f("ix_workout_sets_workout_exercise_id"),
        "workout_sets",
        ["workout_exercise_id"],
        unique=False,
    )
    op.add_column(
        "workout_runs", sa.Column("version", sa.Integer(), server_default="0", nullable=False)
    )


def downgrade() -> None:
    op.drop_column("workout_runs", "version")
    op.drop_index(op.f("ix_workout_sets_workout_exercise_id"), table_name="workout_sets")
    op.drop_table("workout_sets")
    op.drop_table("workout_mutations")
    op.drop_index(op.f("ix_workout_exercises_run_id"), table_name="workout_exercises")
    op.drop_index(op.f("ix_workout_exercises_exercise_id"), table_name="workout_exercises")
    op.drop_table("workout_exercises")
    op.drop_table("media_assets")
