import assert from "node:assert/strict";
import test from "node:test";
import {
  advancedTreeMeta,
  avlBalanceLesson,
  bstDeleteLesson,
  bstInsertLesson,
  bstRuleLesson,
  bstSearchLesson,
  heapExtractLesson,
  heapInsertLesson,
  type RotationKind,
} from "../lib/lessons/index.ts";
import { createTimeline } from "../lib/visualization/index.ts";

const bstValues = [50, 30, 70, 20, 40, 60, 80];
const base = { values: bstValues, value: 60, rotation: "ll" as const };

test("BST rule produces sorted inorder output", () => {
  const timeline = createTimeline(bstRuleLesson, base);
  assert.deepEqual(timeline.steps.at(-1)?.frame.output, [20, 30, 40, 50, 60, 70, 80]);
});

test("BST search follows one path for found and missing values", () => {
  const found = createTimeline(bstSearchLesson, base);
  const missing = createTimeline(bstSearchLesson, { ...base, value: 65 });
  assert.equal(found.steps.at(-1)?.operation, "found");
  assert.deepEqual(found.steps.at(-1)?.frame.output, [50, 70, 60]);
  assert.equal(missing.steps.at(-1)?.operation, "not-found");
});

test("BST insertion attaches one leaf and preserves inorder sorting", () => {
  const timeline = createTimeline(bstInsertLesson, { ...base, value: 65 });
  assert.deepEqual(timeline.steps.at(-1)?.frame.output, [20, 30, 40, 50, 60, 65, 70, 80]);
  assert.equal(timeline.steps.at(-1)?.frame.items.length, bstValues.length + 1);
});

for (const [label, values, value, operation, expected] of [
  ["leaf", bstValues, 20, "leaf-case", [30, 40, 50, 60, 70, 80]],
  ["one child", [50, 30, 70, 20, 40, 60], 70, "one-child-case", [20, 30, 40, 50, 60]],
  ["two children", bstValues, 30, "find-successor", [20, 40, 50, 60, 70, 80]],
] as const) {
  test(`BST deletion handles the ${label} case`, () => {
    const timeline = createTimeline(bstDeleteLesson, { values: [...values], value, rotation: "ll" });
    assert.ok(timeline.steps.some((step) => step.operation === operation));
    assert.deepEqual(timeline.steps.at(-1)?.frame.output, expected);
  });
}

function assertMinHeap(values: number[]) {
  values.forEach((value, index) => { if (index > 0) assert.ok(values[Math.floor((index - 1) / 2)] <= value); });
}

test("min-heap insertion bubbles a new priority upward", () => {
  const timeline = createTimeline(heapInsertLesson, { values: [10, 20, 15, 30, 40, 50], value: 5, rotation: "ll" });
  const result = timeline.steps.at(-1)?.frame.output as number[];
  assert.equal(result[0], 5);
  assertMinHeap(result);
});

test("extract-min returns the root and restores the heap", () => {
  const timeline = createTimeline(heapExtractLesson, { values: [10, 20, 15, 30, 40, 50, 25], value: 0, rotation: "ll" });
  const result = timeline.steps.at(-1)?.frame.output as number[];
  assert.equal(result.length, 6);
  assert.match(timeline.steps.at(-1)?.frame.caption ?? "", /Returned 10/);
  assertMinHeap(result);
});

for (const rotation of ["ll", "rr", "lr", "rl"] as RotationKind[]) {
  test(`AVL ${rotation.toUpperCase()} imbalance finishes balanced`, () => {
    const timeline = createTimeline(avlBalanceLesson, { values: [], value: 0, rotation });
    const final = timeline.steps.at(-1)!;
    const root = final.frame.items.find((item) => item.parentId === null);
    assert.equal(root?.value, 20);
    assert.deepEqual(final.frame.items.filter((item) => item.parentId === root?.id).map((item) => item.value).sort(), [10, 30]);
    assert.equal(final.operation, "balance-restored");
  });
}

test("advanced tree curriculum includes seven complete usage guides", () => {
  const lessons = Object.values(advancedTreeMeta);
  assert.equal(lessons.length, 7);
  for (const lesson of lessons) {
    assert.ok(lesson.concept);
    assert.ok(lesson.rule);
    assert.ok(lesson.usage.chooseWhen);
    assert.ok(lesson.usage.avoidWhen);
    assert.ok(lesson.usage.examples.length >= 3);
    assert.ok(lesson.usage.operations.length >= 3);
  }
});
