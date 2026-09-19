import assert from "node:assert/strict";
import test from "node:test";
import { countStoredLessons, curriculumModules, curriculumProgress, totalCurriculumLessons } from "../lib/curriculum.ts";

test("curriculum map includes all eight learning modules and 57 lessons", () => {
  assert.equal(curriculumModules.length, 8);
  assert.equal(totalCurriculumLessons, 57);
  assert.deepEqual(curriculumModules.map((module) => module.checkpoint), [3, 4, 5, 6, 7, 8, 9, 10]);
});

test("stored lesson progress is deduplicated, validated, and capped", () => {
  assert.equal(countStoredLessons('["a","a","b",4]', 8), 2);
  assert.equal(countStoredLessons('["a","b","c"]', 2), 2);
  assert.equal(countStoredLessons("not json", 8), 0);
  assert.equal(countStoredLessons(null, 8), 0);
});

test("curriculum progress identifies the first unfinished module", () => {
  const summary = curriculumProgress({ foundations: 5, linear: 3 });
  assert.equal(summary.completedLessons, 8);
  assert.equal(summary.completedModules, 1);
  assert.equal(summary.resumeModule.id, "linear");
  assert.equal(summary.percentage, 14);
});

test("a completed curriculum returns the final module for review", () => {
  const progress = Object.fromEntries(curriculumModules.map((module) => [module.id, module.lessonCount]));
  const summary = curriculumProgress(progress);
  assert.equal(summary.completedLessons, 57);
  assert.equal(summary.completedModules, 8);
  assert.equal(summary.percentage, 100);
  assert.equal(summary.resumeModule.id, "techniques");
});
