const crypto = require("crypto");
const db = require("./db");

const ITERATIONS = 210000;
const KEYLEN = 32;
const DIGEST = "sha256";
const SESSION_DAYS = 7;

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.pbkdf2(password, salt, ITERATIONS, KEYLEN, DIGEST, (error, derived) => {
      if (error) return reject(error);
      resolve(`pbkdf2$${ITERATIONS}$${salt}$${derived.toString("hex")}`);
    });
  });
}

function verifyPassword(password, stored) {
  return new Promise((resolve, reject) => {
    const [algorithm, iterations, salt, expected] = String(stored).split("$");
    if (algorithm !== "pbkdf2" || !iterations || !salt || !expected) return resolve(false);
    crypto.pbkdf2(password, salt, Number(iterations), KEYLEN, DIGEST, (error, derived) => {
      if (error) return reject(error);
      const actual = Buffer.from(derived.toString("hex"), "hex");
      const target = Buffer.from(expected, "hex");
      resolve(actual.length === target.length && crypto.timingSafeEqual(actual, target));
    });
  });
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function createAccount({ reviewerId, password, role = "reviewer" }) {
  if (!db.isConfigured()) throw new Error("Authentication requires PostgreSQL");
  if (!/^[A-Za-z0-9._-]{3,64}$/.test(reviewerId)) throw new Error("reviewerId must be 3-64 characters using letters, numbers, dot, underscore, or hyphen");
  if (typeof password !== "string" || password.length < 12) throw new Error("password must contain at least 12 characters");
  if (!["reviewer", "admin"].includes(role)) throw new Error("invalid role");
  const passwordHash = await hashPassword(password);
  const account = { id: `ACC-${crypto.randomUUID()}`, reviewer_id: reviewerId, password_hash: passwordHash, role };
  await db.query("INSERT INTO reviewer_accounts (id,reviewer_id,password_hash,role) VALUES ($1,$2,$3,$4)", [account.id, account.reviewer_id, account.password_hash, account.role]);
  return { id: account.id, reviewer_id: account.reviewer_id, role: account.role };
}

async function login(reviewerId, password) {
  if (!db.isConfigured()) throw new Error("Authentication requires PostgreSQL");
  const result = await db.query("SELECT * FROM reviewer_accounts WHERE reviewer_id = $1 AND active = TRUE LIMIT 1", [reviewerId]);
  const account = result.rows[0];
  if (!account || !(await verifyPassword(password, account.password_hash))) return null;
  const token = crypto.randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.query("INSERT INTO reviewer_sessions (id,reviewer_account_id,token_hash,expires_at) VALUES ($1,$2,$3,$4)", [`SES-${crypto.randomUUID()}`, account.id, hashToken(token), expires.toISOString()]);
  await db.query("UPDATE reviewer_accounts SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1", [account.id]);
  return { token, expires_at: expires.toISOString(), reviewer_id: account.reviewer_id, role: account.role };
}

async function authenticate(token) {
  if (!db.isConfigured() || !token) return null;
  const result = await db.query(`SELECT a.id, a.reviewer_id, a.role FROM reviewer_sessions s JOIN reviewer_accounts a ON a.id = s.reviewer_account_id WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > CURRENT_TIMESTAMP AND a.active = TRUE LIMIT 1`, [hashToken(token)]);
  return result.rows[0] || null;
}

async function revoke(token) {
  if (!db.isConfigured() || !token) return;
  await db.query("UPDATE reviewer_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = $1", [hashToken(token)]);
}

function bearerToken(req) {
  const header = req.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : null;
}

async function requireAuth(req, res, next) {
  try {
    if (!db.isConfigured()) return res.status(503).json({ error: "Reviewer authentication requires PostgreSQL" });
    const account = await authenticate(bearerToken(req));
    if (!account) return res.status(401).json({ error: "Authentication required" });
    req.auth = account;
    next();
  } catch (error) {
    console.error(error);
    res.status(503).json({ error: "Authentication service unavailable" });
  }
}

module.exports = { hashPassword, verifyPassword, createAccount, login, authenticate, revoke, bearerToken, requireAuth };
