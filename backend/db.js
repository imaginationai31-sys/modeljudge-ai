const { Pool } = require("pg");

const pool = process.env.DATABASE_URL ? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
  max: Number(process.env.DATABASE_POOL_MAX) || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
}) : null;

function isConfigured() { return Boolean(pool); }
function getPool() { if (!pool) throw new Error("DATABASE_URL is not configured"); return pool; }
async function query(text, params) { return getPool().query(text, params); }
async function close() { if (pool) await pool.end(); }

module.exports = { isConfigured, getPool, query, close };
