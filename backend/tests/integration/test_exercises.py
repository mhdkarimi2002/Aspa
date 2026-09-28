from dataclasses import dataclass
from uuid import UUID, uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.modules.exercises.models import (
    Equipment,
    Exercise,
    ExerciseDifficulty,
    ExerciseMuscle,
    MuscleGroup,
)
from app.modules.users.models import User
from app.modules.workout_plans.models import WorkoutPlan, WorkoutPlanDay, WorkoutPlanExercise

pytestmark = pytest.mark.integration


@dataclass
class CatalogIds:
    bench_press: UUID
    push_up: UUID
    inactive_squat: UUID
    chest: UUID
    triceps: UUID
    inactive_muscle: UUID
    barbell: UUID
    bodyweight: UUID
    inactive_equipment: UUID


@pytest.fixture
async def exercise_catalog(db_session: AsyncSession) -> CatalogIds:
    chest = MuscleGroup(name_fa="سینه", name_en="Chest", is_active=True)
    triceps = MuscleGroup(name_fa="پشت بازو", name_en="Triceps", is_active=True)
    inactive_muscle = MuscleGroup(name_fa="غیرفعال", name_en="Inactive muscle", is_active=False)
    barbell = Equipment(name_fa="هالتر", name_en="Barbell", is_active=True)
    bodyweight = Equipment(name_fa="وزن بدن", name_en="Bodyweight", is_active=True)
    inactive_equipment = Equipment(
        name_fa="وسیله غیرفعال", name_en="Inactive equipment", is_active=False
    )
    bench_press = Exercise(
        name_fa="پرس سینه هالتر",
        name_en="Barbell Bench Press",
        description_fa="حرکت پرس برای عضلات سینه",
        description_en="A pressing movement for the chest",
        equipment=barbell,
        difficulty=ExerciseDifficulty.INTERMEDIATE,
        image_key="exercises/bench.webp",
        video_key="exercises/bench.mp4",
        is_active=True,
    )
    push_up = Exercise(
        name_fa="شنا سوئدی",
        name_en="Push Up",
        equipment=bodyweight,
        difficulty=ExerciseDifficulty.BEGINNER,
        is_active=True,
    )
    incline_press = Exercise(
        name_fa="پرس بالا سینه",
        name_en="Incline Press",
        equipment=barbell,
        difficulty=ExerciseDifficulty.ADVANCED,
        is_active=True,
    )
    inactive_squat = Exercise(
        name_fa="اسکات غیرفعال",
        name_en="Inactive Squat",
        difficulty=ExerciseDifficulty.BEGINNER,
        is_active=False,
    )
    bench_press.muscle_links = [
        ExerciseMuscle(muscle_group=chest, is_primary=True),
        ExerciseMuscle(muscle_group=triceps, is_primary=False),
    ]
    push_up.muscle_links = [ExerciseMuscle(muscle_group=chest, is_primary=True)]
    incline_press.muscle_links = [ExerciseMuscle(muscle_group=chest, is_primary=True)]
    db_session.add_all(
        [
            inactive_muscle,
            inactive_equipment,
            bench_press,
            push_up,
            incline_press,
            inactive_squat,
        ]
    )
    await db_session.flush()
    return CatalogIds(
        bench_press=bench_press.id,
        push_up=push_up.id,
        inactive_squat=inactive_squat.id,
        chest=chest.id,
        triceps=triceps.id,
        inactive_muscle=inactive_muscle.id,
        barbell=barbell.id,
        bodyweight=bodyweight.id,
        inactive_equipment=inactive_equipment.id,
    )


async def test_exercise_pagination_and_sorting(
    integration_client: AsyncClient, exercise_catalog: CatalogIds
) -> None:
    first = await integration_client.get(
        "/api/exercises", params={"page_size": 2, "sort": "name_en", "direction": "asc"}
    )
    second = await integration_client.get(
        "/api/exercises",
        params={"page": 2, "page_size": 2, "sort": "name_en", "direction": "asc"},
    )

    assert first.status_code == 200, first.text
    assert first.json()["total"] == 3
    assert first.json()["pages"] == 2
    assert [item["name_en"] for item in first.json()["items"]] == [
        "Barbell Bench Press",
        "Incline Press",
    ]
    assert [item["name_en"] for item in second.json()["items"]] == ["Push Up"]


@pytest.mark.parametrize(
    ("params", "expected"),
    [
        ({"search": "bench"}, ["Barbell Bench Press"]),
        ({"search": "شنا"}, ["Push Up"]),
        ({"difficulty": "advanced"}, ["Incline Press"]),
    ],
)
async def test_exercise_search_and_simple_filters(
    integration_client: AsyncClient,
    exercise_catalog: CatalogIds,
    params: dict[str, str],
    expected: list[str],
) -> None:
    response = await integration_client.get("/api/exercises", params=params)

    assert response.status_code == 200, response.text
    assert [item["name_en"] for item in response.json()["items"]] == expected


