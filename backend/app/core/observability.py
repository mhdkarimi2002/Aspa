import logging
import time
from collections import defaultdict
from contextvars import ContextVar
from uuid import uuid4

from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

request_id_context: ContextVar[str | None] = ContextVar("request_id", default=None)
# Process-local aggregates; use the scraper's instance label for multiple replicas.
request_counts: dict[str, int] = defaultdict(int)
request_seconds: dict[str, float] = defaultdict(float)


class RequestTelemetry:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        request_id = str(uuid4())
        scope["aspa.request_id"] = request_id
        token = request_id_context.set(request_id)
        start = time.monotonic()
        status_code = 500

        async def traced_send(message: Message) -> None:
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
                MutableHeaders(scope=message)["X-Request-ID"] = request_id
            await send(message)

        try:
            await self.app(scope, receive, traced_send)
        finally:
            duration = time.monotonic() - start
            route = scope.get("route")
            path = getattr(route, "path", "unmatched")
            method = scope.get("method", "GET")
            if method not in {"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"}:
                method = "OTHER"
            key = f"{method} {path} {status_code}"
            request_counts[key] += 1
            request_seconds[key] += duration
            logging.getLogger("aspa.requests").info(
                "Request completed",
                extra={
                    "method": scope.get("method"),
                    "path": path,
                    "status_code": status_code,
                    "duration_seconds": round(duration, 6),
                },
            )
            request_id_context.reset(token)
