from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from uuid import UUID
from zoneinfo import ZoneInfo

from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.selectable import Subquery

from app.modules.workout_plans.models import WorkoutRun
from app.modules.workouts.models import WorkoutExercise, WorkoutSet

ZONE = ZoneInfo("Asia/Tehran")


class WorkoutBucket(BaseModel):
    date: date
    workouts: int
    duration_seconds: int
    volume_kg: Decimal
    reps: int


class WorkoutStatistics(BaseModel):
    workout_count: int
    duration_seconds: int
    volume_kg: Decimal
    reps: int
    last_week_duration_seconds: int
    weeks: list[WorkoutBucket]


def owned_set_totals(owner: UUID) -> Subquery:
    return (
        select(
            WorkoutExercise.run_id.label("run_id"),
            func.coalesce(func.sum(WorkoutSet.reps * WorkoutSet.weight_kg), 0).label("volume"),
            func.coalesce(func.sum(WorkoutSet.reps), 0).label("reps"),
        )
        .join(WorkoutSet, WorkoutSet.workout_exercise_id == WorkoutExercise.id)
        .join(WorkoutRun, WorkoutRun.id == WorkoutExercise.run_id)
        .where(
            WorkoutRun.user_id == owner,
            WorkoutRun.status == "completed",
            WorkoutSet.completed_at.is_not(None),
        )
        .group_by(WorkoutExercise.run_id)
        .subquery()
    )


async def statistics(
    session: AsyncSession,
    owner: UUID,
    weeks: int,
    week_start: int,
    now: datetime | None = None,
    *,
    all_time: bool = False,
) -> WorkoutStatistics:
    now = (now or datetime.now(UTC)).astimezone(ZONE)
    current = now.date() - timedelta(days=(now.weekday() - week_start) % 7)
    first = current - timedelta(weeks=weeks - 1)
    sets = owned_set_totals(owner)
    duration = func.coalesce(func.sum(WorkoutRun.duration_seconds), 0)
    volume = func.coalesce(func.sum(sets.c.volume), 0)
    reps = func.coalesce(func.sum(sets.c.reps), 0)
    totals = (
        await session.execute(
            select(
                func.count(WorkoutRun.id), duration, volume, reps, func.min(WorkoutRun.completed_at)
            )
            .outerjoin(sets, sets.c.run_id == WorkoutRun.id)
            .where(WorkoutRun.user_id == owner, WorkoutRun.status == "completed")
        )
    ).one()
    if all_time:
        earliest = totals[4].astimezone(ZONE).date() if totals[4] else current
        first = earliest - timedelta(days=(earliest.weekday() - week_start) % 7)
        weeks = max(1, (current - first).days // 7 + 1)
    shift = timedelta(days=(7 - week_start) % 7)
    bucket = (
        func.date_trunc("week", func.timezone("Asia/Tehran", WorkoutRun.completed_at) + shift)
        - shift
    )
    rows = (
        await session.execute(
            select(bucket.label("week"), func.count(WorkoutRun.id), duration, volume, reps)
            .outerjoin(sets, sets.c.run_id == WorkoutRun.id)
            .where(
                WorkoutRun.user_id == owner,
                WorkoutRun.status == "completed",
                WorkoutRun.completed_at
                >= datetime.combine(first - timedelta(weeks=1), datetime.min.time(), ZONE),
                WorkoutRun.completed_at <= now,
            )
            .group_by(bucket)
            .order_by(bucket)
        )
    ).all()
    by_date = {
        row[0].date(): WorkoutBucket(
            date=row[0].date(),
            workouts=row[1],
            duration_seconds=int(row[2]),
            volume_kg=row[3],
            reps=int(row[4]),
        )
        for row in rows
    }
    return WorkoutStatistics(
        workout_count=totals[0],
        duration_seconds=int(totals[1]),
        volume_kg=totals[2],
        reps=int(totals[3]),
        last_week_duration_seconds=by_date[current - timedelta(weeks=1)].duration_seconds
        if current - timedelta(weeks=1) in by_date
        else 0,
        weeks=[
            by_date.get(
                first + timedelta(weeks=i),
                WorkoutBucket(
                    date=first + timedelta(weeks=i),
                    workouts=0,
                    duration_seconds=0,
                    volume_kg=Decimal(0),
                    reps=0,
                ),
            )
            for i in range(weeks)
        ],
    )


async def calendar(session: AsyncSession, owner: UUID, month: date) -> list[WorkoutBucket]:
    first = month.replace(day=1)
    end = (first.replace(day=28) + timedelta(days=4)).replace(day=1)
    sets = owned_set_totals(owner)
    day = func.date(func.timezone("Asia/Tehran", WorkoutRun.completed_at))
    rows = (
        await session.execute(
            select(
                day,
                func.count(WorkoutRun.id),
                func.coalesce(func.sum(WorkoutRun.duration_seconds), 0),
                func.coalesce(func.sum(sets.c.volume), 0),
                func.coalesce(func.sum(sets.c.reps), 0),
            )
            .outerjoin(sets, sets.c.run_id == WorkoutRun.id)
            .where(
                WorkoutRun.user_id == owner,
                WorkoutRun.status == "completed",
                WorkoutRun.completed_at >= datetime.combine(first, datetime.min.time(), ZONE),
                WorkoutRun.completed_at < datetime.combine(end, datetime.min.time(), ZONE),
            )
            .group_by(day)
            .order_by(day)
        )
    ).all()
    return [
        WorkoutBucket(
            date=row[0],
            workouts=row[1],
            duration_seconds=int(row[2]),
            volume_kg=row[3],
            reps=int(row[4]),
        )
        for row in rows
    ]
