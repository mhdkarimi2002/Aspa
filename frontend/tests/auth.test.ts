import { test } from "node:test";
import assert from "node:assert/strict";
import { Session, type TokenStorage } from "../src/auth/session-core";
import { ApiError, type RequestOptions } from "../src/api/client";
import {
  phoneSchema,
  birthdateSchema,
  codeSchema,
  profileSchema,
  type Auth,
} from "../src/auth/schemas";
const auth = (token = "access"): Auth => ({
  access_token: token,
  refresh_token: token.padEnd(40, "x"),
  refresh_expires_in: 300,
  user: {
    id: "user-1",
    phone_number: "+989123456789",
    username: null,
    name: null,
    province: null,
    bio: null,
    profile_link: null,
    email: null,
    birthdate: "1995-01-02",
    birthdate_jalali: "1373-10-12",
    gender: "other",
    avatar: null,
    account_level: "free",
    is_active: true,
  },
});
function memory(initial: string | null = null) {
  let token = initial;
  return {
    read: async () => token,
    write: async (v: string) => {
      token = v;
    },
    clear: async () => {
      token = null;
    },
  } satisfies TokenStorage;
}
test("Iranian phones and codes accept Persian and Arabic digits; dates and profile fields reject invalid data", () => {
  for (const phone of [
    "۰۹۱۲۳۴۵۶۷۸۹",
    "٠٩١٢٣٤٥٦٧٨٩",
    "0098 912 345 6789",
    "98(912)345-6789",
  ])
    assert.equal(phoneSchema.parse(phone), "+989123456789");
  assert.equal(codeSchema.parse("۱۱۲۲۳"), "11223");
  assert.equal(phoneSchema.safeParse("123").success, false);
  assert.equal(codeSchema.safeParse("1234").success, false);
  assert.equal(birthdateSchema.safeParse("2024-02-31").success, false);
  assert.equal(birthdateSchema.safeParse("2999-01-01").success, false);
  assert.equal(birthdateSchema.parse("۲۰۰۰-۰۲-۲۹"), "2000-02-29");
  assert.equal(
    profileSchema.safeParse({
      username: "ab",
      email: "bad",
      birthdate: "2000-01-01",
      gender: "other",
    }).success,
    false,
  );
});
test("concurrent expired requests share one token rotation and retry with the new access token", async () => {
  const storage = memory();
  let rotations = 0;
  let current: Auth | null = null;
  const session = new Session(
    storage,
    async <T>(path: string, options?: RequestOptions) => {
      if (path.endsWith("/refresh")) {
        rotations++;
        await new Promise((r) => setTimeout(r, 10));
        return auth("new") as T;
      }
      if (options?.token === "old") throw new ApiError(401, "expired");
      return { token: options?.token } as T;
    },
    (a) => {
      current = a;
    },
  );
  await session.accept(auth("old"));
  assert.deepEqual(
    await Promise.all([
      session.authenticated("/api/users/me"),
      session.authenticated("/api/users/me"),
    ]),
    [{ token: "new" }, { token: "new" }],
  );
  assert.equal(rotations, 1);
  assert.equal(await storage.read(), auth("new").refresh_token);
  assert.ok(current);
});
test("offline restore retains refresh token for recovery; invalid restore removes it", async () => {
  const storage = memory(auth().refresh_token);
  const offline = new Session(
    storage,
    async () => {
      throw new TypeError("offline");
    },
    () => {},
  );
  await assert.rejects(offline.restore());
  assert.equal(await storage.read(), auth().refresh_token);
  const invalid = new Session(
    storage,
    async () => {
      throw new ApiError(401, "expired");
    },
    () => {},
  );
  await assert.rejects(invalid.restore());
  assert.equal(await storage.read(), null);
});
test("logout during a pending refresh cannot resurrect the session", async () => {
  const storage = memory();
  let resolve: (value: Auth) => void = () => {};
  const pending = new Promise<Auth>((r) => {
    resolve = r;
  });
  let current: Auth | null = null;
  const session = new Session(
    storage,
    async <T>(path: string) =>
      path.endsWith("/refresh") ? ((await pending) as T) : (undefined as T),
    (a) => {
      current = a;
    },
  );
  await session.accept(auth("old"));
  const refresh = session.refresh();
  await session.logout();
  resolve(auth("new"));
  await assert.rejects(refresh);
  assert.equal(current, null);
  assert.equal(await storage.read(), null);
});
test("logout clears credentials locally even if server revocation fails", async () => {
  const storage = memory();
  let current: Auth | null = null;
  const session = new Session(
    storage,
    async () => {
      throw new TypeError("offline");
    },
    (a) => {
      current = a;
    },
  );
  await session.accept(auth());
  await assert.rejects(session.logout());
  assert.equal(await storage.read(), null);
  assert.equal(current, null);
  await assert.rejects(
    session.authenticated("/api/users/me"),
    (e: unknown) => e instanceof ApiError && e.status === 401,
  );
});
test("app restart restores identity by rotating the securely saved refresh credential", async () => {
  const storage = memory(auth("old").refresh_token);
  let current: Auth | null = null;
  const restarted = new Session(
    storage,
    async <T>(path: string, options?: RequestOptions) => {
      assert.equal(path, "/api/auth/refresh");
      assert.deepEqual(options?.body, {
        refresh_token: auth("old").refresh_token,
      });
      return auth("restored") as T;
    },
    (a) => {
      current = a;
    },
  );
  await restarted.restore();
  assert.ok(current);
  assert.equal(await storage.read(), auth("restored").refresh_token);
});
test("a rejected post-refresh access credential ends the session", async () => {
  const storage = memory();
  let signedOut = false;
  const session = new Session(
    storage,
    async <T>(path: string) => {
      if (path.endsWith("/refresh")) return auth("new") as T;
      throw new ApiError(401, "invalid");
    },
    (a) => {
      signedOut = a === null;
    },
  );
  await session.accept(auth("old"));
  await assert.rejects(session.authenticated("/api/users/me"));
  assert.equal(signedOut, true);
  assert.equal(await storage.read(), null);
});
test("offline relaunch can retry a protected request after connectivity returns without losing identity", async () => {
  const storage = memory("refresh".padEnd(40, "x"));
  let online = false;
  const s = new Session(
    storage,
    async <T>(path: string) => {
      if (!online) throw new TypeError("Network unavailable");
      return (
        path === "/api/auth/refresh" ? auth("restored") : { ok: true }
      ) as T;
    },
    () => {},
  );
  await assert.rejects(s.restore());
  online = true;
  assert.deepEqual(await s.authenticated("/api/private"), { ok: true });
  assert.equal(await storage.read(), "restored".padEnd(40, "x"));
});
test("a refresh that restores another account cannot retry the original owner’s mutation", async () => {
  let writes = 0;
  const other = auth("other-access");
  other.user.id = "user-2";
  const s = new Session(
    memory(),
    async <T>(path: string) => {
      if (path === "/api/auth/refresh") return other as T;
      writes++;
      throw new ApiError(401, "Expired");
    },
    () => {},
  );
  await s.accept(auth());
  await assert.rejects(
    s.authenticated("/api/workouts/sync", {
      method: "PUT",
      ownerId: "user-1",
      body: { client_id: "old-owner" },
    }),
    (e: unknown) => e instanceof ApiError && e.status === 401,
  );
  assert.equal(writes, 1);
});
test("an offline draft’s owner is checked after credential recovery before any mutation is sent", async () => {
  let writes = 0;
  const other = auth("other-access");
  other.user.id = "user-2";
  const s = new Session(
    memory("refresh".padEnd(40, "x")),
    async <T>(path: string) => {
      if (path === "/api/auth/refresh") return other as T;
      writes++;
      return {} as T;
    },
    () => {},
  );
  await s.restore();
  await assert.rejects(
    s.authenticated("/api/workouts/sync", { method: "PUT", ownerId: "user-1" }),
  );
  assert.equal(writes, 0);
});
