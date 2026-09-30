from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.modules.exercises.models import (
    Exercise,
    ExerciseDifficulty,
    ExerciseMuscle,
    MuscleGroup,
)
from app.modules.users.models import User
from app.modules.workout_plans.models import WorkoutPlanShare, WorkoutRun

pytestmark = pytest.mark.integration


@dataclass
class PlanContext:
    user: User
    other_user: User
    headers: dict[str, str]
    other_headers: dict[str, str]
    bench_press_id: UUID
    row_id: UUID
    inactive_exercise_id: UUID


@pytest.fixture
async def plan_context(db_session: AsyncSession) -> PlanContext:
    user = User(phone_number="+989121111111", is_active=True)
    other_user = User(phone_number="+989122222222", is_active=True)
    bench_press = Exercise(
        name_fa="پرس سینه",
        difficulty=ExerciseDifficulty.INTERMEDIATE,
        is_active=True,
    )
    row = Exercise(
        name_fa="زیربغل قایقی",
        difficulty=ExerciseDifficulty.BEGINNER,
        is_active=True,
    )
    inactive = Exercise(
        name_fa="حرکت غیرفعال",
        difficulty=ExerciseDifficulty.BEGINNER,
        is_active=False,
    )
    chest = MuscleGroup(name_fa="سینه", is_active=True)
    triceps = MuscleGroup(name_fa="پشت بازو", is_active=True)
    bench_press.muscle_links = [
        ExerciseMuscle(muscle_group=chest, is_primary=True),
        ExerciseMuscle(muscle_group=triceps, is_primary=False),
    ]
    db_session.add_all([user, other_user, bench_press, row, inactive])
    await db_session.flush()
    return PlanContext(
        user=user,
        other_user=other_user,
        headers={"Authorization": f"Bearer {create_access_token(user.id)}"},
        other_headers={"Authorization": f"Bearer {create_access_token(other_user.id)}"},
        bench_press_id=bench_press.id,
        row_id=row.id,
        inactive_exercise_id=inactive.id,
    )


async def _create_plan(client: AsyncClient, context: PlanContext) -> dict[str, object]:
    response = await client.post(
        "/api/workout-plans",
        headers=context.headers,
        json={"name": "Push Pull", "description": "Two day plan"},
    )
    assert response.status_code == 201, response.text
    return response.json()


async def _add_day(
    client: AsyncClient, context: PlanContext, plan_id: str, name: str = "Push Day"
) -> dict[str, object]:
    response = await client.post(
        f"/api/workout-plans/{plan_id}/days",
        headers=context.headers,
        json={"name": name},
    )
    assert response.status_code == 201, response.text
    return response.json()


