import assert from "node:assert/strict";
import test from "node:test";
import {
  algorithmMeta,
  binarySearchLesson,
  bubbleSortLesson,
  countingSortLesson,
  heapSortLesson,
  insertionSortLesson,
  linearSearchLesson,
  mergeSortLesson,
  quickSortLesson,
  radixSortLesson,
  selectionSortLesson,
} from "../lib/lessons/index.ts";
import { createTimeline } from "../lib/visualization/index.ts";

const input = [42, 18, 67, 33, 55, 12, 74, 28];
const expected = [...input].sort((a, b) => a - b);

for (const lesson of [bubbleSortLesson, selectionSortLesson, insertionSortLesson, mergeSortLesson, quickSortLesson, heapSortLesson]) {
  test(`${lesson.title} finishes with sorted values`, () => {
    const timeline = createTimeline(lesson, { values: input });
    assert.deepEqual(timeline.steps.at(-1)?.frame.items.map((item) => item.value), expected);
    assert.equal(timeline.steps.at(-1)?.operation, "complete");
  });
}

test("Linear Search reports both found and missing targets", () => {
  const found = createTimeline(linearSearchLesson, { values: input, target: 55 });
  const missing = createTimeline(linearSearchLesson, { values: input, target: 99 });
  assert.equal(found.steps.at(-1)?.operation, "found");
  assert.match(found.steps.at(-1)?.frame.caption ?? "", /index 4/);
  assert.equal(missing.steps.at(-1)?.operation, "not-found");
});

test("Binary Search narrows a sorted range and finds its target", () => {
  const timeline = createTimeline(binarySearchLesson, { values: expected, target: 55 });
  assert.equal(timeline.steps.at(-1)?.operation, "found");
  assert.ok(timeline.steps.some((step) => step.operation.startsWith("discard-")));
  assert.ok(timeline.steps.some((step) => step.frame.items.some((item) => item.state === "muted")));
});

test("Counting Sort counts buckets before producing sorted output", () => {
  const timeline = createTimeline(countingSortLesson, { values: [4, 2, 2, 8, 3, 3, 1] });
  assert.equal(timeline.steps[0].frame.layout, "buckets");
  assert.deepEqual(timeline.steps.at(-1)?.frame.items.map((item) => item.value), [1, 2, 2, 3, 3, 4, 8]);
});

test("Radix Sort performs multiple stable digit passes", () => {
  const values = [170, 45, 75, 90, 802, 24, 2, 66];
  const timeline = createTimeline(radixSortLesson, { values });
  assert.ok(timeline.steps.filter((step) => step.operation === "collect-buckets").length >= 3);
  assert.deepEqual(timeline.steps.at(-1)?.frame.items.map((item) => item.value), [...values].sort((a, b) => a - b));
});

test("algorithm curriculum includes ten complete usage guides", () => {
  const lessons = Object.values(algorithmMeta);
  assert.equal(lessons.length, 10);
  for (const lesson of lessons) {
    assert.ok(lesson.concept);
    assert.ok(lesson.rule);
    assert.ok(lesson.usage.chooseWhen);
    assert.ok(lesson.usage.avoidWhen);
    assert.ok(lesson.usage.examples.length >= 3);
    assert.ok(lesson.usage.operations.length >= 3);
  }
});