async def test_exercise_filters_can_be_combined(
    integration_client: AsyncClient, exercise_catalog: CatalogIds
) -> None:
    response = await integration_client.get(
        "/api/exercises",
        params={
            "muscle_group_id": str(exercise_catalog.chest),
            "equipment_id": str(exercise_catalog.barbell),
            "difficulty": "intermediate",
        },
    )

    assert response.status_code == 200, response.text
    assert [item["id"] for item in response.json()["items"]] == [str(exercise_catalog.bench_press)]


async def test_exercise_detail_includes_relationships_and_media_keys(
    integration_client: AsyncClient, exercise_catalog: CatalogIds
) -> None:
    response = await integration_client.get(f"/api/exercises/{exercise_catalog.bench_press}")

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["equipment"]["name_en"] == "Barbell"
    assert [muscle["name_en"] for muscle in body["primary_muscles"]] == ["Chest"]
    assert [muscle["name_en"] for muscle in body["secondary_muscles"]] == ["Triceps"]
    assert body["image_key"] == "exercises/bench.webp"
    assert body["video_key"] == "exercises/bench.mp4"


async def test_inactive_and_unknown_exercises_are_not_exposed(
    integration_client: AsyncClient, exercise_catalog: CatalogIds
) -> None:
    inactive = await integration_client.get(f"/api/exercises/{exercise_catalog.inactive_squat}")
    missing = await integration_client.get(f"/api/exercises/{uuid4()}")
    malformed = await integration_client.get("/api/exercises/not-a-uuid")

    assert inactive.status_code == 404
    assert missing.status_code == 404
    assert malformed.status_code == 422
    assert inactive.json()["error"]["code"] == "not_found"


async def test_reference_lists_hide_inactive_records(
    integration_client: AsyncClient, exercise_catalog: CatalogIds
) -> None:
    muscles = await integration_client.get("/api/muscle-groups")
    equipment = await integration_client.get("/api/equipment")

    assert muscles.status_code == 200
    assert equipment.status_code == 200
    assert {item["name_en"] for item in muscles.json()} == {"Chest", "Triceps"}
    assert {item["name_en"] for item in equipment.json()} == {"Barbell", "Bodyweight"}


async def test_exercise_query_validation(
    integration_client: AsyncClient, exercise_catalog: CatalogIds
) -> None:
    too_large = await integration_client.get("/api/exercises", params={"page_size": 101})
    invalid_difficulty = await integration_client.get(
        "/api/exercises", params={"difficulty": "impossible"}
    )

    assert too_large.status_code == 422
    assert invalid_difficulty.status_code == 422


@pytest.fixture
async def catalog_editor(db_session: AsyncSession) -> dict[str, str]:
    user = User(phone_number="+989130000001", is_active=True)
    db_session.add(user)
    await db_session.flush()
    return {"Authorization": f"Bearer {create_access_token(user.id)}"}


async def test_catalog_mutations_require_authentication(integration_client: AsyncClient) -> None:
    muscle = await integration_client.post(
        "/api/muscle-groups", json={"name_fa": "سرشانه", "name_en": "Shoulders"}
    )
    exercise = await integration_client.post(
        "/api/exercises",
        json={
            "name_fa": "پرس سرشانه",
            "name_en": "Overhead Press",
            "difficulty": "beginner",
            "primary_muscle_ids": [str(uuid4())],
        },
    )
    missing_muscle = await integration_client.delete(f"/api/muscle-groups/{uuid4()}")
    missing_exercise = await integration_client.delete(f"/api/exercises/{uuid4()}")

    assert muscle.status_code == 401
    assert exercise.status_code == 401
    assert missing_muscle.status_code == 401
    assert missing_exercise.status_code == 401


async def test_muscle_group_can_be_created_and_deleted(
    integration_client: AsyncClient, catalog_editor: dict[str, str]
) -> None:
    created = await integration_client.post(
        "/api/muscle-groups",
        headers=catalog_editor,
        json={"name_fa": "  سرشانه  ", "name_en": "Shoulders"},
    )
    assert created.status_code == 201, created.text
    muscle_id = created.json()["id"]
    assert created.json()["name_fa"] == "سرشانه"
    assert created.json()["name_en"] == "Shoulders"

    listed = await integration_client.get("/api/muscle-groups")
    assert muscle_id in {item["id"] for item in listed.json()}

    deleted = await integration_client.delete(
        f"/api/muscle-groups/{muscle_id}", headers=catalog_editor
    )
    assert deleted.status_code == 204, deleted.text

    after_delete = await integration_client.get("/api/muscle-groups")
    assert muscle_id not in {item["id"] for item in after_delete.json()}
    missing = await integration_client.delete(
        f"/api/muscle-groups/{muscle_id}", headers=catalog_editor
    )
    assert missing.status_code == 404


