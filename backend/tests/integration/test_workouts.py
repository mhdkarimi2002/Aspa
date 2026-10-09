import asyncio
from copy import deepcopy
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.security import create_access_token
from app.modules.exercises.models import Exercise, ExerciseDifficulty
from app.modules.users.models import User
from app.modules.workout_plans.models import WorkoutRun
from app.modules.workouts.models import WorkoutSet
from app.modules.workouts.schemas import StartWorkoutRequest
from app.modules.workouts.service import WorkoutService

pytestmark = pytest.mark.integration


@pytest.fixture
async def workout_data(db_session: AsyncSession):
    user = User(phone_number="+989123451234", is_active=True)
    other = User(phone_number="+989123451235", is_active=True)
    exercise = Exercise(name_fa="اسکوات", difficulty=ExerciseDifficulty.BEGINNER, is_active=True)
    private = Exercise(name_fa="خصوصی", difficulty=ExerciseDifficulty.BEGINNER, is_active=True)
    db_session.add_all([user, other, exercise])
    await db_session.flush()
    private.owner_user_id = other.id
    db_session.add(private)
    await db_session.flush()
    return user, other, exercise, private


def headers(user: User):
    return {"Authorization": f"Bearer {create_access_token(user.id)}"}


def document(exercise: Exercise, *, completed: bool = False):
    start = datetime.now(UTC) - timedelta(minutes=10)
    end = start + timedelta(minutes=5)
    return {
        "client_id": str(uuid4()),
        "mutation_id": str(uuid4()),
        "expected_version": 0,
        "plan_id": None,
        "started_at": start.isoformat(),
        "status": "completed" if completed else "in_progress",
        "completed_at": end.isoformat() if completed else None,
        "exercises": [
            {
                "client_id": str(uuid4()),
                "exercise_id": str(exercise.id),
                "rest_seconds": 90,
                "sets": [
                    {
                        "client_id": str(uuid4()),
                        "target_reps": 10,
                        "target_weight_kg": "40.00",
                        "reps": 8,
                        "weight_kg": "42.50",
                        "rpe": "8.5",
                        "rir": 2,
                        "completed_at": end.isoformat(),
                    }
                ],
            }
        ],
    }


async def test_offline_completed_sync_is_atomic_and_retryable(
    integration_client, db_session, workout_data
):
    user, _, exercise, _ = workout_data
    data = document(exercise, completed=True)
    first = await integration_client.put("/api/workouts/sync", headers=headers(user), json=data)
    assert first.status_code == 200, first.text
    saved = first.json()
    assert saved["duration_seconds"] == 300
    assert saved["version"] == 1
    assert saved["exercises"][0]["sets"][0]["weight_kg"] == "42.50"
    retry = await integration_client.put("/api/workouts/sync", headers=headers(user), json=data)
    assert retry.json() == saved
    assert await db_session.scalar(select(func.count()).select_from(WorkoutRun)) == 1
    assert await db_session.scalar(select(func.count()).select_from(WorkoutSet)) == 1
    history = await integration_client.get(
        f"/api/workouts/exercises/{exercise.id}/history", headers=headers(user)
    )
    assert [row["id"] for row in history.json()] == [saved["id"]]


