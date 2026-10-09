import os
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.core.security import create_access_token
from app.integrations.storage import get_storage_client
from app.modules.admin.media_models import MediaAsset
from app.modules.admin.models import AdminAuditLog
from app.modules.exercises.models import (
    Exercise,
    ExerciseDifficulty,
    ExerciseMedia,
    ExerciseMediaType,
)
from app.modules.users.models import User

pytestmark = pytest.mark.integration


@pytest.fixture
async def media_accounts(db_session):
    admin = User(phone_number="+989124440001", is_admin=True, is_active=True)
    member = User(phone_number="+989124440002", is_active=True)
    db_session.add_all([admin, member])
    await db_session.flush()
    return admin, member


def headers(user):
    return {"Authorization": f"Bearer {create_access_token(user.id)}"}


async def test_upload_review_and_signed_delivery(integration_client, db_session, media_accounts):
    if not os.environ.get("S3_ENDPOINT"):
        pytest.fail(
            "Set S3_ENDPOINT, S3_BUCKET and test storage credentials for media integration tests"
        )
    storage = get_storage_client()
    storage.create_bucket(Bucket=os.environ["S3_BUCKET"])
    admin, member = media_accounts
    auth = headers(admin)
    # Small valid GIF sufficient for exercising transfer and signature validation.
    content = bytes.fromhex(
        "47494638396101000100800000000000ffffff21f90401000000002c00000000010001000002024401003b"
    )
    denied = await integration_client.post(
        "/api/admin/media",
        headers=headers(member),
        files={"file": ("demo.gif", content, "image/gif")},
    )
    assert denied.status_code == 403
    uploaded = await integration_client.post(
        "/api/admin/media", headers=auth, files={"file": ("demo.gif", content, "image/gif")}
    )
    assert uploaded.status_code == 201, uploaded.text
    asset = uploaded.json()
    assert (
        storage.get_object(Bucket=os.environ["S3_BUCKET"], Key=asset["object_key"])["Body"].read()
        == content
    )
    exercise = Exercise(name_fa="شنا", difficulty=ExerciseDifficulty.BEGINNER, is_active=True)
    exercise.media = [
        ExerciseMedia(position=0, media_type=ExerciseMediaType.GIF, object_key=asset["object_key"])
    ]
    db_session.add(exercise)
    await db_session.flush()
    path = f"/api/exercises/{exercise.id}/media/{exercise.media[0].id}"
    assert (await integration_client.get(path, headers=headers(member))).status_code == 404
    bad_review = await integration_client.patch(
        f"/api/admin/media/{asset['id']}",
        headers=auth,
        json={"review_status": "approved", "rights_status": "unknown"},
    )
    assert bad_review.status_code == 422
    reviewed = await integration_client.patch(
        f"/api/admin/media/{asset['id']}",
        headers=auth,
        json={
            "review_status": "approved",
            "rights_status": "owned",
            "rights_reference": "Original production by ASPA",
        },
    )
    assert reviewed.status_code == 200, reviewed.text
    link = await integration_client.get(path, headers=headers(member))
    assert link.status_code == 200, link.text
    assert "X-Amz-Signature=" in link.json()["url"]
    async with AsyncClient() as client:
        downloaded = await client.get(link.json()["url"])
    assert downloaded.content == content
    logs = list(await db_session.scalars(select(AdminAuditLog)))
    assert [item.action for item in logs] == ["media.upload", "media.review"]
    missing = await integration_client.get(
        f"/api/exercises/{uuid4()}/media/{exercise.media[0].id}", headers=headers(member)
    )
    assert missing.status_code == 404
    storage.delete_object(Bucket=os.environ["S3_BUCKET"], Key=asset["object_key"])


async def test_invalid_upload_does_not_create_asset(integration_client, db_session, media_accounts):
    admin, _ = media_accounts
    response = await integration_client.post(
        "/api/admin/media",
        headers=headers(admin),
        files={"file": ("fake.gif", b"<script>bad</script>", "image/gif")},
    )
    assert response.status_code == 422
    assert list(await db_session.scalars(select(MediaAsset))) == []
    assert list(await db_session.scalars(select(AdminAuditLog))) == []


async def test_system_monitoring_is_admin_only(integration_client, media_accounts):
    admin, member = media_accounts
    assert (
        await integration_client.get("/api/admin/system", headers=headers(member))
    ).status_code == 403
    result = await integration_client.get("/api/admin/system", headers=headers(admin))
    assert result.status_code == 200, result.text
    assert result.json()["checks"]["redis"] == "ok"
    assert "used_memory" in result.json()["redis"]
    assert "X-Request-ID" in result.headers
