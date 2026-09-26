import assert from "node:assert/strict";
import test from "node:test";
import { canSaveProgress, parseCompletedLessons, readLocalValue, writeLocalValue } from "../lib/local-progress.ts";

test("lesson restoration tolerates malformed JSON and deduplicates known IDs", () => {
  for (const raw of ["null", "{}", "42", '"text"', "broken", null]) {
    assert.deepEqual(parseCompletedLessons(raw, ["arrays", "strings"]), []);
  }
  assert.deepEqual(parseCompletedLessons('["arrays","arrays",1,"unknown","strings"]', ["arrays", "strings"]), ["arrays", "strings"]);
});

test("denied or full browser storage preserves progress in the current session", () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  let events = 0;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      get localStorage() { throw new Error("Storage is denied"); },
      dispatchEvent() { events += 1; return true; },
    },
  });
  try {
    assert.equal(readLocalValue("unavailable"), null);
    assert.equal(canSaveProgress(), false);
    writeLocalValue("session-test", '["arrays"]');
    assert.equal(readLocalValue("session-test"), '["arrays"]');
    assert.equal(events, 1);
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
