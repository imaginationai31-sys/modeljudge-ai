const test = require("node:test");
const assert = require("node:assert/strict");
const { mock } = require("node:test");
const crypto = require("crypto");
const db = require("../backend/db");
const buyers = require("../backend/buyer-management");

function configuredDb(queryImpl) {
  mock.method(db, "isConfigured", () => true);
  mock.method(db, "query", queryImpl);
}

test("buyer management rejects operations when PostgreSQL is not configured", async () => {
  mock.method(db, "isConfigured", () => false);
  await assert.rejects(() => buyers.getBuyer("buyer-1"), /Buyer management requires PostgreSQL/);
});

test("createBuyer accepts camelCase and returns inserted buyer", async () => {
  configuredDb(async (sql, params) => {
    assert.match(sql, /INSERT INTO buyer_accounts/);
    assert.deepEqual(params, ["buyer-1", "Acme AI", "ops@example.com", "notes"]);
    return { rows: [{ buyer_id: "buyer-1", company_name: "Acme AI" }] };
  });
  const result = await buyers.createBuyer({
    buyerId: "buyer-1",
    companyName: "Acme AI",
    contactEmail: "ops@example.com",
    notes: "notes"
  });
  assert.equal(result.buyer_id, "buyer-1");
});

test("createBuyer accepts public snake_case fields and defaults optional values", async () => {
  configuredDb(async (_sql, params) => {
    assert.deepEqual(params, ["buyer-2", "Beta Labs", null, null]);
    return { rows: [{ buyer_id: "buyer-2" }] };
  });
  const result = await buyers.createBuyer({ buyer_id: "buyer-2", company_name: "Beta Labs" });
  assert.equal(result.buyer_id, "buyer-2");
});

test("createBuyer validates required buyer id and company name", async () => {
  mock.method(db, "isConfigured", () => true);
  await assert.rejects(() => buyers.createBuyer({ companyName: "Acme" }), /buyer_id is required/);
  await assert.rejects(() => buyers.createBuyer({ buyerId: "buyer-1" }), /company_name is required/);
});

test("listBuyers returns database rows", async () => {
  configuredDb(async (sql) => {
    assert.match(sql, /api_key_count/);
    return { rows: [{ buyer_id: "buyer-1", api_key_count: 2, active_api_key_count: 1 }] };
  });
  assert.deepEqual(await buyers.listBuyers(), [{ buyer_id: "buyer-1", api_key_count: 2, active_api_key_count: 1 }]);
});

test("getBuyer returns a buyer or null when absent", async () => {
  configuredDb(async (_sql, params) => {
    assert.deepEqual(params, ["buyer-1"]);
    return { rows: [{ buyer_id: "buyer-1" }] };
  });
  assert.deepEqual(await buyers.getBuyer("buyer-1"), { buyer_id: "buyer-1" });

  db.query.mock.mockImplementationOnce(async () => ({ rows: [] }));
  assert.equal(await buyers.getBuyer("missing"), null);
});

test("setBuyerStatus returns updated buyer or null", async () => {
  configuredDb(async (_sql, params) => {
    assert.deepEqual(params, ["buyer-1", "suspended"]);
    return { rows: [{ buyer_id: "buyer-1", status: "suspended" }] };
  });
  assert.deepEqual(await buyers.setBuyerStatus("buyer-1", "suspended"), { buyer_id: "buyer-1", status: "suspended" });

  db.query.mock.mockImplementationOnce(async () => ({ rows: [] }));
  assert.equal(await buyers.setBuyerStatus("missing", "active"), null);
});

test("listKeys returns buyer API keys", async () => {
  configuredDb(async (_sql, params) => {
    assert.deepEqual(params, ["buyer-1"]);
    return { rows: [{ id: "key-1", buyer_id: "buyer-1", revoked_at: null }] };
  });
  assert.deepEqual(await buyers.listKeys("buyer-1"), [{ id: "key-1", buyer_id: "buyer-1", revoked_at: null }]);
});

test("revokeKey returns revoked key and is idempotent", async () => {
  configuredDb(async (_sql, params) => {
    assert.deepEqual(params, ["key-1", "buyer-1"]);
    return { rows: [{ id: "key-1", buyer_id: "buyer-1", revoked_at: "2026-09-17" }] };
  });
  assert.equal((await buyers.revokeKey("key-1", "buyer-1")).id, "key-1");

  db.query.mock.mockImplementationOnce(async () => ({ rows: [] }));
  assert.equal(await buyers.revokeKey("missing", "buyer-1"), null);
});

