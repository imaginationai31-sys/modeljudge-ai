const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateReviewerControl, canSubmitReview } = require("../backend/reviewer-quality-control");

test("insufficient calibration requires calibration", () => {
  const result = calculateReviewerControl({ reviewer_id: "r1", calibration_attempts: 2, calibration_accuracy: 1, consistency_score: 1 });
  assert.equal(result.status, "insufficient");
  assert.equal(result.action, "calibrate");
  assert.equal(canSubmitReview(result), false);
});

test("strong reviewer remains active", () => {
  const result = calculateReviewerControl({ reviewer_id: "r2", calibration_attempts: 5, calibration_accuracy: 1, consistency_score: 1 });
  assert.equal(result.status, "active");
  assert.equal(canSubmitReview(result), true);
});

test("weak reviewer is suspended", () => {
  const result = calculateReviewerControl({ reviewer_id: "r3", calibration_attempts: 5, calibration_accuracy: 0.4, consistency_score: 0.4 });
  assert.equal(result.status, "suspended");
  assert.equal(result.action, "recalibrate");
  assert.equal(canSubmitReview(result), false);
});

test("warning reviewer can continue temporarily", () => {
  const result = calculateReviewerControl({ reviewer_id: "r4", calibration_attempts: 5, calibration_accuracy: 0.7, consistency_score: 0.9 });
  assert.equal(result.status, "warning");
  assert.equal(canSubmitReview(result), true);
});

test("repeated failures trigger suspension", () => {
  const result = calculateReviewerControl({ reviewer_id: "r5", calibration_attempts: 4, calibration_accuracy: 0.9, consistency_score: 0.9, consecutive_calibration_failures: 3 });
  assert.equal(result.status, "suspended");
  assert.ok(result.reasons.includes("consecutive_calibration_failures"));
});
