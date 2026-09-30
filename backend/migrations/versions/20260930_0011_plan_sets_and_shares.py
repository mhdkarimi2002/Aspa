"""Add per-set workout plan targets and fixed share snapshots."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260930_0011"
down_revision: str | None = "20260930_0010"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "workout_plan_sets",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("plan_exercise_id", sa.Uuid(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("target_reps", sa.Integer(), nullable=False),
        sa.Column("target_weight_kg", sa.Numeric(7, 2), nullable=True),
        sa.CheckConstraint("position >= 0", name="ck_workout_plan_sets_position"),
        sa.CheckConstraint("target_reps BETWEEN 1 AND 100", name="ck_workout_plan_sets_reps"),
        sa.CheckConstraint(
            "target_weight_kg BETWEEN 0 AND 1000 OR target_weight_kg IS NULL",
            name="ck_workout_plan_sets_weight",
        ),
        sa.ForeignKeyConstraint(
            ["plan_exercise_id"], ["workout_plan_exercises.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_workout_plan_sets_plan_exercise_id", "workout_plan_sets", ["plan_exercise_id"]
    )
    op.execute(
        """
        INSERT INTO workout_plan_sets (id, plan_exercise_id, position, target_reps)
        SELECT gen_random_uuid(), exercise.id, series.position, exercise.min_reps
        FROM workout_plan_exercises AS exercise
        CROSS JOIN LATERAL generate_series(0, exercise.sets - 1) AS series(position)
        """
    )
    op.create_table(
        "workout_plan_shares",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("plan_id", sa.Uuid(), nullable=False),
        sa.Column("owner_user_id", sa.Uuid(), nullable=False),
        sa.Column("token_digest", sa.String(64), nullable=False),
        sa.Column("snapshot", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["plan_id"], ["workout_plans.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_digest"),
    )
    op.create_index("ix_workout_plan_shares_plan_id", "workout_plan_shares", ["plan_id"])
    op.create_index(
        "ix_workout_plan_shares_owner_user_id", "workout_plan_shares", ["owner_user_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_workout_plan_shares_owner_user_id", table_name="workout_plan_shares")
    op.drop_index("ix_workout_plan_shares_plan_id", table_name="workout_plan_shares")
    op.drop_table("workout_plan_shares")
    op.drop_index("ix_workout_plan_sets_plan_exercise_id", table_name="workout_plan_sets")
    op.drop_table("workout_plan_sets")
