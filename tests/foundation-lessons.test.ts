import assert from "node:assert/strict";
import test from "node:test";
import {
  arrayAccessLesson,
  bigOLesson,
  factorialLesson,
  foundationMeta,
  matrixScanLesson,
  stringScanLesson,
} from "../lib/lessons/index.ts";
import { createTimeline } from "../lib/visualization/index.ts";

test("array access goes directly to the requested index", () => {
  const timeline = createTimeline(arrayAccessLesson, {
    values: [14, 28, 35, 42, 57, 63],
    index: 3,
  });
  const result = timeline.steps.at(-1);
  assert.equal(result?.operation, "read-value");
  assert.equal(result?.frame.items[3].value, 42);
  assert.equal(result?.frame.items[3].state, "completed");
});

test("string scan preserves character indices and stops on the target", () => {
  const timeline = createTimeline(stringScanLesson, {
    text: "algorithm",
    target: "r",
  });
  const result = timeline.steps.at(-1);
  assert.equal(result?.operation, "found");
  assert.equal(result?.frame.items[4].value, "r");
  assert.equal(result?.frame.items[4].state, "completed");
});

test("matrix scan reports row and column coordinates", () => {
  const timeline = createTimeline(matrixScanLesson, {
    values: [[3, 8, 2], [5, 1, 7], [9, 4, 6]],
    target: 7,
  });
  const result = timeline.steps.at(-1);
  assert.equal(result?.operation, "found");
  assert.equal(result?.frame.items[5].label, "row 1, column 2");
  assert.match(result?.explanation ?? "", /row 1, column 2/);
});

test("factorial recursion descends to a base case and returns upward", () => {
  const timeline = createTimeline(factorialLesson, { n: 4 });
  assert.equal(timeline.steps.some((step) => step.operation === "base-case"), true);
  const result = timeline.steps.at(-1);
  assert.equal(result?.operation, "return-value");
  assert.equal(result?.frame.items[0].value, "factorial(4) = 24");
});

test("Big-O lesson calculates growth values from n", () => {
  const timeline = createTimeline(bigOLesson, { n: 16 });
  assert.deepEqual(
    timeline.steps[0].frame.items.map((item) => item.value),
    [1, 4, 16, 256],
  );
});

test("every foundation lesson includes a complete usage guide", () => {
  for (const lesson of Object.values(foundationMeta)) {
    assert.ok(lesson.usage.summary);
    assert.ok(lesson.usage.chooseWhen);
    assert.ok(lesson.usage.avoidWhen);
    assert.ok(lesson.usage.practice);
    assert.ok(lesson.usage.examples.length >= 3);
    assert.ok(lesson.usage.operations.length >= 3);
  }
});