async def test_edit_add_remove_and_conflicts(integration_client, workout_data):
    user, other, exercise, _ = workout_data
    data = document(exercise)
    first = await integration_client.put("/api/workouts/sync", headers=headers(user), json=data)
    assert first.status_code == 200, first.text
    first_set = first.json()["exercises"][0]["sets"][0]
    changed = deepcopy(data)
    changed["mutation_id"] = str(uuid4())
    changed["expected_version"] = 1
    changed["plan_name"] = "Renamed workout"
    changed["exercises"][0]["sets"][0].update(reps=12, weight_kg="50.00", target_weight_kg="999.00")
    changed["exercises"][0]["sets"].append(
        {"client_id": str(uuid4()), "reps": 6, "weight_kg": "50.00"}
    )
    result = await integration_client.put("/api/workouts/sync", headers=headers(user), json=changed)
    assert result.status_code == 200, result.text
    assert result.json()["plan_name"] == "Renamed workout"
    sets = result.json()["exercises"][0]["sets"]
    assert sets[0]["id"] == first_set["id"]
    assert sets[0]["target_weight_kg"] == "40.00"
    assert len(sets) == 2
    assert (
        await integration_client.put("/api/workouts/sync", headers=headers(user), json=data)
    ).json()["version"] == 2
    stale = deepcopy(data)
    stale["mutation_id"] = str(uuid4())
    assert (
        await integration_client.put("/api/workouts/sync", headers=headers(user), json=stale)
    ).status_code == 409
    reused = deepcopy(changed)
    reused["exercises"] = []
    assert (
        await integration_client.put("/api/workouts/sync", headers=headers(user), json=reused)
    ).status_code == 409
    assert (
        await integration_client.get(f"/api/workouts/{result.json()['id']}", headers=headers(other))
    ).status_code == 404
    changed.update(mutation_id=str(uuid4()), expected_version=2, exercises=[])
    removed = await integration_client.put(
        "/api/workouts/sync", headers=headers(user), json=changed
    )
    assert removed.status_code == 200, removed.text
    assert removed.json()["exercises"] == []


@pytest.mark.parametrize(
    "invalid", ["private", "inactive", "negative", "duplicate", "naive", "future", "missing_actual"]
)
async def test_invalid_sync_leaves_no_run(integration_client, db_session, workout_data, invalid):
    user, _, exercise, private = workout_data
    data = document(exercise)
    if invalid == "private":
        data["exercises"][0]["exercise_id"] = str(private.id)
    if invalid == "inactive":
        exercise.is_active = False
        await db_session.flush()
    if invalid == "negative":
        data["exercises"][0]["sets"][0]["weight_kg"] = "-1"
    if invalid == "duplicate":
        data["exercises"].append(deepcopy(data["exercises"][0]))
    if invalid == "naive":
        data["started_at"] = "2026-10-01T10:00:00"
    if invalid == "future":
        data["started_at"] = (datetime.now(UTC) + timedelta(days=1)).isoformat()
    if invalid == "missing_actual":
        data["exercises"][0]["sets"][0]["reps"] = None
    response = await integration_client.put("/api/workouts/sync", headers=headers(user), json=data)
    assert response.status_code in (404, 422), response.text
    # A failed request is rolled back by its request-scoped session. The shared test
    # session emulates that explicitly before querying persisted data.
    await db_session.rollback()
    assert await db_session.scalar(select(func.count()).select_from(WorkoutRun)) == 0


async def test_plan_snapshot_and_history_survive_deletion(
    integration_client, db_session, workout_data
):
    user, _, exercise, _ = workout_data
    auth = headers(user)
    plan = (
        await integration_client.post("/api/workout-plans", headers=auth, json={"name": "برنامه"})
    ).json()
    await integration_client.post(
        f"/api/workout-plans/{plan['id']}/exercises",
        headers=auth,
        json={"exercise_id": str(exercise.id), "sets": 2, "min_reps": 8, "max_reps": 10},
    )
    run = (
        await integration_client.post(
            "/api/workouts", headers=auth, json={"plan_id": plan["id"], "client_id": str(uuid4())}
        )
    ).json()
    assert len(run["exercises"][0]["sets"]) == 2
    assert run["exercises"][0]["sets"][0]["reps"] is None
    exercise.name_fa = "نام جدید"
    await db_session.flush()
    finished = await integration_client.post(f"/api/workouts/{run['id']}/complete", headers=auth)
    assert finished.json()["exercises"][0]["name_fa"] == "اسکوات"
    await integration_client.delete(f"/api/workout-plans/{plan['id']}", headers=auth)
    await db_session.delete(exercise)
    await db_session.flush()
    retained = (await integration_client.get(f"/api/workouts/{run['id']}", headers=auth)).json()
    assert retained["plan_id"] is None
    assert retained["exercises"][0]["exercise_id"] is None
    assert retained["exercises"][0]["name_fa"] == "اسکوات"


