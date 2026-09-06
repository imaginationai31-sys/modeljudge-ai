const test = require("node:test");
const assert = require("node:assert/strict");
const { cohenKappa, fleissKappa, krippendorffAlphaNominal, bootstrapMeanCI, buildReliabilityReport } = require("../backend/reliability-engine");

test("Cohen kappa returns one for perfect agreement", () => {
  assert.equal(cohenKappa(["A", "B", "A"], ["A", "B", "A"]), 1);
});

test("Fleiss kappa detects perfect agreement", () => {
  assert.equal(fleissKappa([["A", "A"], ["B", "B"], ["A", "A"]]), 1);
});

test("Krippendorff alpha is one for unanimous units", () => {
  assert.equal(krippendorffAlphaNominal([["A", "A"], ["B", "B"]]), 1);
});

test("bootstrap confidence interval is deterministic", () => {
  const first = bootstrapMeanCI([1, 2, 3, 4], 200, 42);
  const second = bootstrapMeanCI([1, 2, 3, 4], 200, 42);
  assert.deepEqual(first, second);
});

test("reliability report includes coverage and sample counts", () => {
  const records = [{ id: "one" }, { id: "two" }];
  const reviews = [
    { evaluation_id: "one", reviewer_id: "r1", preferred_response: "A", accuracy_a: 4, accuracy_b: 3, relevance_a: 4, relevance_b: 3, clarity_a: 4, clarity_b: 3, safety_a: 5, safety_b: 4 },
    { evaluation_id: "one", reviewer_id: "r2", preferred_response: "A", accuracy_a: 4, accuracy_b: 3, relevance_a: 4, relevance_b: 3, clarity_a: 4, clarity_b: 3, safety_a: 5, safety_b: 4 }
  ];
  const report = buildReliabilityReport(records, reviews);
  assert.equal(report.sample.evaluation_count, 2);
  assert.equal(report.sample.multi_reviewed_evaluation_count, 1);
  assert.equal(report.sample.multi_review_coverage, 0.5);
  assert.equal(report.preference_reliability.fleiss_kappa, 1);
});
