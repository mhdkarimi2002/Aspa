from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.modules.admin.models import AdminAuditLog
from app.modules.exercises.models import Exercise, ExerciseDifficulty, MuscleGroup
from app.modules.users.models import AccountLevel, User

pytestmark = pytest.mark.integration


@pytest.fixture
async def admin_accounts(db_session: AsyncSession) -> tuple[User, User]:
    admin = User(phone_number="+989120000101", is_active=True, is_admin=True)
    member = User(phone_number="+989120000102", is_active=True, is_admin=False)
    db_session.add_all([admin, member])
    await db_session.flush()
    return admin, member


async def test_admin_routes_reject_members_and_unauthenticated_users(
    integration_client: AsyncClient, admin_accounts: tuple[User, User]
) -> None:
    member = admin_accounts[1]
    headers = {"Authorization": f"Bearer {create_access_token(member.id)}"}
    assert (await integration_client.get("/api/admin/users")).status_code == 401
    assert (await integration_client.get("/api/admin/users", headers=headers)).status_code == 403
    assert (
        await integration_client.get("/api/admin/exercises", headers=headers)
    ).status_code == 403
    assert (await integration_client.get("/api/admin/me", headers=headers)).status_code == 403
    assert (
        await integration_client.post(
            "/api/muscle-groups", headers=headers, json={"name_fa": "سرشانه"}
        )
    ).status_code == 403
    assert (
        await integration_client.post(
            "/api/exercises",
            headers=headers,
            json={
                "name_fa": "شنا",
                "difficulty": "beginner",
                "primary_muscle_ids": [str(uuid4())],
            },
        )
    ).status_code == 403


async def test_admin_can_search_and_update_users(
    integration_client: AsyncClient, db_session: AsyncSession, admin_accounts: tuple[User, User]
) -> None:
    admin, member = admin_accounts
    headers = {"Authorization": f"Bearer {create_access_token(admin.id)}"}
    result = await integration_client.get(
        "/api/admin/users", headers=headers, params={"search": member.phone_number}
    )
    assert result.status_code == 200, result.text
    assert result.json()["total"] == 1
    assert result.json()["items"][0]["id"] == str(member.id)
    updated = await integration_client.patch(
        f"/api/admin/users/{member.id}",
        headers=headers,
        json={"is_active": False, "account_level": "pro"},
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["is_active"] is False
    assert updated.json()["account_level"] == AccountLevel.PRO
    assert (
        await integration_client.get(
            "/api/admin/users", headers=headers, params={"is_active": "false"}
        )
    ).json()["total"] == 1
    own = await integration_client.patch(
        f"/api/admin/users/{admin.id}", headers=headers, json={"is_active": False}
    )
    assert own.status_code == 409
    logs = list((await db_session.scalars(select(AdminAuditLog))).all())
    assert [(log.action, log.target_id, log.actor_user_id) for log in logs] == [
        ("user.update", member.id, admin.id)
    ]


async def test_admin_catalog_excludes_private_exercises(
    integration_client: AsyncClient,
    db_session: AsyncSession,
    admin_accounts: tuple[User, User],
) -> None:
    admin, member = admin_accounts
    group = MuscleGroup(name_fa="سینه", is_active=True)
    common = Exercise(name_fa="پرس سینه", difficulty=ExerciseDifficulty.BEGINNER, is_active=True)
    private = Exercise(
        name_fa="تمرین خصوصی",
        owner_user_id=member.id,
        difficulty=ExerciseDifficulty.BEGINNER,
        is_active=True,
    )
    db_session.add_all([group, common, private])
    await db_session.flush()
    headers = {"Authorization": f"Bearer {create_access_token(admin.id)}"}
    listing = await integration_client.get("/api/admin/exercises", headers=headers)
    assert listing.status_code == 200, listing.text
    assert [item["id"] for item in listing.json()["items"]] == [str(common.id)]
    assert (
        await integration_client.get(f"/api/admin/exercises/{private.id}", headers=headers)
    ).status_code == 404
    assert (
        await integration_client.patch(
            f"/api/admin/exercises/{private.id}/status",
            headers=headers,
            json={"is_active": False},
        )
    ).status_code == 404

    created = await integration_client.post(
        "/api/admin/exercises",
        headers=headers,
        json={
            "name_fa": "شنا",
            "description_fa": "حرکت بالاتنه",
            "difficulty": "beginner",
            "primary_muscle_ids": [str(group.id)],
            "instruction_steps": [{"text_fa": "بدن را صاف نگه دارید"}],
            "media": [{"media_type": "gif", "object_key": "exercises/push-up.gif"}],
        },
    )
    assert created.status_code == 201, created.text
    identifier = created.json()["id"]
    changed = await integration_client.put(
        f"/api/admin/exercises/{identifier}",
        headers=headers,
        json={
            "name_fa": "شنا سوئدی",
            "description_fa": "تمرین سینه",
            "difficulty": "intermediate",
            "primary_muscle_ids": [str(group.id)],
            "instruction_steps": [{"text_fa": "بدن را صاف نگه دارید"}],
            "media": [{"media_type": "mp4", "object_key": "exercises/push-up.mp4"}],
            "is_active": True,
        },
    )
    assert changed.status_code == 200, changed.text
    assert changed.json()["name_fa"] == "شنا سوئدی"
    assert changed.json()["media"][0]["media_type"] == "mp4"
    inactive = await integration_client.patch(
        f"/api/admin/exercises/{identifier}/status",
        headers=headers,
        json={"is_active": False},
    )
    assert inactive.status_code == 200, inactive.text
    assert inactive.json()["is_active"] is False
    assert (await integration_client.get(f"/api/exercises/{identifier}")).status_code == 404
    actions = list((await db_session.scalars(select(AdminAuditLog.action))).all())
    assert actions == ["exercise.create", "exercise.update", "exercise.status"]


async def test_admin_catalog_management_and_common_delete_permissions(
    integration_client: AsyncClient,
    db_session: AsyncSession,
    admin_accounts: tuple[User, User],
) -> None:
    admin, member = admin_accounts
    admin_headers = {"Authorization": f"Bearer {create_access_token(admin.id)}"}
    member_headers = {"Authorization": f"Bearer {create_access_token(member.id)}"}
    created = await integration_client.post(
        "/api/admin/catalog/equipment", headers=admin_headers, json={"name_fa": "دمبل"}
    )
    assert created.status_code == 201, created.text
    item_id = created.json()["id"]
    updated = await integration_client.patch(
        f"/api/admin/catalog/equipment/{item_id}",
        headers=admin_headers,
        json={"name_fa": "دمبل دستی", "is_active": False},
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["is_active"] is False
    listed = await integration_client.get("/api/admin/catalog/equipment", headers=admin_headers)
    assert listed.json()[0]["name_fa"] == "دمبل دستی"
    assert (await integration_client.get("/api/equipment")).json() == []

    common = Exercise(name_fa="شنا", difficulty=ExerciseDifficulty.BEGINNER, is_active=True)
    db_session.add(common)
    await db_session.flush()
    denied = await integration_client.delete(f"/api/exercises/{common.id}", headers=member_headers)
    assert denied.status_code == 403
    assert await db_session.get(Exercise, common.id) is not None
    deleted = await integration_client.delete(f"/api/exercises/{common.id}", headers=admin_headers)
    assert deleted.status_code == 204, deleted.text
    actions = list((await db_session.scalars(select(AdminAuditLog.action))).all())
    assert actions == ["catalog.create", "catalog.update", "exercise.delete"]
