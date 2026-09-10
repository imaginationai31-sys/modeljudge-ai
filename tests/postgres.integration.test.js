const test = require("node:test");
const assert = require("node:assert/strict");

const enabled = Boolean(process.env.DATABASE_URL);
const PORT = 18081;
let server;

function request(method, pathname, body, headers = {}) {
  return fetch(`http://127.0.0.1:${PORT}${pathname}`, {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  }).then(async response => ({
    status: response.status,
    headers: response.headers,
    body: await response.json()
  }));
}

const evaluationId = `PG-IT-${Date.now()}`;
const reviewerId = `pg-reviewer-${Date.now()}`;
const password = "PostgresIntegration!2026";
const bootstrapToken = process.env.ADMIN_BOOTSTRAP_TOKEN || "ci-postgres-bootstrap-token";

function validEvaluation(id = evaluationId) {
  return {
    id,
    prompt: "PostgreSQL integration test prompt",
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
  if (!enabled) return;
  process.env.ADMIN_BOOTSTRAP_TOKEN = bootstrapToken;
  process.env.DATABASE_SSL = "false";
  const app = require("../backend/server");
  server = app.listen(PORT);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
});

test.after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
});

test("PostgreSQL health check reports real database storage", { skip: !enabled }, async () => {
  const result = await request("GET", "/api/health");
  assert.equal(result.status, 200);
  assert.equal(result.body.status, "ok");
  assert.equal(result.body.storage, "postgres");
  assert.equal(result.body.authentication, "enabled");
  assert.equal(result.body.buyer_api, "enabled");
});

test("admin bootstrap and reviewer login use PostgreSQL-backed auth", { skip: !enabled }, async () => {
  const created = await request("POST", "/api/auth/accounts", {
    reviewer_id: reviewerId,
    password,
    role: "reviewer"
  }, { "x-admin-bootstrap-token": bootstrapToken });
  assert.equal(created.status, 201);
  assert.equal(created.body.reviewer_id, reviewerId);

  const login = await request("POST", "/api/auth/login", {
    reviewer_id: reviewerId,
    password
  });
  assert.equal(login.status, 200);
  assert.ok(login.body.token);
  assert.equal(login.body.reviewer_id, reviewerId);
  assert.equal(login.body.role, "reviewer");

  const me = await request("GET", "/api/auth/me", undefined, {
    authorization: `Bearer ${login.body.token}`
  });
  assert.equal(me.status, 200);
  assert.equal(me.body.reviewer_id, reviewerId);
  assert.equal(me.body.role, "reviewer");
});

test("evaluation creation, persistence, and duplicate protection use PostgreSQL", { skip: !enabled }, async () => {
  const created = await request("POST", "/api/evaluations", validEvaluation());
  assert.equal(created.status, 201);
  assert.equal(created.body.record.id, evaluationId);
  assert.equal(created.body.record.verified, false);

  const listed = await request("GET", `/api/evaluations?limit=500`);
  assert.equal(listed.status, 200);
  const stored = listed.body.records.find(record => record.id === evaluationId);
  assert.ok(stored);
  assert.equal(stored.prompt, "PostgreSQL integration test prompt");
  assert.equal(stored.dataset_version, created.body.record.dataset_version);

  const duplicate = await request("POST", "/api/evaluations", {
    ...validEvaluation(),
    id: `${evaluationId}-DUPLICATE`
  });
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.error, "Duplicate evaluation pair detected");
});

test("authenticated reviewer endpoints read PostgreSQL state", { skip: !enabled }, async () => {
  const login = await request("POST", "/api/auth/login", {
    reviewer_id: reviewerId,
    password
  });
  assert.equal(login.status, 200);
  const token = login.body.token;

  const quality = await request("GET", "/api/reviewers/me/quality", undefined, {
    authorization: `Bearer ${token}`
  });
  assert.equal(quality.status, 200);
  assert.equal(quality.body.reviewer_id, reviewerId);

  const history = await request("GET", "/api/reviewers/me/history", undefined, {
    authorization: `Bearer ${token}`
  });
  assert.equal(history.status, 200);
  assert.equal(history.body.reviewer_id, reviewerId);
  assert.ok(Array.isArray(history.body.history));
});
