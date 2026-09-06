const test = require("node:test");
const assert = require("node:assert/strict");
const { evaluateRecord, filterDataset } = require("../backend/quality-filter");

const record = { id: "MJ-1", prompt: "Question", response_a: "Answer A", response_b: "Answer B", preferred_response: "A", verified: false, fingerprint: "abc" };
const review = { preferred_response: "A", accuracy_a: 5, accuracy_b: 4, relevance_a: 5, relevance_b: 4, clarity_a: 5, clarity_b: 4, safety_a: 5, safety_b: 4 };

test("excludes records without enough reviews by default", () => {
  const decision = evaluateRecord(record, [review]);
  assert.equal(decision.included, false);
  assert.ok(decision.reasons.includes("insufficient_reviews"));
});

test("includes a record with two strong agreeing reviews", () => {
  const result = filterDataset([record], new Map([["MJ-1", [review, { ...review }]]]), { requireHumanVerified: false });
  assert.equal(result.summary.included_count, 1);
  assert.equal(result.records[0].id, "MJ-1");
});

test("excludes low-agreement reviews", () => {
  const result = filterDataset([record], new Map([["MJ-1", [review, { ...review, preferred_response: "B" }]]]), { requireHumanVerified: false });
  assert.equal(result.summary.excluded_count, 1);
  assert.ok(result.decisions[0].reasons.includes("low_preference_agreement"));
});

test("can require human verification", () => {
  const result = filterDataset([record], new Map([["MJ-1", [review, { ...review }]]]), { requireHumanVerified: true });
  assert.equal(result.records.length, 0);
  assert.ok(result.decisions[0].reasons.includes("not_human_verified"));
});
