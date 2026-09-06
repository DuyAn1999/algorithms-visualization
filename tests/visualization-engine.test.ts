import assert from "node:assert/strict";
import test from "node:test";
import {
  bubbleSortLesson,
  queueOperationLesson,
  stackOperationLesson,
} from "../lib/lessons/index.ts";
import {
  createPlaybackState,
  createTimeline,
  playbackReducer,
} from "../lib/visualization/index.ts";

test("creates deterministic, immutable Bubble Sort steps", () => {
  const input = { values: [5, 2, 4, 1] };
  const first = createTimeline(bubbleSortLesson, input);
  const second = createTimeline(bubbleSortLesson, input);

  assert.deepEqual(first.steps, second.steps);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.steps), true);
  assert.equal(Object.isFrozen(first.steps[0].frame.items), true);

  input.values[0] = 99;
  const finalValues = first.steps.at(-1)?.frame.items.map((item) => item.value);
  assert.deepEqual(finalValues, [1, 2, 4, 5]);
  assert.equal(new Set(first.steps.map((step) => step.id)).size, first.steps.length);
});

test("uses the same timeline contract for Stack and Queue operations", () => {
  const stack = createTimeline(stackOperationLesson, {
    values: ["12", "24", "39"],
    operation: "push",
    value: "52",
  });
  const queue = createTimeline(queueOperationLesson, {
    values: ["12", "24", "39"],
    operation: "dequeue",
  });

  assert.equal(stack.steps.at(-1)?.frame.layout, "stack");
  assert.deepEqual(
    stack.steps.at(-1)?.frame.items.map((item) => item.value),
    ["12", "24", "39", "52"],
  );
  assert.equal(queue.steps.at(-1)?.frame.layout, "queue");
  assert.deepEqual(
    queue.steps.at(-1)?.frame.items.map((item) => item.value),
    ["24", "39"],
  );
});

test("playback transitions safely through play, pause, rewind, and reset", () => {
  let state = createPlaybackState(3);
  state = playbackReducer(state, { type: "play" });
  assert.equal(state.status, "playing");

  state = playbackReducer(state, { type: "tick" });
  assert.equal(state.index, 0);
  state = playbackReducer(state, { type: "pause" });
  assert.equal(state.status, "paused");

  state = playbackReducer(state, { type: "next" });
  assert.equal(state.index, 1);
  state = playbackReducer(state, { type: "previous" });
  assert.equal(state.index, 0);

  state = playbackReducer(state, { type: "next" });
  state = playbackReducer(state, { type: "next" });
  assert.equal(state.status, "completed");
  assert.equal(state.index, 2);

  state = playbackReducer(state, { type: "reset" });
  assert.equal(state.status, "idle");
  assert.equal(state.index, -1);
});
