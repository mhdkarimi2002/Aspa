from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.modules.users.models import User
from app.modules.workout_plans.models import WorkoutRun
from app.modules.workouts.models import WorkoutExercise, WorkoutSet
from app.modules.workouts.statistics import statistics

pytestmark = pytest.mark.integration


async def test_profile_fields_roundtrip_validation_and_owner_isolation(
    integration_client, db_session: AsyncSession
):
    user, other = User(phone_number="+989" + str(uuid4().int % 10**9).zfill(9)), User()
    db_session.add_all([user, other])
    await db_session.flush()
    catalogue = await integration_client.get("/api/users/provinces")
    assert catalogue.status_code == 200
    assert len(catalogue.json()) == 31
    assert {"id": "tehran", "fa": "تهران", "en": "Tehran"} in catalogue.json()
    headers = {"Authorization": "Bearer " + create_access_token(user.id)}
    saved = await integration_client.patch(
        "/api/users/me",
        headers=headers,
        json={
            "name": "  Mehdi Karimi  ",
            "province": "  تهران  ",
            "bio": "Training weekly",
            "profile_link": "https://example.com/me",
        },
    )
    assert saved.status_code == 200, saved.text
    assert saved.json()["name"] == "Mehdi Karimi"
    assert saved.json()["province"] == "tehran"
    assert saved.json()["bio"] == "Training weekly"
    assert saved.json()["birthdate"] is None
    fetched = await integration_client.get("/api/users/me", headers=headers)
    assert fetched.json()["province"] == "tehran"
    assert fetched.json()["profile_link"] == "https://example.com/me"
    other_profile = await integration_client.get(
        "/api/users/me", headers={"Authorization": "Bearer " + create_access_token(other.id)}
    )
    assert other_profile.json()["name"] is None
    assert other_profile.json()["province"] is None
    assert (
        await integration_client.patch(
            "/api/users/me", headers=headers, json={"province": "x" * 101}
        )
    ).status_code == 422
    assert (
        await integration_client.patch("/api/users/me", headers=headers, json={"province": ""})
    ).json()["province"] is None
    for link in [
        "javascript:alert(1)",
        "https://name:secret@example.com",
        "https://example.com:invalid",
    ]:
        invalid = await integration_client.patch(
            "/api/users/me", headers=headers, json={"profile_link": link}
        )
        assert invalid.status_code == 422
    invalid = await integration_client.patch(
        "/api/users/me", headers=headers, json={"bio": "x" * 501}
    )
    assert invalid.status_code == 422
    cleared = await integration_client.patch(
        "/api/users/me", headers=headers, json={"name": None, "bio": "", "profile_link": None}
    )
    assert cleared.json()["name"] is None and cleared.json()["bio"] is None


async def test_statistics_count_each_workout_once_and_only_completed_actual_sets(
    integration_client, db_session: AsyncSession
):
    user, other = User(), User()
    db_session.add_all([user, other])
    await db_session.flush()
    ends = [
        datetime(2026, 10, 5, 14, tzinfo=UTC),
        datetime(2026, 10, 8, 15, tzinfo=UTC),
        datetime(2026, 9, 29, 10, tzinfo=UTC),
    ]
    runs = [
        WorkoutRun(
            user_id=user.id,
            client_id=uuid4(),
            plan_name="Training",
            status="completed",
            started_at=end,
            completed_at=end,
            duration_seconds=duration,
            exercises=[],
        )
        for end, duration in zip(ends, [600, 1800, 3600], strict=True)
    ]
    runs += [
        WorkoutRun(
            user_id=user.id,
            client_id=uuid4(),
            plan_name="Cancelled",
            status="cancelled",
            started_at=ends[0],
            duration_seconds=9999,
            exercises=[],
        ),
        WorkoutRun(
            user_id=other.id,
            client_id=uuid4(),
            plan_name="Other",
            status="completed",
            started_at=ends[0],
            completed_at=ends[0],
            duration_seconds=9999,
            exercises=[],
        ),
    ]
    db_session.add_all(runs)
    await db_session.flush()
    exercise = WorkoutExercise(
        run_id=runs[0].id,
        client_id=uuid4(),
        name_fa="Exercise",
        position=0,
        rest_seconds=90,
        sets=[],
    )
    db_session.add(exercise)
    await db_session.flush()
    db_session.add_all(
        [
            WorkoutSet(
                workout_exercise_id=exercise.id,
                client_id=uuid4(),
                position=i,
                reps=reps,
                weight_kg=Decimal(40),
                completed_at=ends[0] if i < 2 else None,
            )
            for i, reps in enumerate([12, 6, 99])
        ]
    )
    await db_session.flush()
    result = await statistics(db_session, user.id, 13, 0, datetime(2026, 10, 9, tzinfo=UTC))
    assert result.workout_count == 3 and result.duration_seconds == 6000
    assert result.volume_kg == Decimal(720) and result.reps == 18
    assert len(result.weeks) == 13
    assert result.weeks[-1].date == date(2026, 10, 5)
    assert result.weeks[-1].duration_seconds == 2400
    assert result.last_week_duration_seconds == 3600
    assert (await statistics(db_session, user.id, 13, 5, datetime(2026, 10, 9, tzinfo=UTC))).weeks[
        -1
    ].date == date(2026, 10, 3)
    headers = {"Authorization": "Bearer " + create_access_token(user.id)}
    response = await integration_client.get("/api/workouts/statistics?weeks=4", headers=headers)
    assert response.status_code == 200, response.text
    assert response.json()["workout_count"] == 3
    assert (
        await integration_client.get("/api/workouts/statistics?weeks=53", headers=headers)
    ).status_code == 422
    assert (await integration_client.get("/api/workouts/statistics")).status_code == 401


