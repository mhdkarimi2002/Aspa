import test from "node:test";
import assert from "node:assert/strict";
import { birthdateInputSchema, displayBirthdate } from "../src/auth/calendar";
import { codeSchema } from "../src/auth/schemas";
test("calendar follows language and round-trips Persian digits and leap dates", () => {
  assert.equal(birthdateInputSchema("fa").parse("۱۳۷۳/۱۰/۱۲"), "1995-01-02");
  assert.equal(displayBirthdate("1995-01-02", "fa"), "1373-10-12");
  assert.equal(birthdateInputSchema("en").parse("1995-01-02"), "1995-01-02");
  assert.equal(displayBirthdate("1995-01-02", "en"), "1995-01-02");
  assert.equal(
    birthdateInputSchema("fa").safeParse("1400-12-30").success,
    false,
  );
  assert.equal(birthdateInputSchema("fa").parse("1399-12-30"), "2021-03-20");
  assert.equal(
    birthdateInputSchema("fa").safeParse("1500-01-01").success,
    false,
  );
  assert.equal(codeSchema.safeParse("123456").success, false);
  assert.equal(codeSchema.safeParse("1234").success, false);
  assert.equal(codeSchema.parse("۱۲۳۴۵"), "12345");
});
