const test = require("node:test");
const assert = require("node:assert/strict");
const { validateCalibrationSubmission, calculateCalibrationAccuracy, reviewerQualityStatus } = require("../backend/calibration");

test("rejects invalid calibration submission", () => {
  const errors = validateCalibrationSubmission({ reviewer_id: "r1" });
  assert.ok(errors.length > 0);
});

test("calculates perfect calibration accuracy", () => {
  const result = calculateCalibrationAccuracy([
    { expected: "A", actual: "A" },
    { expected: "B", actual: "B" },
    { expected: "Tie", actual: "Tie" }
  ]);
  assert.equal(result.correct, 3);
  assert.equal(result.accuracy, 1);
});

test("flags reviewer below threshold", () => {
  assert.equal(reviewerQualityStatus(0.6, 0.8), "REVIEW");
  assert.equal(reviewerQualityStatus(0.8, 0.8), "PASS");
});
