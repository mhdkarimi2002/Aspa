import pytest
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.seed import seed_database
from app.modules.workout_plans.models import WorkoutPlanDay, WorkoutPlanExercise, WorkoutPlanSet

pytestmark = pytest.mark.integration


async def test_seeded_plans_have_a_target_row_for_every_set(db_session: AsyncSession) -> None:
    await seed_database(db_session)

    planned = await db_session.scalar(select(func.sum(WorkoutPlanExercise.sets)))
    targets = await db_session.scalar(select(func.count(WorkoutPlanSet.id)))
    assert planned is not None and planned > 0
    assert targets == planned
    day_counts = await db_session.execute(
        select(WorkoutPlanDay.plan_id, func.count(WorkoutPlanDay.id)).group_by(
            WorkoutPlanDay.plan_id
        )
    )
    assert all(count == 1 for _, count in day_counts)
