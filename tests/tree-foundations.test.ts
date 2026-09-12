import assert from "node:assert/strict";
import test from "node:test";
import {
  binaryTreeLesson,
  generalTreeLesson,
  inorderLesson,
  levelOrderLesson,
  postorderLesson,
  preorderLesson,
  treeMeta,
} from "../lib/lessons/index.ts";
import { createTimeline } from "../lib/visualization/index.ts";

const values = [8, 4, 12, 2, 6, 10, 14];
const input = { values, selectedIndex: 1 };

test("general tree identifies a root and supports more than two children", () => {
  const timeline = createTimeline(generalTreeLesson, input);
  const items = timeline.steps[0].frame.items;
  assert.equal(items.filter((item) => item.parentId === null).length, 1);
  assert.equal(items.filter((item) => item.parentId === "tree-0").length, 3);
  assert.equal(timeline.steps.at(-1)?.operation, "structure-ready");
});

test("binary tree limits parents to left and right child positions", () => {
  const timeline = createTimeline(binaryTreeLesson, input);
  const items = timeline.steps[0].frame.items;
  for (const parent of items) assert.ok(items.filter((item) => item.parentId === parent.id).length <= 2);
  assert.deepEqual(items.slice(1, 3).map((item) => item.edgeLabel), ["left", "right"]);
});

const traversalCases = [
  [preorderLesson, [8, 4, 2, 6, 12, 10, 14]],
  [inorderLesson, [2, 4, 6, 8, 10, 12, 14]],
  [postorderLesson, [2, 6, 4, 10, 14, 12, 8]],
] as const;

for (const [lesson, expected] of traversalCases) {
  test(`${lesson.title} produces the expected visit order`, () => {
    const timeline = createTimeline(lesson, input);
    assert.deepEqual(timeline.steps.at(-1)?.frame.output, expected);
    assert.equal(Object.isFrozen(timeline.steps.at(-1)?.frame.output), true);
  });
}

test("level-order traversal follows queue order across tree levels", () => {
  const timeline = createTimeline(levelOrderLesson, input);
  assert.deepEqual(timeline.steps.at(-1)?.frame.output, values);
  assert.ok(timeline.steps.some((step) => step.operation === "enqueue-children"));
  assert.ok(timeline.steps.some((step) => /Queue:/.test(step.frame.caption ?? "")));
});

test("tree curriculum includes six complete usage guides", () => {
  const lessons = Object.values(treeMeta);
  assert.equal(lessons.length, 6);
  for (const lesson of lessons) {
    assert.ok(lesson.concept);
    assert.ok(lesson.rule);
    assert.ok(lesson.usage.chooseWhen);
    assert.ok(lesson.usage.avoidWhen);
    assert.ok(lesson.usage.examples.length >= 3);
    assert.ok(lesson.usage.operations.length >= 3);
  }
});
