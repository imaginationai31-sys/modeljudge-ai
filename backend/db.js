const { Pool } = require("pg");

const pool = process.env.DATABASE_URL ? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false }
}) : null;

function isConfigured() { return Boolean(pool); }

async function query(text, params) {
  if (!pool) throw new Error("DATABASE_URL is not configured");
  return pool.query(text, params);
}

async function close() { if (pool) await pool.end(); }

module.exports = { isConfigured, query, close };
