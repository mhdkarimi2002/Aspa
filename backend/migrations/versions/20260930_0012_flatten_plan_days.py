"""Normalize existing routines to one ordered exercise list per plan."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260930_0012"
down_revision: str | None = "20260930_0011"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("workout_plans", sa.Column("legacy_day_groups", sa.JSON(), nullable=True))
    op.execute(
        """
        UPDATE workout_plans AS plan
        SET legacy_day_groups = source.groups
        FROM (
            SELECT day.plan_id,
                   json_agg(
                       json_build_object(
                           'name', day.name,
                           'position', day.position,
                           'exercise_ids', (
                               SELECT coalesce(
                                   json_agg(exercise.id ORDER BY exercise.position), '[]'::json
                               )
                               FROM workout_plan_exercises AS exercise
                               WHERE exercise.day_id = day.id
                           )
                       ) ORDER BY day.position, day.id
                   ) AS groups
            FROM workout_plan_days AS day
            GROUP BY day.plan_id
            HAVING count(*) > 1
        ) AS source
        WHERE plan.id = source.plan_id
        """
    )
    op.execute(
        """
        WITH first_days AS (
            SELECT DISTINCT ON (plan_id) plan_id, id AS first_day_id
            FROM workout_plan_days
            ORDER BY plan_id, position, id
        ), ranked AS (
            SELECT exercise.id,
                   first_days.first_day_id,
                   row_number() OVER (
                       PARTITION BY day.plan_id
                       ORDER BY day.position, day.id, exercise.position, exercise.id
                   ) - 1 AS new_position
            FROM workout_plan_exercises AS exercise
            JOIN workout_plan_days AS day ON day.id = exercise.day_id
            JOIN first_days ON first_days.plan_id = day.plan_id
        )
        UPDATE workout_plan_exercises AS exercise
        SET day_id = ranked.first_day_id, position = ranked.new_position
        FROM ranked WHERE exercise.id = ranked.id
        """
    )
    op.execute(
        """
        DELETE FROM workout_plan_days AS day
        WHERE day.id NOT IN (
            SELECT DISTINCT ON (plan_id) id
            FROM workout_plan_days
            ORDER BY plan_id, position, id
        )
        """
    )


def downgrade() -> None:
    # The former groups remain in legacy_day_groups until this schema is removed.
    op.drop_column("workout_plans", "legacy_day_groups")
