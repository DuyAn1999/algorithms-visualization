import assert from "node:assert/strict";
import test from "node:test";
import {
  adjacencyListLesson,
  adjacencyMatrixLesson,
  bfsLesson,
  componentsLesson,
  dfsLesson,
  graphBasicsLesson,
  graphMeta,
  topologicalSortLesson,
} from "../lib/lessons/index.ts";
import { createTimeline } from "../lib/visualization/index.ts";

const graph = {
  nodes: ["A", "B", "C", "D", "E", "F"],
  edges: [
    { from: "A", to: "B" }, { from: "A", to: "C" },
    { from: "B", to: "D" }, { from: "B", to: "E" },
    { from: "C", to: "E" }, { from: "D", to: "F" }, { from: "E", to: "F" },
  ],
  start: "A",
};

test("graph vocabulary preserves explicit immutable edges", () => {
  const timeline = createTimeline(graphBasicsLesson, graph);
  assert.equal(timeline.steps[0].frame.items.length, 6);
  assert.equal(timeline.steps[0].frame.edges?.length, 7);
  assert.equal(Object.isFrozen(timeline.steps[0].frame.edges), true);
  assert.equal(Object.isFrozen(timeline.steps[0].frame.edges?.[0]), true);
});

test("adjacency list contains both endpoints of undirected edges", () => {
  const timeline = createTimeline(adjacencyListLesson, graph);
  const rows = timeline.steps.at(-1)?.frame.items;
  assert.match(String(rows?.find((item) => item.label === "vertex A")?.value), /B.*C/);
  assert.match(String(rows?.find((item) => item.label === "vertex B")?.value), /A/);
});

test("adjacency matrix is symmetric for an undirected graph", () => {
  const timeline = createTimeline(adjacencyMatrixLesson, graph);
  const cells = timeline.steps.at(-1)?.frame.items ?? [];
  assert.equal(cells.find((item) => item.label === "A → B")?.value, 1);
  assert.equal(cells.find((item) => item.label === "B → A")?.value, 1);
  assert.equal(cells.find((item) => item.label === "A → F")?.value, 0);
});

test("BFS visits vertices by distance from the start", () => {
  const timeline = createTimeline(bfsLesson, graph);
  assert.deepEqual(timeline.steps.at(-1)?.frame.output, ["A", "B", "C", "D", "E", "F"]);
  assert.ok(timeline.steps.some((step) => step.operation === "discover-neighbor"));
});

test("DFS descends one branch and backtracks", () => {
  const timeline = createTimeline(dfsLesson, graph);
  assert.deepEqual(timeline.steps.at(-1)?.frame.output, ["A", "B", "D", "F", "E", "C"]);
  assert.ok(timeline.steps.some((step) => step.operation === "backtrack"));
});

test("connected components count disconnected groups and an isolated vertex", () => {
  const input = { nodes: ["A", "B", "C", "D", "E", "F"], edges: [{ from: "A", to: "B" }, { from: "B", to: "C" }, { from: "D", to: "E" }], start: "A" };
  const timeline = createTimeline(componentsLesson, input);
  assert.match(timeline.steps.at(-1)?.frame.caption ?? "", /3 connected components/);
  assert.ok(timeline.steps.at(-1)?.frame.output?.includes("F:C3"));
});

test("topological sort honors every directed dependency", () => {
  const dag = { nodes: ["A", "B", "C", "D", "E", "F"], edges: [{ from: "A", to: "C" }, { from: "B", to: "C" }, { from: "B", to: "D" }, { from: "C", to: "E" }, { from: "D", to: "F" }, { from: "E", to: "F" }], start: "A" };
  const timeline = createTimeline(topologicalSortLesson, dag);
  const order = timeline.steps.at(-1)?.frame.output as string[];
  for (const edge of dag.edges) assert.ok(order.indexOf(edge.from) < order.indexOf(edge.to));
  assert.ok(timeline.steps[0].frame.edges?.every((edge) => edge.directed));
  assert.throws(() => createTimeline(topologicalSortLesson, { ...dag, edges: [...dag.edges, { from: "F", to: "A" }] }), /no cycle/);
});

test("graph curriculum includes seven complete usage guides", () => {
  const lessons = Object.values(graphMeta);
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