test("rotateKey revokes the active key and returns a new secret", async () => {
  const queries = [];
  const client = {
    query: async (sql, params) => {
      queries.push([sql, params]);
      if (sql === "BEGIN" || sql === "COMMIT") return { rows: [] };
      if (sql === "ROLLBACK") return { rows: [] };
      if (/UPDATE buyer_api_keys/.test(sql)) return { rows: [{ name: "Primary", scopes: ["read"], daily_limit: 1000 }] };
      if (/INSERT INTO buyer_api_keys/.test(sql)) return { rows: [{ id: params[0], buyer_id: params[1], name: params[2], key_prefix: params[3], scopes: params[5], daily_limit: params[6], created_at: "2026-09-17" }] };
      throw new Error(`Unexpected query: ${sql}`);
    },
    release() {}
  };
  mock.method(db, "isConfigured", () => true);
  mock.method(db, "getPool", () => ({ connect: async () => client }));

  const result = await buyers.rotateKey("old-key", "buyer-1", "Rotated");
  assert.equal(result.name, "Rotated");
  assert.match(result.api_key, /^mj_live_[0-9a-f]{64}$/);
  assert.equal(result.key_prefix, result.api_key.slice(0, 12));
  assert.equal(result.api_key.length, 72);
  assert.equal(queries[0][0], "BEGIN");
  assert.equal(queries.at(-1)[0], "COMMIT");

  const insert = queries.find(([sql]) => /INSERT INTO buyer_api_keys/.test(sql));
  assert.equal(insert[1][4], crypto.createHash("sha256").update(result.api_key).digest("hex"));
});

test("rotateKey rolls back when the old key is missing or already revoked", async () => {
  const calls = [];
  const client = {
    query: async (sql) => {
      calls.push(sql);
      if (sql === "BEGIN") return { rows: [] };
      if (/UPDATE buyer_api_keys/.test(sql)) return { rows: [] };
      if (sql === "ROLLBACK") return { rows: [] };
      throw new Error(`Unexpected query: ${sql}`);
    },
    release() {}
  };
  mock.method(db, "isConfigured", () => true);
  mock.method(db, "getPool", () => ({ connect: async () => client }));
  assert.equal(await buyers.rotateKey("missing", "buyer-1"), null);
  assert.deepEqual(calls, ["BEGIN", calls[1], "ROLLBACK"]);
});

test("rotateKey rolls back and rethrows transaction errors", async () => {
  const calls = [];
  const client = {
    query: async (sql) => {
      calls.push(sql);
      if (sql === "BEGIN") return { rows: [] };
      if (/UPDATE buyer_api_keys/.test(sql)) return { rows: [{ name: "Primary", scopes: [], daily_limit: 10 }] };
      if (/INSERT INTO buyer_api_keys/.test(sql)) throw new Error("insert failed");
      if (sql === "ROLLBACK") return { rows: [] };
      throw new Error(`Unexpected query: ${sql}`);
    },
    release() {}
  };
  mock.method(db, "isConfigured", () => true);
  mock.method(db, "getPool", () => ({ connect: async () => client }));
  await assert.rejects(() => buyers.rotateKey("old-key", "buyer-1"), /insert failed/);
  assert.equal(calls.at(-1), "ROLLBACK");
});

test("usage returns aggregate and recent download data", async () => {
  const responses = [
    { rows: [{ total_downloads: 3, records_downloaded: "42", versions_downloaded: 2, last_download_at: "2026-09-17" }] },
    { rows: [{ version: "1.0.0", format: "jsonl", record_count: 20, created_at: "2026-09-17" }] }
  ];
  configuredDb(async (_sql, params) => {
    assert.deepEqual(params, ["buyer-1"]);
    return responses.shift();
  });
  assert.deepEqual(await buyers.usage("buyer-1"), {
    total_downloads: 3,
    records_downloaded: "42",
    versions_downloaded: 2,
    last_download_at: "2026-09-17",
    recent_downloads: [{ version: "1.0.0", format: "jsonl", record_count: 20, created_at: "2026-09-17" }]
  });
});

test("usage preserves empty recent-download results", async () => {
  const responses = [
    { rows: [{ total_downloads: 0, records_downloaded: "0", versions_downloaded: 0, last_download_at: null }] },
    { rows: [] }
  ];
  configuredDb(async () => responses.shift());
  const result = await buyers.usage("new-buyer");
  assert.deepEqual(result.recent_downloads, []);
  assert.equal(result.total_downloads, 0);
});
