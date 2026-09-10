const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const { EventEmitter } = require("node:events");
const { logger, requestLogger, sanitize } = require("../backend/logger");
const { captureException, ERROR_FILE } = require("../backend/error-tracker");

test("sanitize redacts sensitive fields recursively", () => {
  const value = sanitize({
    username: "reviewer",
    password: "secret",
    nested: { api_key: "hidden", safe: "ok" },
    items: [{ token: "hidden" }]
  });

  assert.deepEqual(value, {
    username: "reviewer",
    password: "[REDACTED]",
    nested: { api_key: "[REDACTED]", safe: "ok" },
    items: [{ token: "[REDACTED]" }]
  });
});

test("logger emits structured JSON and redacts secrets", () => {
  const originalLog = console.log;
  let output = "";
  console.log = line => { output = line; };

  try {
    logger.info("test_event", { request_id: "req-1", apiKey: "secret", value: 42 });
  } finally {
    console.log = originalLog;
  }

  const record = JSON.parse(output);
  assert.equal(record.service, "modeljudge-api");
  assert.equal(record.level, "info");
  assert.equal(record.message, "test_event");
  assert.equal(record.request_id, "req-1");
  assert.equal(record.apiKey, "[REDACTED]");
  assert.equal(record.value, 42);
  assert.match(record.timestamp, /^\d{4}-\d{2}-\d{2}T/);
});

test("request logger preserves supplied request IDs and emits HTTP metadata", () => {
  const originalLog = console.log;
  const records = [];
  console.log = line => records.push(JSON.parse(line));

  const req = {
    method: "GET",
    path: "/api/health",
    get(name) { return name === "x-request-id" ? "client-request-1" : undefined; }
  };
  const res = new EventEmitter();
  res.statusCode = 200;
  res.setHeader = (name, value) => { res[name] = value; };
  let nextCalled = false;

  try {
    requestLogger(req, res, () => { nextCalled = true; });
    res.emit("finish");
  } finally {
    console.log = originalLog;
  }

  assert.equal(nextCalled, true);
  assert.equal(req.requestId, "client-request-1");
  assert.equal(res["X-Request-ID"], "client-request-1");
  assert.equal(records.length, 1);
  assert.equal(records[0].message, "http_request");
  assert.equal(records[0].request_id, "client-request-1");
  assert.equal(records[0].method, "GET");
  assert.equal(records[0].path, "/api/health");
  assert.equal(records[0].status, 200);
  assert.equal(typeof records[0].duration_ms, "number");
});

test("error tracker captures errors as structured JSONL", () => {
  const marker = `observability-test-${Date.now()}-${process.pid}`;
  const error = new Error(marker);
  const event = captureException(error, { source: "test", request_id: marker });

  assert.equal(event.error.name, "Error");
  assert.equal(event.error.message, marker);
  assert.equal(event.context.request_id, marker);
  assert.equal(fs.existsSync(ERROR_FILE), true);

  const lines = fs.readFileSync(ERROR_FILE, "utf8").trim().split("\n");
  const record = JSON.parse(lines.at(-1));
  assert.equal(record.error.message, marker);
  assert.equal(record.context.source, "test");
});
