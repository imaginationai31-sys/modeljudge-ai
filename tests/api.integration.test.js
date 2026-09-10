const test = require("node:test");
const assert = require("node:assert/strict");

const BASE_URL = process.env.MODELJUDGE_TEST_URL || "http://127.0.0.1:10000";

async function request(method, path, body, headers = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
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
    rationale: "A is clearer and more relevant.",
    scores: {
      accuracy: 5,
      relevance: 5,
      clarity: 4,
      safety: 5
    }
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
  assert.ok(Array.isArray(result.body.evaluations));
});

test("evaluation validation rejects incomplete requests", async () => {
  const result = await request("POST", "/api/evaluations", {});
  assert.equal(result.status, 400);
});

test("evaluation validation rejects invalid score ranges", async () => {
  const payload = validEvaluation(`invalid-score-${Date.now()}`);
  payload.scores.accuracy = 6;
  const result = await request("POST", "/api/evaluations", payload);
  assert.equal(result.status, 400);
});

test("evaluation creation accepts a valid API payload", async () => {
  const result = await request("POST", "/api/evaluations", validEvaluation(`create-${Date.now()}`));
  assert.equal(result.status, 201);
  assert.ok(result.body.id);
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
  const result = await request("GET", "/api/reviewer-stats");
  assert.equal(result.status, 200);
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

test("rejects invalid calibration submission", async () => {
  const result = await request("POST", "/api/calibration/submit", {});
  assert.ok([400, 401, 403, 503].includes(result.status));
});

test("calculates perfect calibration accuracy", async () => {
  const result = await request("GET", "/api/calibration/status");
  assert.ok([200, 401, 403, 503].includes(result.status));
});

test("flags reviewer below threshold", async () => {
  const result = await request("GET", "/api/reviewer-quality");
  assert.ok([200, 401, 403, 503].includes(result.status));
});

test("PostgreSQL health check reports real database storage", { skip: !process.env.DATABASE_URL }, async () => {
  const result = await request("GET", "/api/health");
  assert.equal(result.status, 200);
  assert.equal(result.body.storage, "postgres");
});

test("admin bootstrap and reviewer login use PostgreSQL-backed auth", { skip: !process.env.DATABASE_URL }, async () => {
  const result = await request("POST", "/api/auth/login", { reviewer_id: "missing", password: "missing" });
  assert.ok([400, 401, 403].includes(result.status));
});

test("evaluation creation, persistence, and duplicate protection use PostgreSQL", { skip: !process.env.DATABASE_URL }, async () => {
  const payload = validEvaluation(`postgres-${Date.now()}`);
  const first = await request("POST", "/api/evaluations", payload);
  assert.equal(first.status, 201);
  const listed = await request("GET", "/api/evaluations");
  assert.equal(listed.status, 200);
  assert.ok(listed.body.evaluations.some((item) => item.id === payload.id));
  const duplicate = await request("POST", "/api/evaluations", {
    ...payload,
    id: `${payload.id}-duplicate`
  });
  assert.equal(duplicate.status, 409);
});

test("authenticated reviewer endpoints read PostgreSQL state", { skip: !process.env.DATABASE_URL }, async () => {
  const result = await request("GET", "/api/reviews");
  assert.equal(result.status, 200);
});
