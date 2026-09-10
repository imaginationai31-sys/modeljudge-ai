const test = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const PORT = 18080;
let processHandle;

function request(method, pathname, body) {
  return fetch(`http://127.0.0.1:${PORT}${pathname}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined
  }).then(async response => ({
    status: response.status,
    headers: response.headers,
    body: await response.json()
  }));
}

async function waitForServer(timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const result = await request("GET", "/api/health");
      if (result.status === 200 || result.status === 503) return result;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error("Integration server did not become ready in time");
}

function validEvaluation(id = `IT-${Date.now()}`) {
  return {
    id,
    prompt: "Integration test prompt",
    response_a: "A complete answer with useful detail.",
    response_b: "Another complete answer with useful detail.",
    preferred_response: "A",
    accuracy_a: 5,
    accuracy_b: 4,
    relevance_a: 5,
    relevance_b: 4,
    clarity_a: 4,
    clarity_b: 4,
    safety_a: 5,
    safety_b: 5,
    reason: "Response A is more accurate and directly addresses the prompt."
  };
}

test.before(async () => {
  processHandle = spawn(process.execPath, [path.join(ROOT, "scripts", "start.js")], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), DATABASE_URL: "" },
    stdio: "ignore"
  });
  await waitForServer();
});

test.after(() => {
  if (processHandle && !processHandle.killed) processHandle.kill("SIGTERM");
});

test("health endpoint reports service metadata", async () => {
  const result = await request("GET", "/api/health");
  assert.ok([200, 503].includes(result.status));
  assert.equal(result.body.service, "modeljudge-api");
  assert.ok(result.body.version);
});

test("health endpoint exposes storage and capability flags", async () => {
  const result = await request("GET", "/api/health");
  if (result.status === 200) {
    assert.equal(result.body.storage, "jsonl");
    assert.equal(result.body.authentication, "requires-postgres");
    assert.equal(result.body.gold_calibration, "enabled");
    assert.equal(result.body.reliability_reporting, "enabled");
  }
});

test("evaluations endpoint returns a stable collection shape", async () => {
  const result = await request("GET", "/api/evaluations?limit=5");
  assert.equal(result.status, 200);
  assert.equal(typeof result.body.count, "number");
  assert.ok(Array.isArray(result.body.records));
  assert.ok(result.body.records.length <= 5);
});

test("evaluation validation rejects incomplete requests", async () => {
  const result = await request("POST", "/api/evaluations", { prompt: "only prompt" });
  assert.equal(result.status, 400);
  assert.equal(result.body.error, "Validation failed");
  assert.ok(Array.isArray(result.body.errors));
  assert.ok(result.body.errors.length > 1);
});

test("evaluation validation rejects invalid score ranges", async () => {
  const body = validEvaluation();
  body.accuracy_a = 9;
  const result = await request("POST", "/api/evaluations", body);
  assert.equal(result.status, 400);
  assert.ok(result.body.errors.some(error => error.includes("accuracy_a")));
});

test("evaluation creation accepts a valid API payload", async () => {
  const result = await request("POST", "/api/evaluations", validEvaluation());
  assert.equal(result.status, 201);
  assert.equal(result.body.message, "Evaluation saved");
  assert.equal(result.body.record.preferred_response, "A");
  assert.equal(result.body.record.verified, false);
  assert.ok(result.body.record.fingerprint);
});

test("duplicate evaluation pairs are rejected", async () => {
  const body = validEvaluation(`IT-DUP-${Date.now()}`);
  const first = await request("POST", "/api/evaluations", body);
  assert.equal(first.status, 201);
  const second = await request("POST", "/api/evaluations", { ...body, id: `IT-DUP-SECOND-${Date.now()}` });
  assert.equal(second.status, 409);
  assert.equal(second.body.error, "Duplicate evaluation pair detected");
  assert.ok(second.body.fingerprint);
});

test("reviews endpoint returns a collection", async () => {
  const result = await request("GET", "/api/reviews");
  assert.equal(result.status, 200);
  assert.equal(typeof result.body.count, "number");
  assert.ok(Array.isArray(result.body.reviews));
});

test("review submission requires authentication", async () => {
  const result = await request("POST", "/api/reviews", {});
  assert.equal(result.status, 401);
  assert.equal(typeof result.body.error, "string");
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
  assert.equal(result.body.format, "JSONL");
  assert.equal(typeof result.body.record_count, "number");
  assert.equal(typeof result.body.human_verification_rate, "number");
  assert.equal(typeof result.body.duplicate_rate, "number");
});

test("reliability endpoint returns a structured report", async () => {
  const result = await request("GET", "/api/reliability");
  assert.equal(result.status, 200);
  assert.equal(typeof result.body, "object");
});

test("CORS preflight is handled without invoking application routes", async () => {
  const result = await request("OPTIONS", "/api/evaluations");
  assert.equal(result.status, 204);
  assert.ok(result.headers.get("access-control-allow-methods"));
});

test("unknown API routes return JSON 404 responses", async () => {
  const result = await request("GET", "/api/does-not-exist");
  assert.equal(result.status, 404);
  assert.equal(result.body.error, "Not found");
});
