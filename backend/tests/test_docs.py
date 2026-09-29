from httpx import AsyncClient


async def test_swagger_docs_use_only_local_assets(client: AsyncClient) -> None:
    response = await client.get("/docs")

    assert response.status_code == 200
    assert "/static/swagger/swagger-ui-bundle.js" in response.text
    assert "/static/swagger/swagger-ui.css" in response.text
    assert "/static/swagger/favicon.svg" in response.text
    assert "cdn.jsdelivr.net" not in response.text


async def test_local_swagger_assets_are_served(client: AsyncClient) -> None:
    javascript = await client.get("/static/swagger/swagger-ui-bundle.js")
    stylesheet = await client.get("/static/swagger/swagger-ui.css")

    assert javascript.status_code == 200
    assert javascript.headers["content-type"].startswith("text/javascript")
    assert "SwaggerUIBundle" in javascript.text
    assert stylesheet.status_code == 200
    assert stylesheet.headers["content-type"].startswith("text/css")
