import assert from "node:assert/strict";
import test from "node:test";
import {
  bellmanFordLesson,
  dijkstraLesson,
  floydWarshallLesson,
  kruskalLesson,
  primLesson,
  unionFindLesson,
  weightedBasicsLesson,
  weightedGraphMeta,
} from "../lib/lessons/index.ts";
import { createTimeline } from "../lib/visualization/index.ts";

const nodes = ["A", "B", "C", "D", "E", "F"];
const positiveEdges = [
  { from: "A", to: "B", weight: 4 }, { from: "A", to: "C", weight: 2 },
  { from: "C", to: "B", weight: 1 }, { from: "B", to: "D", weight: 5 },
  { from: "C", to: "D", weight: 8 }, { from: "C", to: "E", weight: 10 },
  { from: "D", to: "E", weight: 2 }, { from: "D", to: "F", weight: 6 }, { from: "E", to: "F", weight: 3 },
];
const positive = { nodes, edges: positiveEdges, start: "A" };

test("weighted concepts preserve edge costs and a cheapest-path total", () => {
  const timeline = createTimeline(weightedBasicsLesson, positive);
  assert.equal(timeline.steps[0].frame.edges?.[0].label, "4");
  assert.match(timeline.steps.at(-2)?.frame.caption ?? "", /13/);
});

test("Dijkstra computes expected non-negative shortest distances", () => {
  const timeline = createTimeline(dijkstraLesson, positive);
  assert.deepEqual(timeline.steps.at(-1)?.frame.output, ["A=0", "B=3", "C=2", "D=8", "E=10", "F=13"]);
  assert.throws(() => createTimeline(dijkstraLesson, { ...positive, edges: [{ from: "A", to: "B", weight: -1 }] }), /non-negative/);
});

test("Bellman-Ford handles negative edges and detects a negative cycle", () => {
  const input = { nodes: ["A", "B", "C", "D", "E"], edges: [{ from: "A", to: "B", weight: 4 }, { from: "A", to: "C", weight: 5 }, { from: "B", to: "C", weight: -2 }, { from: "B", to: "D", weight: 4 }, { from: "C", to: "D", weight: 3 }, { from: "D", to: "E", weight: 2 }, { from: "C", to: "E", weight: 6 }], start: "A" };
  const timeline = createTimeline(bellmanFordLesson, input);
  assert.deepEqual(timeline.steps.at(-1)?.frame.output, ["A=0", "B=4", "C=2", "D=5", "E=7"]);
  const cycle = createTimeline(bellmanFordLesson, { nodes: ["A", "B", "C"], edges: [{ from: "A", to: "B", weight: 1 }, { from: "B", to: "C", weight: -2 }, { from: "C", to: "A", weight: 0 }], start: "A" });
  assert.equal(cycle.steps.at(-1)?.operation, "negative-cycle-detected");
});

test("Floyd-Warshall improves all-pairs matrix routes", () => {
  const input = { nodes: ["A", "B", "C", "D"], edges: [{ from: "A", to: "B", weight: 3 }, { from: "A", to: "D", weight: 7 }, { from: "B", to: "A", weight: 8 }, { from: "B", to: "C", weight: 2 }, { from: "C", to: "A", weight: 5 }, { from: "C", to: "D", weight: 1 }, { from: "D", to: "A", weight: 2 }], start: "A" };
  const timeline = createTimeline(floydWarshallLesson, input);
  const cell = timeline.steps.at(-1)?.frame.items.find((item) => item.label === "A → D");
  assert.equal(cell?.value, 6);
  assert.equal(timeline.steps.at(-1)?.operation, "all-pairs-complete");
});

test("Prim and Kruskal produce the same minimum spanning-tree cost", () => {
  const prim = createTimeline(primLesson, positive);
  const kruskal = createTimeline(kruskalLesson, positive);
  assert.equal(prim.steps.at(-1)?.frame.output?.at(-1), "TOTAL=13");
  assert.equal(kruskal.steps.at(-1)?.frame.output?.at(-1), "TOTAL=13");
  assert.equal(prim.steps.at(-1)?.frame.edges?.filter((edge) => edge.state === "completed").length, nodes.length - 1);
  assert.equal(kruskal.steps.at(-1)?.frame.edges?.filter((edge) => edge.state === "completed").length, nodes.length - 1);
});

test("Union-Find rejects cycle edges and merges a connected graph", () => {
  const timeline = createTimeline(unionFindLesson, positive);
  assert.match(timeline.steps.at(-1)?.frame.caption ?? "", /1 set remain/);
  assert.ok(timeline.steps.some((step) => /reveal a cycle/.test(step.explanation)));
});

test("weighted graph curriculum includes seven complete usage guides", () => {
  const lessons = Object.values(weightedGraphMeta);
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
