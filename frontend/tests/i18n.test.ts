import { test } from "node:test";
import assert from "node:assert/strict";
import { english, translate } from "../src/i18n/messages";
test("Persian source strings and English messages resolve consistently", () => {
  for (const [persian, englishText] of Object.entries(english)) {
    assert.ok(englishText.trim());
    assert.equal(translate("fa", persian), persian);
    assert.equal(translate("en", persian), englishText);
  }
});
test("translation interpolates user content without translating or recursively substituting it", () => {
  assert.equal(
    translate("en", "فرم برای «{name}» معتبر است.", { name: "آسپا {name}" }),
    "The form for “آسپا {name}” is valid.",
  );
  assert.equal(
    translate("fa", "فرم برای «{name}» معتبر است.", { name: "Sam" }),
    "فرم برای «Sam» معتبر است.",
  );
  assert.equal(translate("en", "English"), "English");
});
