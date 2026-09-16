const fs = require("fs");
const path = require("path");
const { ENV_KEYS } = require("../backend/config");

const examplePath = path.join(__dirname, "..", "backend", ".env.example");
const example = fs.readFileSync(examplePath, "utf8");
const documented = new Set(
  example
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("#") && line.includes("="))
    .map(line => line.slice(0, line.indexOf("=")).trim())
    .filter(Boolean)
);

const missing = ENV_KEYS.filter(key => !documented.has(key));
if (missing.length) {
  console.error(`Environment manifest is missing: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`Environment manifest OK: ${ENV_KEYS.length} config variables documented in backend/.env.example`);
