const test = require("node:test");
const assert = require("node:assert/strict");
const { validateReview, buildConsensus, reviewerStats } = require("../backend/reviewer");

function review(id, preference) {
  return {
    evaluation_id: id,
    reviewer_id: `reviewer-${preference}`,
    preferred_response: preference,
    accuracy_a: 4, accuracy_b: 3, relevance_a: 5, relevance_b: 4,
    clarity_a: 4, clarity_b: 4, safety_a: 5, safety_b: 5,
    reason: "Response is more accurate and directly addresses the prompt."
  };
}

test("rejects incomplete reviewer submissions", () => {
  const errors = validateReview({ reviewer_id: "r1", evaluation_id: "MJ-000001", preferred_response: "X" });
  assert.ok(errors.length > 0);
});

test("calculates unanimous consensus", () => {
  const result = buildConsensus([review("MJ-1", "A"), review("MJ-1", "A"), review("MJ-1", "A")]);
  assert.equal(result.consensus_preference, "A");
  assert.equal(result.agreement_score, 1);
  assert.equal(result.unanimous, true);
  assert.equal(result.quality_flag, "pass");
});

test("flags split preference for review", () => {
  const result = buildConsensus([review("MJ-1", "A"), review("MJ-1", "B"), review("MJ-1", "Tie")]);
  assert.equal(result.agreement_score, 0.3333);
  assert.equal(result.quality_flag, "review");
});

test("groups reviewer statistics", () => {
  const result = reviewerStats([review("MJ-1", "A"), { ...review("MJ-2", "Tie"), reviewer_id: "reviewer-A" }]);
  assert.equal(result.length, 1);
  assert.equal(result[0].review_count, 2);
});
