const test = require("node:test");
const assert = require("node:assert/strict");

const BASE_URL = process.env.MODELJUDGE_TEST_URL || "http://127.0.0.1:10000";

async function request(method, path, body, headers = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const text = await response.text();
  let parsed = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  return { status: response.status, headers: response.headers, body: parsed };
}

function validEvaluation(id = Date.now()) {
  return {
    id: `integration-${id}`,
    prompt: `Integration test prompt ${id}`,
    response_a: `Response A ${id}`,
    response_b: `Response B ${id}`,
    preferred_response: "A",
    accuracy_a: 5,
    accuracy_b: 4,
    relevance_a: 5,
    relevance_b: 4,
    clarity_a: 4,
    clarity_b: 4,
    safety_a: 5,
    safety_b: 5,
    reason: "Response A is clearer and more relevant."
  };
}

test("health endpoint reports service metadata", async () => {
  const result = await request("GET", "/api/health");
  assert.equal(result.status, 200);
  assert.equal(result.body.service, "modeljudge-api");
  assert.equal(result.body.status, "ok");
});

test("health endpoint exposes storage and capability flags", async () => {
  const result = await request("GET", "/api/health");
  assert.equal(result.status, 200);
  assert.ok(["postgres", "jsonl"].includes(result.body.storage));
  assert.equal(typeof result.body.authentication, "string");
});

test("evaluations endpoint returns a stable collection shape", async () => {
  const result = await request("GET", "/api/evaluations");
  assert.equal(result.status, 200);
  assert.equal(typeof result.body.count, "number");
  assert.ok(Array.isArray(result.body.records));
});

test("evaluation validation rejects incomplete requests", async () => {
  const result = await request("POST", "/api/evaluations", {});
  assert.equal(result.status, 400);
});

test("evaluation validation rejects invalid score ranges", async () => {
  const payload = validEvaluation(`invalid-score-${Date.now()}`);
  payload.accuracy_a = 6;
  const result = await request("POST", "/api/evaluations", payload);
  assert.equal(result.status, 400);
});

test("evaluation creation accepts a valid API payload", async () => {
  const result = await request("POST", "/api/evaluations", validEvaluation(`create-${Date.now()}`));
  assert.equal(result.status, 201);
  assert.ok(result.body.record.id);
});

test("duplicate evaluation pairs are rejected", async () => {
  const payload = validEvaluation(`duplicate-${Date.now()}`);
  const first = await request("POST", "/api/evaluations", payload);
  assert.equal(first.status, 201);
  const second = await request("POST", "/api/evaluations", {
    ...payload,
    id: `${payload.id}-second`
  });
  assert.equal(second.status, 409);
  assert.equal(second.body.error, "Duplicate evaluation pair detected");
});

test("reviews endpoint returns a collection", async () => {
  const result = await request("GET", "/api/reviews");
  assert.equal(result.status, 200);
  assert.equal(typeof result.body.count, "number");
  assert.ok(Array.isArray(result.body.reviews));
});

test("review submission requires authenticated PostgreSQL mode", async () => {
  const result = await request("POST", "/api/reviews", {});
  assert.equal(result.status, 503);
  assert.equal(result.body.error, "Reviewer authentication requires PostgreSQL");
});

test("consensus endpoint returns an evaluation-scoped result", async () => {
  const result = await request("GET", "/api/reviews/consensus/does-not-exist");
  assert.equal(result.status, 200);
  assert.equal(result.body.evaluation_id, "does-not-exist");
  assert.equal(result.body.consensus_preference, null);
});

test("reviewer stats endpoint returns a stable collection shape", async () => {
  const result = await request("GET", "/api/reviewers/stats");
  assert.equal(result.status, 200);
  assert.equal(typeof result.body.reviewer_count, "number");
  assert.ok(Array.isArray(result.body.reviewers));
});

test("release endpoint exposes buyer-facing dataset metadata", async () => {
  const result = await request("GET", "/api/release");
  assert.equal(result.status, 200);
  assert.equal(typeof result.body.version, "string");
  assert.equal(typeof result.body.record_count, "number");
});

test("reliability endpoint returns a structured report", async () => {
  const result = await request("GET", "/api/reliability");
  assert.equal(result.status, 200);
  assert.equal(typeof result.body, "object");
});

test("CORS preflight is handled without invoking application routes", async () => {
  const result = await request("OPTIONS", "/api/evaluations", undefined, {
    origin: "http://localhost:8787",
    "access-control-request-method": "POST"
  });
  assert.equal(result.status, 204);
  assert.equal(result.body, null);
});

test("unknown API routes return JSON 404 responses", async () => {
  const result = await request("GET", "/api/does-not-exist");
  assert.equal(result.status, 404);
  assert.equal(result.body.error, "Not found");
});

test("gold submission requires authenticated PostgreSQL mode", async () => {
  const result = await request("POST", "/api/gold/submit", {});
  assert.equal(result.status, 503);
  assert.equal(result.body.error, "Reviewer authentication requires PostgreSQL");
});

test("gold quality status requires authenticated PostgreSQL mode", async () => {
  const result = await request("GET", "/api/gold/me");
  assert.equal(result.status, 503);
  assert.equal(result.body.error, "Reviewer authentication requires PostgreSQL");
});

test("reviewer quality endpoint requires authenticated PostgreSQL mode", async () => {
  const result = await request("GET", "/api/reviewers/me/quality");
  assert.equal(result.status, 503);
  assert.equal(result.body.error, "Reviewer authentication requires PostgreSQL");
});
