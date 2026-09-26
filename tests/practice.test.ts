import assert from "node:assert/strict";
import test from "node:test";
import { curriculumModules } from "../lib/curriculum.ts";
import { parsePracticeProgress, practiceQuestions, practiceSummary, recordPracticeAnswer } from "../lib/practice.ts";

test("practice bank covers every curriculum module with two questions", () => {
  assert.equal(practiceQuestions.length, 16);
  assert.equal(new Set(practiceQuestions.map((question) => question.id)).size, practiceQuestions.length);
  for (const curriculumModule of curriculumModules) assert.equal(practiceQuestions.filter((question) => question.moduleId === curriculumModule.id).length, 2);
});

test("every practice question has one valid answer and learning feedback", () => {
  for (const question of practiceQuestions) {
    assert.equal(question.options.length, 4);
    assert.equal(question.options.filter((option) => option.id === question.answer).length, 1);
    assert.ok(question.explanation.length > 30);
    assert.ok(question.hint.length > 10);
  }
});

test("practice answers accumulate attempts and preserve mastery", () => {
  let progress = recordPracticeAnswer({}, "foundation-growth", false);
  progress = recordPracticeAnswer(progress, "foundation-growth", true);
  progress = recordPracticeAnswer(progress, "foundation-growth", false);
  assert.deepEqual(progress["foundation-growth"], { attempts: 3, correctAttempts: 1, lastCorrect: false, mastered: true });
});

test("practice progress parser ignores unknown and malformed entries", () => {
  const parsed = parsePracticeProgress(JSON.stringify({ "foundation-growth": { attempts: 2, correctAttempts: 1, lastCorrect: true, mastered: true }, unknown: { attempts: 8 }, "linear-stack": { attempts: 0 } }));
  assert.deepEqual(Object.keys(parsed), ["foundation-growth"]);
});

test("practice summary reports accuracy and module mastery", () => {
  let progress = recordPracticeAnswer({}, "foundation-growth", true);
  progress = recordPracticeAnswer(progress, "foundation-matrix", false);
  progress = recordPracticeAnswer(progress, "foundation-matrix", true);
  const summary = practiceSummary(progress);
  assert.equal(summary.attempts, 3);
  assert.equal(summary.correctAttempts, 2);
  assert.equal(summary.accuracy, 67);
  assert.equal(summary.masteredQuestions, 2);
  assert.equal(summary.masteredModules, 1);
});