async def test_calendar_and_history_use_tehran_day_not_utc(
    integration_client, db_session: AsyncSession
):
    user = User()
    db_session.add(user)
    await db_session.flush()
    moment = datetime(2026, 9, 30, 21, tzinfo=UTC)  # Oct 1 at 00:30 in Tehran.
    run = WorkoutRun(
        user_id=user.id,
        client_id=uuid4(),
        plan_name="Boundary",
        status="completed",
        started_at=moment,
        completed_at=moment,
        duration_seconds=60,
        exercises=[],
    )
    db_session.add(run)
    await db_session.flush()
    headers = {"Authorization": "Bearer " + create_access_token(user.id)}
    october = await integration_client.get(
        "/api/workouts/calendar?month=2026-10-01", headers=headers
    )
    assert october.status_code == 200, october.text
    assert october.json()[0]["date"] == "2026-10-01"
    september = await integration_client.get(
        "/api/workouts/calendar?month=2026-09-01", headers=headers
    )
    assert september.json() == []
    history = await integration_client.get(
        "/api/workouts?completed_date=2026-10-01", headers=headers
    )
    assert [item["id"] for item in history.json()] == [str(run.id)]
    assert (
        await integration_client.get("/api/workouts?completed_date=2026-09-30", headers=headers)
    ).json() == []
    assert (
        await integration_client.get("/api/workouts/calendar?month=9999-12-01", headers=headers)
    ).status_code == 422


async def test_all_time_chart_includes_old_workouts_and_no_other_owner(
    integration_client, db_session: AsyncSession
):
    user, other = User(), User()
    db_session.add_all([user, other])
    await db_session.flush()
    for owner, moment in [
        (user.id, datetime(2024, 1, 1, 15, tzinfo=UTC)),
        (other.id, datetime(2020, 1, 1, 15, tzinfo=UTC)),
    ]:
        db_session.add(
            WorkoutRun(
                user_id=owner,
                client_id=uuid4(),
                plan_name="Older workout",
                status="completed",
                started_at=moment,
                completed_at=moment,
                duration_seconds=600,
                exercises=[],
            )
        )
    await db_session.flush()
    headers = {"Authorization": "Bearer " + create_access_token(user.id)}
    yearly = await integration_client.get("/api/workouts/statistics?weeks=52", headers=headers)
    assert yearly.status_code == 200
    assert len(yearly.json()["weeks"]) == 52
    assert sum(w["workouts"] for w in yearly.json()["weeks"]) == 0
    all_time = await integration_client.get(
        "/api/workouts/statistics?all_time=true&week_start=5", headers=headers
    )
    assert all_time.status_code == 200, all_time.text
    weeks = all_time.json()["weeks"]
    assert len(weeks) > 52 and weeks[0]["date"] == "2023-12-30"
    assert sum(w["workouts"] for w in weeks) == 1
    assert sum(w["duration_seconds"] for w in weeks) == 600
    empty = await integration_client.get(
        "/api/workouts/statistics?all_time=true",
        headers={"Authorization": "Bearer " + create_access_token(User().id)},
    )
    assert empty.status_code == 401
    empty_user = User()
    db_session.add(empty_user)
    await db_session.flush()
    empty = await integration_client.get(
        "/api/workouts/statistics?all_time=true",
        headers={"Authorization": "Bearer " + create_access_token(empty_user.id)},
    )
    assert empty.status_code == 200
    assert len(empty.json()["weeks"]) == 1
    assert empty.json()["weeks"][0]["workouts"] == 0
