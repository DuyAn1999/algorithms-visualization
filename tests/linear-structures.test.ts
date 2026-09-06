import assert from "node:assert/strict";
import test from "node:test";
import {
  circularLinkedListLesson,
  circularQueueLesson,
  dequeLesson,
  doublyLinkedListLesson,
  hashTableLesson,
  linearMeta,
  singlyLinkedListLesson,
} from "../lib/lessons/index.ts";
import { createTimeline } from "../lib/visualization/index.ts";

test("singly linked list insertion preserves node order", () => {
  const timeline = createTimeline(singlyLinkedListLesson, {
    values: ["10", "20", "30"],
    afterIndex: 1,
    value: "25",
  });
  assert.deepEqual(
    timeline.steps.at(-1)?.frame.items.map((item) => item.value),
    ["10", "20", "25", "30"],
  );
  assert.equal(timeline.steps.at(-1)?.operation, "insert-complete");
});

test("doubly linked list removal reconnects both neighbors", () => {
  const timeline = createTimeline(doublyLinkedListLesson, {
    values: ["10", "20", "30", "40"],
    removeIndex: 1,
  });
  assert.equal(timeline.steps.some((step) => step.operation === "bridge-next"), true);
  assert.equal(timeline.steps.some((step) => step.operation === "bridge-prev"), true);
  assert.deepEqual(
    timeline.steps.at(-1)?.frame.items.map((item) => item.value),
    ["10", "30", "40"],
  );
});

test("circular traversal detects return to its start node", () => {
  const timeline = createTimeline(circularLinkedListLesson, {
    values: ["10", "20", "30"],
    startIndex: 0,
    visits: 4,
  });
  assert.equal(timeline.steps.at(-1)?.operation, "cycle-detected");
  assert.match(timeline.steps.at(-1)?.explanation ?? "", /Stop to avoid looping forever/);
});

test("circular queue wraps and moves REAR into the empty slot", () => {
  const timeline = createTimeline(circularQueueLesson, {
    slots: ["50", "60", null, "30", "40"],
    front: 3,
    rear: 1,
    value: "70",
  });
  const result = timeline.steps.at(-1);
  assert.equal(result?.frame.items[2].value, "70");
  assert.match(result?.frame.items[2].label ?? "", /REAR/);
});

test("deque supports operations at either end", () => {
  const front = createTimeline(dequeLesson, {
    values: ["20", "30", "40"],
    operation: "add-front",
    value: "10",
  });
  const rear = createTimeline(dequeLesson, {
    values: ["20", "30", "40"],
    operation: "remove-rear",
  });
  assert.deepEqual(front.steps.at(-1)?.frame.items.map((item) => item.value), ["10", "20", "30", "40"]);
  assert.deepEqual(rear.steps.at(-1)?.frame.items.map((item) => item.value), ["20", "30"]);
});

test("hash table demonstrates collision chaining", () => {
  const timeline = createTimeline(hashTableLesson, {
    entries: [{ key: "cat", value: "9" }],
    key: "act",
    value: "12",
    capacity: 5,
  });
  const collision = timeline.steps.find((step) => step.operation === "handle-collision");
  assert.ok(collision);
  assert.match(String(collision.frame.items[2].value), /cat: 9 → act: 12/);
});

test("linear curriculum includes eight complete usage guides", () => {
  const lessons = Object.values(linearMeta);
  assert.equal(lessons.length, 8);
  for (const lesson of lessons) {
    assert.ok(lesson.concept);
    assert.ok(lesson.rule);
    assert.ok(lesson.usage.chooseWhen);
    assert.ok(lesson.usage.avoidWhen);
    assert.ok(lesson.usage.examples.length >= 3);
    assert.ok(lesson.usage.operations.length >= 3);
  }
});
