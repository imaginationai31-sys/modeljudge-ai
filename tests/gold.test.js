const test = require("node:test");
const assert = require("node:assert/strict");
const {
  loadGoldTasks,
  publicTask,
  validateSubmission,
  pickTask,
  reviewerQuality
} = require("../backend/gold");

test("loads the repository gold dataset", async () => {
  const tasks = await loadGoldTasks();
  assert.equal(tasks.length, 30);
  assert.equal(tasks[0].gold_evaluation_id, "GOLD-0001");
  assert.equal(tasks[29].gold_evaluation_id, "GOLD-0030");
});

test("publicTask exposes only reviewer-safe task fields", async () => {
  const tasks = await loadGoldTasks();
  const task = publicTask(tasks[0]);
  assert.deepEqual(task, {
    gold_evaluation_id: "GOLD-0001",
    prompt: "What is two plus two?",
    response_a: "Two plus two equals four.",
    response_b: "Two plus two equals five."
  });
  assert.equal(Object.hasOwn(task, "preferred_response"), false);
  assert.equal(Object.hasOwn(task, "reason"), false);
});

test("validates calibration submission requirements", () => {
  assert.deepEqual(validateSubmission(null), [
    "gold_evaluation_id is required",
    "preferred_response must be A, B, or Tie"
  ]);
  assert.deepEqual(validateSubmission({ gold_evaluation_id: "GOLD-0001", preferred_response: "A" }), []);
  assert.ok(validateSubmission({ gold_evaluation_id: "GOLD-0001", preferred_response: "C" }).includes("preferred_response must be A, B, or Tie"));
});

test("pickTask excludes attempted tasks when alternatives exist", async () => {
  const tasks = await loadGoldTasks();
  const selected = pickTask(tasks, "reviewer-1", ["GOLD-0001", "GOLD-0002"]);
  assert.ok(tasks.some(task => task.gold_evaluation_id === selected.gold_evaluation_id));
  assert.notEqual(selected.gold_evaluation_id, "GOLD-0001");
  assert.notEqual(selected.gold_evaluation_id, "GOLD-0002");
});

test("pickTask returns null for an empty task set", () => {
  assert.equal(pickTask([], "reviewer-1", []), null);
});

test("pickTask falls back to the full task pool when every task is excluded", async () => {
  const tasks = await loadGoldTasks();
  const excluded = tasks.map(task => task.gold_evaluation_id);
  const selected = pickTask(tasks, "reviewer-1", excluded);
  assert.ok(tasks.some(task => task.gold_evaluation_id === selected.gold_evaluation_id));
});

test("returns insufficient quality for a reviewer with no calibration attempts", async () => {
  const result = await reviewerQuality("test-reviewer-with-no-attempts");
  assert.equal(result.reviewer_id, "test-reviewer-with-no-attempts");
  assert.equal(result.calibration_attempts, 0);
  assert.equal(result.correct, 0);
  assert.equal(result.accuracy, null);
  assert.equal(result.status, "insufficient");
});
