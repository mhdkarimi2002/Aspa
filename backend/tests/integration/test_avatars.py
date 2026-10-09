import base64
from io import BytesIO
from uuid import uuid4

import pytest
from httpx import AsyncClient
from PIL import Image

from app.main import app

pytestmark = pytest.mark.integration


async def login(client: AsyncClient) -> dict[str, str]:
    phone = f"09{uuid4().int % 10**9:09d}"
    await client.post("/api/auth/otp/request", json={"phone_number": phone})
    response = await client.post(
        "/api/auth/otp/verify",
        json={
            "phone_number": phone,
            "code": app.state.sms_provider.sent_codes["+98" + phone[1:]],
        },
    )
    assert response.status_code == 200
    return {"Authorization": "Bearer " + response.json()["access_token"]}


async def test_avatar_upload_ownership_drafts_and_delete(integration_client: AsyncClient) -> None:
    client = integration_client
    first = await login(client)
    second = await login(client)
    image = BytesIO()
    Image.new("RGB", (80, 40), "purple").save(image, format="PNG")
    payload = {"image": base64.b64encode(image.getvalue()).decode()}
    assert (await client.post("/api/users/me/avatar", json=payload)).status_code == 401
    assert (
        await client.post("/api/users/me/avatar", headers=first, json={"image": "invalid"})
    ).status_code == 422
    uploaded = await client.post("/api/users/me/avatar", headers=first, json=payload)
    assert uploaded.status_code == 200, uploaded.text
    path = uploaded.json()["avatar"]
    response = await client.get(path)
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/jpeg"
    with Image.open(BytesIO(response.content)) as photo:
        assert photo.size == (512, 512)
        assert not photo.getexif()
    assert (
        await client.patch("/api/users/me", headers=second, json={"avatar": path})
    ).status_code == 422
    saved = await client.patch("/api/users/me", headers=first, json={"avatar": path})
    assert saved.status_code == 200
    assert (await client.get("/api/users/me", headers=first)).json()["avatar"] == path
    draft = (await client.post("/api/users/me/avatar", headers=first, json=payload)).json()[
        "avatar"
    ]
    replacement = (await client.post("/api/users/me/avatar", headers=first, json=payload)).json()[
        "avatar"
    ]
    assert (await client.get(path)).status_code == 200
    assert (await client.get(draft)).status_code == 404
    assert (
        await client.patch("/api/users/me", headers=first, json={"avatar": replacement})
    ).status_code == 200
    assert (await client.get(path)).status_code == 404
    assert (
        await client.patch("/api/users/me", headers=first, json={"avatar": None})
    ).status_code == 200
    assert (await client.get(replacement)).status_code == 404
    another = (await client.post("/api/users/me/avatar", headers=first, json=payload)).json()[
        "avatar"
    ]
    assert (await client.delete("/api/users/me", headers=first)).status_code == 204
    assert (await client.get(another)).status_code == 404
