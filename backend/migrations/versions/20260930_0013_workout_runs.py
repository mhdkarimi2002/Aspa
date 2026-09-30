"""Record repeated executions of a reusable workout plan."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260930_0013"
down_revision: str | None = "20260930_0012"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "workout_runs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("plan_id", sa.Uuid(), nullable=True),
        sa.Column("client_id", sa.Uuid(), nullable=True),
        sa.Column("plan_name", sa.String(120), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.CheckConstraint(
            "status IN ('in_progress', 'completed', 'cancelled')",
            name="ck_workout_runs_status",
        ),
        sa.CheckConstraint(
            "duration_seconds >= 0 OR duration_seconds IS NULL",
            name="ck_workout_runs_duration",
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["plan_id"], ["workout_plans.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "client_id", name="uq_workout_runs_user_client_id"),
    )
    op.create_index("ix_workout_runs_user_id", "workout_runs", ["user_id"])
    op.create_index("ix_workout_runs_plan_id", "workout_runs", ["plan_id"])
    op.create_index(
        "uq_workout_runs_one_in_progress_per_user",
        "workout_runs",
        ["user_id"],
        unique=True,
        postgresql_where=sa.text("status = 'in_progress'"),
    )


def downgrade() -> None:
    op.drop_index("uq_workout_runs_one_in_progress_per_user", table_name="workout_runs")
    op.drop_index("ix_workout_runs_plan_id", table_name="workout_runs")
    op.drop_index("ix_workout_runs_user_id", table_name="workout_runs")
    op.drop_table("workout_runs")
