const crypto = require("crypto");
const db = require("./db");

function configured() {
  return db.isConfigured();
}

function hashKey(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function generateApiKey(prefix = "mj_live") {
  return `${prefix}_${crypto.randomBytes(32).toString("hex")}`;
}

async function createBuyerKey({ buyerId, name, scopes = ["dataset:read"], dailyLimit = 1000 }) {
  if (!configured()) throw new Error("Buyer API requires PostgreSQL");
  const rawKey = generateApiKey();
  const keyHash = hashKey(rawKey);
  const result = await db.query(
    `INSERT INTO buyer_api_keys (id, buyer_id, name, key_prefix, key_hash, scopes, daily_limit)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, buyer_id, name, key_prefix, scopes, daily_limit, created_at`,
    [crypto.randomUUID(), buyerId, name || "Dataset access", rawKey.slice(0, 12), keyHash, scopes, dailyLimit]
  );
  return { ...result.rows[0], api_key: rawKey };
}

async function authenticate(rawKey) {
  if (!configured() || typeof rawKey !== "string" || !rawKey.startsWith("mj_live_")) return null;
  const keyHash = hashKey(rawKey);
  const result = await db.query(
    `SELECT id, buyer_id, name, scopes, daily_limit, requests_today, day_started_at, revoked_at
       FROM buyer_api_keys
      WHERE key_hash=$1`, [keyHash]
  );
  const key = result.rows[0];
  if (!key || key.revoked_at) return null;
  const now = new Date();
  const started = new Date(key.day_started_at);
  let requestsToday = Number(key.requests_today);
  if (started.toISOString().slice(0, 10) !== now.toISOString().slice(0, 10)) {
    requestsToday = 0;
    await db.query(`UPDATE buyer_api_keys SET requests_today=0, day_started_at=CURRENT_TIMESTAMP WHERE id=$1`, [key.id]);
  }
  if (requestsToday >= Number(key.daily_limit)) return { ...key, rate_limited: true };
  await db.query(`UPDATE buyer_api_keys SET requests_today=requests_today+1, last_used_at=CURRENT_TIMESTAMP WHERE id=$1`, [key.id]);
  return { ...key, requests_today: requestsToday + 1, rate_limited: false };
}

function requireScope(scope) {
  return async (req, res, next) => {
    const rawKey = req.get("x-api-key") || (req.get("authorization") || "").replace(/^Bearer\s+/i, "");
    try {
      const buyer = await authenticate(rawKey);
      if (!buyer) return res.status(401).json({ error: "Valid buyer API key required" });
      if (buyer.rate_limited) return res.status(429).json({ error: "Daily API limit reached", daily_limit: buyer.daily_limit });
      if (!buyer.scopes.includes(scope)) return res.status(403).json({ error: `API scope required: ${scope}` });
      req.buyer = buyer;
      next();
    } catch (error) {
      console.error(error);
      res.status(503).json({ error: "Buyer API unavailable" });
    }
  };
}

async function recordDownload({ buyerId, apiKeyId, version, format, recordCount, ip }) {
  await db.query(
    `INSERT INTO buyer_access_log (id,buyer_id,api_key_id,action,version,format,record_count,ip_address)
     VALUES ($1,$2,$3,'dataset_download',$4,$5,$6,$7)`,
    [crypto.randomUUID(), buyerId, apiKeyId, version, format, recordCount, ip || null]
  );
}

module.exports = { createBuyerKey, authenticate, requireScope, recordDownload };