async def test_duplicate_muscle_group_names_are_rejected(
    integration_client: AsyncClient,
    exercise_catalog: CatalogIds,
    catalog_editor: dict[str, str],
) -> None:
    duplicate_fa = await integration_client.post(
        "/api/muscle-groups",
        headers=catalog_editor,
        json={"name_fa": "سینه", "name_en": "Pectorals"},
    )
    duplicate_en = await integration_client.post(
        "/api/muscle-groups",
        headers=catalog_editor,
        json={"name_fa": "سینه جدید", "name_en": "Chest"},
    )
    blank = await integration_client.post(
        "/api/muscle-groups",
        headers=catalog_editor,
        json={"name_fa": "   ", "name_en": "Delts"},
    )

    assert duplicate_fa.status_code == 409
    assert duplicate_fa.json()["error"]["code"] == "conflict"
    assert duplicate_en.status_code == 409
    assert blank.status_code == 422


async def test_assigned_muscle_group_cannot_be_deleted(
    integration_client: AsyncClient,
    exercise_catalog: CatalogIds,
    catalog_editor: dict[str, str],
) -> None:
    response = await integration_client.delete(
        f"/api/muscle-groups/{exercise_catalog.chest}", headers=catalog_editor
    )

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "conflict"
    still_listed = await integration_client.get("/api/muscle-groups")
    assert str(exercise_catalog.chest) in {item["id"] for item in still_listed.json()}


async def test_exercise_can_be_created_and_deleted(
    integration_client: AsyncClient,
    exercise_catalog: CatalogIds,
    catalog_editor: dict[str, str],
) -> None:
    created = await integration_client.post(
        "/api/exercises",
        headers=catalog_editor,
        json={
            "name_fa": "نشر جانب",
            "name_en": "Lateral Raise",
            "description_fa": "  حرکت سرشانه  ",
            "description_en": "",
            "equipment_id": str(exercise_catalog.barbell),
            "difficulty": "beginner",
            "image_key": "exercises/lateral.webp",
            "primary_muscle_ids": [str(exercise_catalog.chest)],
            "secondary_muscle_ids": [str(exercise_catalog.triceps)],
        },
    )

    assert created.status_code == 201, created.text
    body = created.json()
    assert body["description_fa"] == "حرکت سرشانه"
    assert body["description_en"] is None
    assert body["equipment"]["id"] == str(exercise_catalog.barbell)
    assert [muscle["id"] for muscle in body["primary_muscles"]] == [str(exercise_catalog.chest)]
    assert [muscle["id"] for muscle in body["secondary_muscles"]] == [
        str(exercise_catalog.triceps)
    ]

    detail = await integration_client.get(f"/api/exercises/{body['id']}")
    assert detail.status_code == 200

    deleted = await integration_client.delete(
        f"/api/exercises/{body['id']}", headers=catalog_editor
    )
    assert deleted.status_code == 204, deleted.text
    missing = await integration_client.get(f"/api/exercises/{body['id']}")
    assert missing.status_code == 404


async def test_exercise_create_rejects_invalid_references(
    integration_client: AsyncClient,
    exercise_catalog: CatalogIds,
    catalog_editor: dict[str, str],
) -> None:
    unknown_muscle = await integration_client.post(
        "/api/exercises",
        headers=catalog_editor,
        json={
            "name_fa": "حرکت نامعتبر",
            "name_en": "Invalid Exercise",
            "difficulty": "beginner",
            "primary_muscle_ids": [str(exercise_catalog.inactive_muscle)],
        },
    )
    unknown_equipment = await integration_client.post(
        "/api/exercises",
        headers=catalog_editor,
        json={
            "name_fa": "حرکت نامعتبر",
            "name_en": "Invalid Exercise",
            "difficulty": "beginner",
            "equipment_id": str(exercise_catalog.inactive_equipment),
            "primary_muscle_ids": [str(exercise_catalog.chest)],
        },
    )
    overlap = await integration_client.post(
        "/api/exercises",
        headers=catalog_editor,
        json={
            "name_fa": "حرکت نامعتبر",
            "name_en": "Invalid Exercise",
            "difficulty": "beginner",
            "primary_muscle_ids": [str(exercise_catalog.chest)],
            "secondary_muscle_ids": [str(exercise_catalog.chest)],
        },
    )

    assert unknown_muscle.status_code == 404
    assert unknown_equipment.status_code == 404
    assert overlap.status_code == 422


async def test_exercise_used_by_a_plan_cannot_be_deleted(
    integration_client: AsyncClient,
    db_session: AsyncSession,
    exercise_catalog: CatalogIds,
    catalog_editor: dict[str, str],
) -> None:
    user = User(phone_number="+989130000002", is_active=True)
    db_session.add(user)
    await db_session.flush()
    plan = WorkoutPlan(user_id=user.id, name="Push")
    day = WorkoutPlanDay(name="Day 1", position=0)
    day.exercises = [
        WorkoutPlanExercise(
            exercise_id=exercise_catalog.bench_press,
            position=0,
            sets=3,
            min_reps=8,
            max_reps=12,
            rest_seconds=90,
        )
    ]
    plan.days = [day]
    db_session.add(plan)
    await db_session.commit()

    response = await integration_client.delete(
        f"/api/exercises/{exercise_catalog.bench_press}", headers=catalog_editor
    )

    assert response.status_code == 409, response.text
    assert response.json()["error"]["code"] == "conflict"
    still_there = await integration_client.get(f"/api/exercises/{exercise_catalog.bench_press}")
    assert still_there.status_code == 200
