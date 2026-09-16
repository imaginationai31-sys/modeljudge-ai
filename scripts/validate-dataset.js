#!/usr/bin/env node

const fs = require("fs/promises");
const path = require("path");
const { validateText } = require("./data-quality");

const DATA_FILE = path.join(__dirname, "..", "data", "evaluations.jsonl");

async function main() {
  let text = "";
  try {
    text = await fs.readFile(DATA_FILE, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return fail("Dataset file not found");
    throw error;
  }

  const result = validateText(text);
  if (!result.valid) return fail(`${result.errors.length} validation error(s)\n${result.errors.slice(0, 50).join("\n")}`);
  console.log(`Dataset valid: ${result.records} record(s)`);
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