async def _add_exercise(
    client: AsyncClient,
    context: PlanContext,
    plan_id: str,
    day_id: str,
    exercise_id: UUID,
) -> dict[str, object]:
    response = await client.post(
        f"/api/workout-plans/{plan_id}/days/{day_id}/exercises",
        headers=context.headers,
        json={
            "exercise_id": str(exercise_id),
            "sets": 4,
            "min_reps": 8,
            "max_reps": 12,
            "rest_seconds": 120,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


async def test_complete_workout_plan_flow(
    integration_client: AsyncClient, plan_context: PlanContext
) -> None:
    plan = await _create_plan(integration_client, plan_context)
    plan_id = str(plan["id"])
    plan = await _add_day(integration_client, plan_context, plan_id)
    day = plan["days"][0]
    plan = await _add_exercise(
        integration_client,
        plan_context,
        plan_id,
        str(day["id"]),
        plan_context.bench_press_id,
    )

    item = plan["days"][0]["exercises"][0]
    assert item["exercise"]["name_fa"] == "پرس سینه"
    assert item["sets"] == 4
    assert item["min_reps"] == 8
    assert item["max_reps"] == 12
    assert item["rest_seconds"] == 120
    coverage_without_ids = [
        {key: value for key, value in muscle.items() if key != "id"}
        for muscle in plan["muscle_coverage"]
    ]
    assert coverage_without_ids == [
        {
            "name_fa": "سینه",
            "primary_exercise_count": 1,
            "secondary_exercise_count": 0,
        },
        {
            "name_fa": "پشت بازو",
            "primary_exercise_count": 0,
            "secondary_exercise_count": 1,
        },
    ]

    fetched = await integration_client.get(
        f"/api/workout-plans/{plan_id}", headers=plan_context.headers
    )
    listed = await integration_client.get("/api/workout-plans", headers=plan_context.headers)
    assert fetched.status_code == 200
    assert [value["id"] for value in listed.json()] == [plan_id]


async def test_exercises_can_be_edited_and_reordered(
    integration_client: AsyncClient, plan_context: PlanContext
) -> None:
    plan = await _create_plan(integration_client, plan_context)
    plan_id = str(plan["id"])
    plan = await _add_day(integration_client, plan_context, plan_id)
    day_id = str(plan["days"][0]["id"])
    plan = await _add_exercise(
        integration_client, plan_context, plan_id, day_id, plan_context.bench_press_id
    )
    plan = await _add_exercise(
        integration_client, plan_context, plan_id, day_id, plan_context.row_id
    )
    first, second = plan["days"][0]["exercises"]

    reordered = await integration_client.put(
        f"/api/workout-plans/{plan_id}/days/{day_id}/exercises/order",
        headers=plan_context.headers,
        json={"exercise_ids": [second["id"], first["id"]]},
    )
    assert reordered.status_code == 200, reordered.text
    assert [item["exercise"]["name_fa"] for item in reordered.json()["days"][0]["exercises"]] == [
        "زیربغل قایقی",
        "پرس سینه",
    ]

    updated = await integration_client.patch(
        f"/api/workout-plans/{plan_id}/days/{day_id}/exercises/{first['id']}",
        headers=plan_context.headers,
        json={"sets": 5, "min_reps": 6, "max_reps": 8, "notes": "Heavy"},
    )
    assert updated.status_code == 200, updated.text
    changed = next(
        item for item in updated.json()["days"][0]["exercises"] if item["id"] == first["id"]
    )
    assert (changed["sets"], changed["min_reps"], changed["max_reps"]) == (5, 6, 8)
    assert changed["notes"] == "Heavy"


async def test_plan_duplication_copies_nested_configuration(
    integration_client: AsyncClient, plan_context: PlanContext
) -> None:
    source = await _create_plan(integration_client, plan_context)
    source_id = str(source["id"])
    source = await _add_day(integration_client, plan_context, source_id)
    day_id = str(source["days"][0]["id"])
    source = await _add_exercise(
        integration_client,
        plan_context,
        source_id,
        day_id,
        plan_context.bench_press_id,
    )

    duplicated = await integration_client.post(
        f"/api/workout-plans/{source_id}/duplicate", headers=plan_context.headers
    )
    assert duplicated.status_code == 201, duplicated.text
    copy = duplicated.json()
    assert copy["id"] != source_id
    assert copy["name"] == "Push Pull (Copy)"
    assert copy["days"][0]["id"] != source["days"][0]["id"]
    assert copy["days"][0]["exercises"][0]["sets"] == 4


async def test_training_days_and_exercises_support_crud(
    integration_client: AsyncClient, plan_context: PlanContext
) -> None:
    plan = await _create_plan(integration_client, plan_context)
    plan_id = str(plan["id"])
    plan = await _add_day(integration_client, plan_context, plan_id, "Push")
    push_id = str(plan["days"][0]["id"])
    second = await integration_client.post(
        f"/api/workout-plans/{plan_id}/days",
        headers=plan_context.headers,
        json={"name": "Pull", "position": 0},
    )
    assert second.status_code == 409

    updated = await integration_client.patch(
        f"/api/workout-plans/{plan_id}/days/{push_id}",
        headers=plan_context.headers,
        json={"name": "Upper", "position": 0},
    )
    assert updated.status_code == 200, updated.text
    assert [day["name"] for day in updated.json()["days"]] == ["Upper"]

    with_exercise = await _add_exercise(
        integration_client,
        plan_context,
        plan_id,
        push_id,
        plan_context.bench_press_id,
    )
    item_id = str(with_exercise["days"][0]["exercises"][0]["id"])
    removed = await integration_client.delete(
        f"/api/workout-plans/{plan_id}/days/{push_id}/exercises/{item_id}",
        headers=plan_context.headers,
    )
    assert removed.status_code == 204

    deleted_day = await integration_client.delete(
        f"/api/workout-plans/{plan_id}/days/{push_id}", headers=plan_context.headers
    )
    fetched = await integration_client.get(
        f"/api/workout-plans/{plan_id}", headers=plan_context.headers
    )
    assert deleted_day.status_code == 204
    assert fetched.json()["days"] == []
    assert fetched.json()["exercises"] == []


async def test_archiving_filter_and_permanent_delete(
    integration_client: AsyncClient, plan_context: PlanContext
) -> None:
    plan = await _create_plan(integration_client, plan_context)
    plan_id = str(plan["id"])
    archived = await integration_client.patch(
        f"/api/workout-plans/{plan_id}",
        headers=plan_context.headers,
        json={"is_archived": True},
    )
    assert archived.status_code == 200

    active = await integration_client.get("/api/workout-plans", headers=plan_context.headers)
    all_plans = await integration_client.get(
        "/api/workout-plans",
        headers=plan_context.headers,
        params={"include_archived": True},
    )
    assert active.json() == []
    assert [item["id"] for item in all_plans.json()] == [plan_id]

    deleted = await integration_client.delete(
        f"/api/workout-plans/{plan_id}", headers=plan_context.headers
    )
    missing = await integration_client.get(
        f"/api/workout-plans/{plan_id}", headers=plan_context.headers
    )
    assert deleted.status_code == 204
    assert missing.status_code == 404


async def test_plan_ownership_is_enforced(
    integration_client: AsyncClient, plan_context: PlanContext
) -> None:
    plan = await _create_plan(integration_client, plan_context)
    plan_id = str(plan["id"])

    read = await integration_client.get(
        f"/api/workout-plans/{plan_id}", headers=plan_context.other_headers
    )
    update = await integration_client.patch(
        f"/api/workout-plans/{plan_id}",
        headers=plan_context.other_headers,
        json={"name": "Stolen"},
    )
    delete = await integration_client.delete(
        f"/api/workout-plans/{plan_id}", headers=plan_context.other_headers
    )
    assert read.status_code == update.status_code == delete.status_code == 404


async def test_invalid_exercise_and_configuration_are_rejected(
    integration_client: AsyncClient, plan_context: PlanContext
) -> None:
    plan = await _create_plan(integration_client, plan_context)
    plan_id = str(plan["id"])
    plan = await _add_day(integration_client, plan_context, plan_id)
    day_id = str(plan["days"][0]["id"])

    invalid_reps = await integration_client.post(
        f"/api/workout-plans/{plan_id}/days/{day_id}/exercises",
        headers=plan_context.headers,
        json={
            "exercise_id": str(plan_context.bench_press_id),
            "sets": 3,
            "min_reps": 12,
            "max_reps": 8,
        },
    )
    inactive = await integration_client.post(
        f"/api/workout-plans/{plan_id}/days/{day_id}/exercises",
        headers=plan_context.headers,
        json={
            "exercise_id": str(plan_context.inactive_exercise_id),
            "sets": 3,
            "min_reps": 8,
            "max_reps": 10,
        },
    )
    missing = await integration_client.post(
        f"/api/workout-plans/{plan_id}/days/{day_id}/exercises",
        headers=plan_context.headers,
        json={"exercise_id": str(uuid4()), "sets": 3, "min_reps": 8, "max_reps": 10},
    )
    assert invalid_reps.status_code == 422
    assert inactive.status_code == missing.status_code == 404


async def test_a_user_has_at_most_one_active_plan(
    integration_client: AsyncClient, plan_context: PlanContext
) -> None:
    first = await _create_plan(integration_client, plan_context)
    second = await integration_client.post(
        "/api/workout-plans",
        headers=plan_context.headers,
        json={"name": "Legs"},
    )
    assert second.status_code == 201, second.text
    first_id = str(first["id"])
    second_id = str(second.json()["id"])

    missing = await integration_client.get(
        "/api/workout-plans/active", headers=plan_context.headers
    )
    assert missing.status_code == 404

    activated = await integration_client.post(
        f"/api/workout-plans/{first_id}/activate", headers=plan_context.headers
    )
    active = await integration_client.get("/api/workout-plans/active", headers=plan_context.headers)
    assert activated.status_code == 200
    assert activated.json()["is_active"] is True
    assert active.status_code == 200
    assert active.json()["id"] == first_id
    assert active.json()["name"] == "Push Pull"

    switched = await integration_client.post(
        f"/api/workout-plans/{second_id}/activate", headers=plan_context.headers
    )
    previous = await integration_client.get(
        f"/api/workout-plans/{first_id}", headers=plan_context.headers
    )
    current = await integration_client.get(
        "/api/workout-plans/active", headers=plan_context.headers
    )
    assert switched.status_code == 200
    assert previous.json()["is_active"] is False
    assert current.json()["id"] == second_id

    deactivated = await integration_client.post(
        f"/api/workout-plans/{second_id}/deactivate", headers=plan_context.headers
    )
    none_active = await integration_client.get(
        "/api/workout-plans/active", headers=plan_context.headers
    )
    assert deactivated.json()["is_active"] is False
    assert none_active.status_code == 404

    archived = await integration_client.patch(
        f"/api/workout-plans/{first_id}",
        headers=plan_context.headers,
        json={"is_archived": True},
    )
    blocked = await integration_client.post(
        f"/api/workout-plans/{first_id}/activate", headers=plan_context.headers
    )
    foreign = await integration_client.post(
        f"/api/workout-plans/{second_id}/activate", headers=plan_context.other_headers
    )
    assert archived.status_code == 200
    assert archived.json()["is_active"] is False
    assert blocked.status_code == 409
    assert foreign.status_code == 404


async def test_workout_plans_require_authentication(integration_client: AsyncClient) -> None:
    response = await integration_client.get("/api/workout-plans")
    assert response.status_code == 401


async def test_plan_rejects_another_users_custom_exercise(
    integration_client: AsyncClient,
    db_session: AsyncSession,
    plan_context: PlanContext,
) -> None:
    custom = Exercise(
        owner_user_id=plan_context.other_user.id,
        name_fa="حرکت خصوصی کاربر دیگر",
        difficulty=ExerciseDifficulty.BEGINNER,
        is_active=True,
    )
    db_session.add(custom)
    await db_session.flush()
    plan = await _create_plan(integration_client, plan_context)
    plan_id = str(plan["id"])
    plan = await _add_day(integration_client, plan_context, plan_id)
    day_id = str(plan["days"][0]["id"])

    response = await integration_client.post(
        f"/api/workout-plans/{plan_id}/days/{day_id}/exercises",
        headers=plan_context.headers,
        json={
            "exercise_id": str(custom.id),
            "sets": 3,
            "min_reps": 8,
            "max_reps": 12,
        },
    )

    assert response.status_code == 404


async def test_per_set_targets_are_saved_and_duplicated(
    integration_client: AsyncClient, plan_context: PlanContext
) -> None:
    plan = await _create_plan(integration_client, plan_context)
    plan_id = str(plan["id"])
    plan = await _add_day(integration_client, plan_context, plan_id)
    day_id = str(plan["days"][0]["id"])
    plan = await _add_exercise(
        integration_client, plan_context, plan_id, day_id, plan_context.bench_press_id
    )
    item_id = str(plan["days"][0]["exercises"][0]["id"])
    assert len(plan["days"][0]["exercises"][0]["target_sets"]) == 4

    updated = await integration_client.put(
        f"/api/workout-plans/{plan_id}/days/{day_id}/exercises/{item_id}/sets",
        headers=plan_context.headers,
        json={
            "target_sets": [
                {"target_reps": 8, "target_weight_kg": "50.50"},
                {"target_reps": 6, "target_weight_kg": "55.00"},
            ]
        },
    )
    assert updated.status_code == 200, updated.text
    item = updated.json()["days"][0]["exercises"][0]
    assert (item["sets"], item["min_reps"], item["max_reps"]) == (2, 6, 8)
    assert item["target_sets"] == [
        {"target_reps": 8, "target_weight_kg": "50.50"},
        {"target_reps": 6, "target_weight_kg": "55.00"},
    ]
    copy = await integration_client.post(
        f"/api/workout-plans/{plan_id}/duplicate", headers=plan_context.headers
    )
    assert copy.status_code == 201, copy.text
    assert copy.json()["days"][0]["exercises"][0]["target_sets"] == item["target_sets"]

    invalid = await integration_client.put(
        f"/api/workout-plans/{plan_id}/days/{day_id}/exercises/{item_id}/sets",
        headers=plan_context.headers,
        json={"target_sets": [{"target_reps": 8, "target_weight_kg": "1000.01"}]},
    )
    assert invalid.status_code == 422


async def test_shared_plan_is_fixed_and_imported_as_independent_copy(
    integration_client: AsyncClient, plan_context: PlanContext
) -> None:
    plan = await _create_plan(integration_client, plan_context)
    plan_id = str(plan["id"])
    plan = await _add_day(integration_client, plan_context, plan_id)
    day_id = str(plan["days"][0]["id"])
    await _add_exercise(
        integration_client, plan_context, plan_id, day_id, plan_context.bench_press_id
    )
    shared = await integration_client.post(
        f"/api/workout-plans/{plan_id}/shares",
        headers=plan_context.headers,
        json={"expires_in_days": 7},
    )
    assert shared.status_code == 201, shared.text
    token = shared.json()["token"]
    preview = await integration_client.get(
        f"/api/workout-plans/shared/{token}", headers=plan_context.other_headers
    )
    assert preview.status_code == 200, preview.text
    assert preview.json()["name"] == "Push Pull"
    assert "phone_number" not in preview.text

    renamed = await integration_client.patch(
        f"/api/workout-plans/{plan_id}",
        headers=plan_context.headers,
        json={"name": "Changed"},
    )
    assert renamed.status_code == 200
    imported = await integration_client.post(
        f"/api/workout-plans/shared/{token}/import", headers=plan_context.other_headers
    )
    assert imported.status_code == 201, imported.text
    copy = imported.json()
    assert copy["name"] == "Push Pull"
    assert copy["id"] != plan_id
    assert copy["days"][0]["exercises"][0]["exercise"]["id"] == str(plan_context.bench_press_id)
    inaccessible = await integration_client.get(
        f"/api/workout-plans/{copy['id']}", headers=plan_context.headers
    )
    assert inaccessible.status_code == 404

    revoked = await integration_client.delete(
        f"/api/workout-plans/{plan_id}/shares/{shared.json()['id']}",
        headers=plan_context.headers,
    )
    blocked = await integration_client.get(
        f"/api/workout-plans/shared/{token}", headers=plan_context.other_headers
    )
    existing_copy = await integration_client.get(
        f"/api/workout-plans/{copy['id']}", headers=plan_context.other_headers
    )
    assert revoked.status_code == 204
    assert blocked.status_code == 404
    assert existing_copy.status_code == 200

    deleted_source = await integration_client.delete(
        f"/api/workout-plans/{plan_id}", headers=plan_context.headers
    )
    retained_copy = await integration_client.get(
        f"/api/workout-plans/{copy['id']}", headers=plan_context.other_headers
    )
    assert deleted_source.status_code == 204
    assert retained_copy.status_code == 200


async def test_private_exercise_blocks_sharing(
    integration_client: AsyncClient, db_session: AsyncSession, plan_context: PlanContext
) -> None:
    custom = Exercise(
        owner_user_id=plan_context.user.id,
        name_fa="حرکت خصوصی",
        difficulty=ExerciseDifficulty.BEGINNER,
        is_active=True,
    )
    db_session.add(custom)
    await db_session.flush()
    plan = await _create_plan(integration_client, plan_context)
    plan_id = str(plan["id"])
    plan = await _add_day(integration_client, plan_context, plan_id)
    day_id = str(plan["days"][0]["id"])
    await _add_exercise(integration_client, plan_context, plan_id, day_id, custom.id)
    response = await integration_client.post(
        f"/api/workout-plans/{plan_id}/shares", headers=plan_context.headers, json={}
    )
    assert response.status_code == 409


async def test_expired_and_foreign_share_links_are_rejected(
    integration_client: AsyncClient, db_session: AsyncSession, plan_context: PlanContext
) -> None:
    plan = await _create_plan(integration_client, plan_context)
    plan_id = str(plan["id"])
    plan = await _add_day(integration_client, plan_context, plan_id)
    await _add_exercise(
        integration_client,
        plan_context,
        plan_id,
        str(plan["days"][0]["id"]),
        plan_context.bench_press_id,
    )
    created = await integration_client.post(
        f"/api/workout-plans/{plan_id}/shares",
        headers=plan_context.headers,
        json={"expires_in_days": 1},
    )
    assert created.status_code == 201, created.text
    share_id = created.json()["id"]
    foreign_revoke = await integration_client.delete(
        f"/api/workout-plans/{plan_id}/shares/{share_id}",
        headers=plan_context.other_headers,
    )
    assert foreign_revoke.status_code == 404
    listed = await integration_client.get(
        f"/api/workout-plans/{plan_id}/shares", headers=plan_context.headers
    )
    assert listed.status_code == 200
    assert [item["id"] for item in listed.json()] == [share_id]
    assert "token" not in listed.text

    share = await db_session.get(WorkoutPlanShare, UUID(share_id))
    assert share is not None
    share.expires_at = datetime.now(UTC) - timedelta(seconds=1)
    await db_session.commit()
    expired = await integration_client.get(
        f"/api/workout-plans/shared/{created.json()['token']}",
        headers=plan_context.other_headers,
    )
    assert expired.status_code == 404


async def test_plan_has_one_direct_exercise_list(
    integration_client: AsyncClient, plan_context: PlanContext
) -> None:
    plan = await _create_plan(integration_client, plan_context)
    plan_id = str(plan["id"])
    added = await integration_client.post(
        f"/api/workout-plans/{plan_id}/exercises",
        headers=plan_context.headers,
        json={
            "exercise_id": str(plan_context.bench_press_id),
            "sets": 2,
            "min_reps": 8,
            "max_reps": 10,
        },
    )
    assert added.status_code == 201, added.text
    assert len(added.json()["exercises"]) == 1
    assert len(added.json()["days"]) == 1
    item_id = added.json()["exercises"][0]["id"]
    changed = await integration_client.put(
        f"/api/workout-plans/{plan_id}/exercises/{item_id}/sets",
        headers=plan_context.headers,
        json={"target_sets": [{"target_reps": 7, "target_weight_kg": "25.00"}]},
    )
    assert changed.status_code == 200, changed.text
    assert changed.json()["exercises"][0]["sets"] == 1
    assert changed.json()["exercises"][0]["target_sets"][0]["target_weight_kg"] == "25.00"
    removed = await integration_client.delete(
        f"/api/workout-plans/{plan_id}/exercises/{item_id}", headers=plan_context.headers
    )
    assert removed.status_code == 204
    fetched = await integration_client.get(
        f"/api/workout-plans/{plan_id}", headers=plan_context.headers
    )
    assert fetched.json()["exercises"] == []


async def test_plan_can_be_started_repeatedly_without_being_consumed(
    integration_client: AsyncClient, db_session: AsyncSession, plan_context: PlanContext
) -> None:
    plan = await _create_plan(integration_client, plan_context)
    plan_id = str(plan["id"])
    empty = await integration_client.post(
        "/api/workouts", headers=plan_context.headers, json={"plan_id": plan_id}
    )
    assert empty.status_code == 409
    await integration_client.post(
        f"/api/workout-plans/{plan_id}/exercises",
        headers=plan_context.headers,
        json={
            "exercise_id": str(plan_context.bench_press_id),
            "sets": 2,
            "min_reps": 8,
            "max_reps": 10,
        },
    )
    client_id = str(uuid4())
    started = await integration_client.post(
        "/api/workouts",
        headers=plan_context.headers,
        json={"plan_id": plan_id, "client_id": client_id},
    )
    assert started.status_code == 201, started.text
    run_id = started.json()["id"]
    assert started.json()["status"] == "in_progress"
    repeated_request = await integration_client.post(
        "/api/workouts",
        headers=plan_context.headers,
        json={"plan_id": plan_id, "client_id": client_id},
    )
    assert repeated_request.json()["id"] == run_id
    concurrent = await integration_client.post(
        "/api/workouts", headers=plan_context.headers, json={"plan_id": plan_id}
    )
    assert concurrent.status_code == 409
    foreign_finish = await integration_client.post(
        f"/api/workouts/{run_id}/complete", headers=plan_context.other_headers
    )
    assert foreign_finish.status_code == 404

    run = await db_session.get(WorkoutRun, UUID(run_id))
    assert run is not None
    run.started_at = datetime.now(UTC) - timedelta(minutes=5)
    await db_session.commit()
    completed = await integration_client.post(
        f"/api/workouts/{run_id}/complete", headers=plan_context.headers
    )
    assert completed.status_code == 200, completed.text
    assert completed.json()["status"] == "completed"
    assert completed.json()["duration_seconds"] >= 300
    assert completed.json()["completed_at"] is not None
    history = await integration_client.get("/api/workouts", headers=plan_context.headers)
    assert [item["id"] for item in history.json()] == [run_id]

    started_again = await integration_client.post(
        "/api/workouts", headers=plan_context.headers, json={"plan_id": plan_id}
    )
    assert started_again.status_code == 201, started_again.text
    assert started_again.json()["id"] != run_id
    cancelled = await integration_client.post(
        f"/api/workouts/{started_again.json()['id']}/cancel", headers=plan_context.headers
    )
    assert cancelled.status_code == 200
    history_after_cancel = await integration_client.get(
        "/api/workouts", headers=plan_context.headers
    )
    assert [item["id"] for item in history_after_cancel.json()] == [run_id]

    deleted = await integration_client.delete(
        f"/api/workout-plans/{plan_id}", headers=plan_context.headers
    )
    retained = await integration_client.get(f"/api/workouts/{run_id}", headers=plan_context.headers)
    assert deleted.status_code == 204
    assert retained.status_code == 200
    assert retained.json()["plan_id"] is None
    assert retained.json()["plan_name"] == "Push Pull"
