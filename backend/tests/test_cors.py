from httpx import AsyncClient


async def test_browser_preflight_from_frontend_is_allowed(client: AsyncClient) -> None:
    response = await client.options(
        "/api/auth/login/otp/request",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
    assert "POST" in response.headers["access-control-allow-methods"]


async def test_unknown_origin_is_not_allowed(client: AsyncClient) -> None:
    response = await client.options(
        "/api/auth/login/otp/request",
        headers={
            "Origin": "http://evil.example",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert "access-control-allow-origin" not in response.headers
