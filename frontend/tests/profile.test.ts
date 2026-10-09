import test from "node:test";
import assert from "node:assert/strict";
import {
  calendarMonth,
  adjacentMonth,
  isoDate,
  calendarToday,
} from "../src/features/profile/calendar";
import { profileSchema, userSchema } from "../src/auth/schemas";

test("Persian calendar spans two Gregorian API months and handles leap Esfand and year rollover", () => {
  const esfand = calendarMonth(new Date(2025, 2, 5, 12), "fa");
  assert.equal(isoDate(esfand.start), "2025-02-19");
  assert.equal(isoDate(esfand.end), "2025-03-20");
  assert.equal(esfand.days, 30);
  assert.deepEqual(esfand.months, ["2025-02-01", "2025-03-01"]);
  const next = calendarMonth(adjacentMonth(esfand.start, "fa", 1), "fa");
  assert.equal(isoDate(next.start), "2025-03-21");
  assert.equal(next.days, 31);
  assert.equal(
    isoDate(calendarMonth(adjacentMonth(next.start, "fa", -1), "fa").start),
    "2025-02-19",
  );
  assert.equal(
    isoDate(calendarToday(new Date("2026-09-30T21:00:00Z"))),
    "2026-10-01",
  );
  const feb = calendarMonth(new Date(2024, 1, 14, 12), "en");
  assert.equal(feb.days, 29);
  assert.deepEqual(feb.months, ["2024-02-01"]);
});
test("profile fields preserve display-name case, validate links, and accept old cached identities", () => {
  const value = {
    username: "",
    email: "",
    birthdate: "1995-01-02",
    gender: "male",
    avatar: "",
    name: "  Mehdi Karimi  ",
    bio: " About me ",
    profile_link: "https://example.com/me",
  };
  const result = profileSchema.parse(value);
  assert.equal(result.name, "Mehdi Karimi");
  assert.equal(result.bio, "About me");
  for (const profile_link of [
    "javascript:alert(1)",
    "https://me:secret@example.com",
    "http:example.com",
    "not a link",
  ]) {
    assert.equal(
      profileSchema.safeParse({ ...value, profile_link }).success,
      false,
    );
  }
  assert.equal(
    profileSchema.safeParse({ ...value, bio: "x".repeat(501) }).success,
    false,
  );
  assert.equal(
    userSchema.parse({
      id: "user-1",
      phone_number: null,
      username: null,
      email: null,
      birthdate: null,
      birthdate_jalali: null,
      gender: null,
      avatar: null,
      account_level: "free",
      is_active: true,
    }).name,
    null,
  );
});