async def test_empty_workout_cancel_and_terminal_edits(integration_client, workout_data):
    user, _, exercise, _ = workout_data
    auth = headers(user)
    run = await integration_client.post(
        "/api/workouts", headers=auth, json={"client_id": str(uuid4())}
    )
    assert run.status_code == 201, run.text
    saved = run.json()
    assert (await integration_client.get("/api/workouts/active", headers=auth)).json()[
        "id"
    ] == saved["id"]
    data = document(exercise)
    data.update(client_id=saved["client_id"], started_at=saved["started_at"])
    data["exercises"] = []
    assert (
        await integration_client.put("/api/workouts/sync", headers=auth, json=data)
    ).status_code == 200
    await integration_client.post(f"/api/workouts/{saved['id']}/cancel", headers=auth)
    data.update(expected_version=2, mutation_id=str(uuid4()))
    assert (
        await integration_client.put("/api/workouts/sync", headers=auth, json=data)
    ).status_code == 409
    assert (await integration_client.get("/api/workouts", headers=auth)).json() == []


async def test_concurrent_start_retries_share_one_run(migrated_database):
    engine = create_async_engine(migrated_database)
    sessions = async_sessionmaker(engine, expire_on_commit=False)
    user = User(phone_number="+989129998877", is_active=True)
    async with sessions() as session:
        session.add(user)
        await session.commit()
    data = StartWorkoutRequest(client_id=uuid4())

    async def start():
        async with sessions() as session:
            return await WorkoutService(session, user.id).start(data)

    try:
        first, second = await asyncio.gather(start(), start())
        assert first.id == second.id
        async with sessions() as session:
            assert (
                await session.scalar(
                    select(func.count())
                    .select_from(WorkoutRun)
                    .where(WorkoutRun.user_id == user.id)
                )
                == 1
            )
    finally:
        async with sessions() as session:
            await session.execute(delete(User).where(User.id == user.id))
            await session.commit()
        await engine.dispose()


async def test_offline_history_survives_deleted_plan_and_deactivated_catalog(
    integration_client, db_session, workout_data
):
    user, _, exercise, _ = workout_data
    auth = headers(user)
    # Finishing an offline workout must not interfere with a newer active session.
    active = await integration_client.post("/api/workouts", headers=auth, json={})
    assert active.status_code == 201
    exercise.is_active = False
    await db_session.flush()
    data = document(exercise, completed=True)
    data.update(plan_id=str(uuid4()), plan_name="برنامهٔ حذف‌شده")
    result = await integration_client.put("/api/workouts/sync", headers=auth, json=data)
    assert result.status_code == 200, result.text
    assert result.json()["plan_id"] is None
    assert result.json()["plan_name"] == "برنامهٔ حذف‌شده"
    assert (await integration_client.get("/api/workouts/active", headers=auth)).json()[
        "id"
    ] == active.json()["id"]


async def test_live_log_preserves_deleted_exercise_snapshot(
    integration_client, db_session, workout_data
):
    user, _, exercise, _ = workout_data
    data = document(exercise)
    result = await integration_client.put("/api/workouts/sync", headers=headers(user), json=data)
    assert result.status_code == 200, result.text
    await db_session.delete(exercise)
    await db_session.flush()
    data.update(mutation_id=str(uuid4()), expected_version=1)
    data["exercises"][0]["exercise_id"] = None
    data["exercises"][0]["sets"][0]["reps"] = 12
    changed = await integration_client.put("/api/workouts/sync", headers=headers(user), json=data)
    assert changed.status_code == 200, changed.text
    assert changed.json()["exercises"][0]["name_fa"] == "اسکوات"
    assert changed.json()["exercises"][0]["sets"][0]["reps"] == 12
