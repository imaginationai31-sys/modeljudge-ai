const fs = require("fs/promises");
const path = require("path");
const db = require("../backend/db");

async function migrate() {
  if (!db.isConfigured()) throw new Error("DATABASE_URL is required to run migrations");
  const dir = path.join(__dirname, "..", "backend", "migrations");
  const files = (await fs.readdir(dir)).filter(name => name.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = await fs.readFile(path.join(dir, file), "utf8");
    await db.query(sql);
    console.log(`Applied migration: ${file}`);
  }
  await db.close();
}

migrate().catch(async error => { console.error(error.message); await db.close(); process.exit(1); });
