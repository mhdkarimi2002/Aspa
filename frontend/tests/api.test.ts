import { test } from "node:test";
import assert from "node:assert/strict";
import { parseConfig } from "../src/api/config";
import { request, ApiError } from "../src/api/client";
test("local defaults and hosted HTTPS policy", () => {
  assert.equal(parseConfig({}).apiUrl, "http://localhost:8000");
  assert.equal(
    parseConfig({
      apiUrl: "https://api.example.com/",
      environment: "production",
    }).apiUrl,
    "https://api.example.com",
  );
  assert.throws(() => parseConfig({ environment: "production" }));
  assert.throws(() =>
    parseConfig({ apiUrl: "http://api.example.com", environment: "staging" }),
  );
  assert.throws(() => parseConfig({ apiUrl: "file:///tmp" }));
});
test("transport handles success, errors and cancellation", async () => {
  const original = global.fetch;
  try {
    global.fetch = async (_input, init) => {
      assert.ok(init?.signal);
      return new Response(JSON.stringify({ status: "ok" }));
    };
    assert.deepEqual(await request("http://localhost", "/health"), {
      status: "ok",
    });
    global.fetch = async () => new Response("unavailable", { status: 503 });
    await assert.rejects(
      request("http://localhost", "/health"),
      (error: unknown) => error instanceof ApiError && error.status === 503,
    );
    const controller = new AbortController();
    controller.abort();
    global.fetch = async (_input, init) => {
      init?.signal?.throwIfAborted();
      return new Response("{}");
    };
    await assert.rejects(
      request("http://localhost", "/health", controller.signal),
      { name: "AbortError" },
    );
  } finally {
    global.fetch = original;
  }
});
test("JSON writes, bearer headers, 204 logout and rate-limit metadata", async () => {
  const original = global.fetch;
  try {
    global.fetch = async (_input, init) => {
      assert.equal(init?.method, "POST");
      assert.equal(
        (init?.headers as Record<string, string>).Authorization,
        "Bearer access",
      );
      assert.equal(init?.body, JSON.stringify({ refresh_token: "refresh" }));
      return new Response(null, { status: 204 });
    };
    assert.equal(
      await request("http://localhost", "/logout", undefined, {
        method: "POST",
        token: "access",
        body: { refresh_token: "refresh" },
      }),
      undefined,
    );
    global.fetch = async () =>
      new Response(JSON.stringify({ error: { message: "Wait" } }), {
        status: 429,
        headers: { "Retry-After": "120" },
      });
    await assert.rejects(
      request("http://localhost", "/otp"),
      (e: unknown) =>
        e instanceof ApiError && e.retryAfter === 120 && e.message === "Wait",
    );
  } finally {
    global.fetch = original;
  }
});
test("browser cookie session includes credentials and explicit session header", async () => {
  const original = global.fetch;
  try {
    global.fetch = async (_input, init) => {
      assert.equal(init?.credentials, "include");
      assert.equal(
        (init?.headers as Record<string, string>)["X-Session-Mode"],
        "cookie",
      );
      return new Response("{}");
    };
    await request("", "/api/auth/session/refresh", undefined, {
      method: "POST",
      cookieSession: true,
    });
  } finally {
    global.fetch = original;
  }
});
