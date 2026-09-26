import assert from "node:assert/strict";
import test from "node:test";
import {
  backtrackingLesson,
  bruteForceLesson,
  divideConquerLesson,
  dynamicProgrammingLesson,
  greedyLesson,
  memoizationLesson,
  slidingWindowLesson,
  techniqueMeta,
} from "../lib/lessons/algorithmic-techniques.ts";
import { createTimeline } from "../lib/visualization/timeline.ts";

test("brute force checks candidate pairs until it finds the target", () => {
  const timeline = createTimeline(bruteForceLesson, { values: [7, 1, 9, 4], target: 10 });
  assert.equal(timeline.steps.at(-1)?.operation, "solution-found");
  assert.ok(timeline.steps.at(-1)?.frame.output?.includes("PAIR=1+9"));
});

test("divide and conquer combines subranges into the maximum", () => {
  const timeline = createTimeline(divideConquerLesson, { values: [7, 1, 9, 4, 6], target: 0 });
  assert.ok(timeline.steps.at(-1)?.frame.output?.includes("MAX=9"));
  assert.ok(timeline.steps.some((step) => step.operation === "combine-results"));
});

test("greedy coin choice exposes its local-choice limitation", () => {
  const canonical = createTimeline(greedyLesson, { values: [1, 5, 10, 25], target: 63 });
  assert.ok(canonical.steps.at(-1)?.frame.output?.includes("COUNT=6"));
  const counterexample = createTimeline(greedyLesson, { values: [1, 3, 4], target: 6 });
  assert.ok(counterexample.steps.at(-1)?.frame.output?.includes("COUNT=3"));
});

test("memoization computes each Fibonacci state and reuses cache entries", () => {
  const timeline = createTimeline(memoizationLesson, { values: [], target: 6 });
  assert.ok(timeline.steps.some((step) => step.operation === "cache-hit"));
  assert.ok(timeline.steps.at(-1)?.frame.output?.includes("FIB(6)=8"));
});

test("dynamic programming finds the minimum number of coins", () => {
  const timeline = createTimeline(dynamicProgrammingLesson, { values: [1, 3, 4], target: 6 });
  assert.ok(timeline.steps.at(-1)?.frame.output?.includes("MIN COINS=2"));
});

test("backtracking finds a subset and records undo steps", () => {
  const timeline = createTimeline(backtrackingLesson, { values: [3, 4, 5, 2], target: 9 });
  assert.match(String(timeline.steps.at(-1)?.frame.output?.[0]), /^SUBSET=/);
  assert.ok(timeline.steps.some((step) => step.operation === "undo-choice"));
});

test("sliding window reuses work and finds the best fixed range", () => {
  const timeline = createTimeline(slidingWindowLesson, { values: [2, 1, 5, 1, 3, 2], target: 3 });
  assert.ok(timeline.steps.at(-1)?.frame.output?.includes("MAX SUM=9"));
  assert.equal(timeline.steps.filter((step) => step.operation === "slide-window").length, 3);
});

test("backtracking highlights only the selected occurrences of duplicate values", () => {
  const timeline = createTimeline(backtrackingLesson, { values: [3, 3, 4], target: 3 });
  const chosen = timeline.steps.at(-1)!.frame.items.filter((item) => item.state === "completed");
  assert.deepEqual(chosen.map((item) => item.id), ["technique-0"]);
  assert.equal(chosen.reduce((sum, item) => sum + Number(item.value), 0), 3);
});

test("technique curriculum includes seven complete usage guides", () => {
  const lessons = Object.values(techniqueMeta);
  assert.equal(lessons.length, 7);
  for (const lesson of lessons) {
    assert.ok(lesson.usage.summary);
    assert.ok(lesson.usage.chooseWhen);
    assert.ok(lesson.usage.avoidWhen);
    assert.ok(lesson.usage.examples.length >= 3);
    assert.ok(lesson.usage.operations.length >= 3);
    assert.ok(lesson.usage.practice);
  }
});
