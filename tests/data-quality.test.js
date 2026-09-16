const test = require("node:test");
const assert = require("node:assert/strict");
const { validateText } = require("../scripts/data-quality");

function validRecord(overrides = {}) {
  return {
    id: "MJ-000001",
    prompt: "Explain recycling to a child.",
    response_a: "Recycling turns old things into new useful things.",
    response_b: "Recycling means throwing everything away.",
    preferred_response: "A",
    accuracy_a: 5,
    accuracy_b: 1,
    relevance_a: 5,
    relevance_b: 2,
    clarity_a: 5,
    clarity_b: 2,
    safety_a: 5,
    safety_b: 5,
    reason: "Response A is accurate, relevant, clear, and safe.",
    category: "Education",
    language: "en",
    verified: true,
    ...overrides
  };
}

function line(record) {
  return JSON.stringify(record);
}

test("accepts a valid evaluation record", () => {
  const result = validateText(line(validRecord()));
  assert.equal(result.valid, true);
  assert.equal(result.records, 1);
  assert.deepEqual(result.errors, []);
});

test("rejects invalid preference and score ranges", () => {
  const result = validateText(line(validRecord({ preferred_response: "C", safety_a: 6 })));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes("invalid preferred_response")));
  assert.ok(result.errors.some(error => error.includes("invalid safety_a")));
});

test("rejects duplicate ids and fingerprints", () => {
  const first = validRecord({ fingerprint: "same-content" });
  const second = validRecord({ id: "MJ-000002", fingerprint: "same-content" });
  const result = validateText(`${line(first)}\n${line(second)}`);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes("duplicate fingerprint")));
});

test("rejects missing required content and verification status", () => {
  const result = validateText(line(validRecord({ prompt: "", verified: "yes" })));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes("missing prompt")));
  assert.ok(result.errors.some(error => error.includes("invalid verified")));
});

test("rejects malformed JSON without stopping subsequent validation", () => {
  const result = validateText(`not-json\n${line(validRecord({ id: "MJ-000002" }))}`);
  assert.equal(result.valid, false);
  assert.equal(result.records, 2);
  assert.ok(result.errors.some(error => error.includes("invalid JSON")));
});
