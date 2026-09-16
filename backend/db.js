const { Pool } = require("pg");
const { getConfig } = require("./config");

const config = getConfig();
const pool = config.databaseUrl ? new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
  max: config.databasePoolMax,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  allowExitOnIdle: true
}) : null;

if (pool) {
  pool.on("error", error => {
    console.error("Unexpected PostgreSQL pool error:", error);
  });
}

function isConfigured() { return Boolean(pool); }
function getPool() { if (!pool) throw new Error("DATABASE_URL is not configured"); return pool; }
async function query(text, params) { return getPool().query(text, params); }
async function close() { if (pool) await pool.end(); }

module.exports = { isConfigured, getPool, query, close };
