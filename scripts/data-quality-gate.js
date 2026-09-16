#!/usr/bin/env node

const fs = require("fs/promises");
const path = require("path");
const { validateText } = require("./data-quality");

const DATA_FILE = path.join(__dirname, "..", "data", "evaluations.jsonl");

async function runQualityGate(file = DATA_FILE) {
  let text;
  try {
    text = await fs.readFile(file, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return { valid: false, records: 0, errors: ["Dataset file not found"] };
    throw error;
  }
  return validateText(text);
}

if (require.main === module) {
  runQualityGate().then(result => {
    if (!result.valid) {
      console.error(`Data-quality gate failed: ${result.errors.length} error(s)`);
      console.error(result.errors.slice(0, 50).join("\n"));
      process.exitCode = 1;
      return;
    }
    console.log(`Data-quality gate passed: ${result.records} record(s)`);
  }).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { runQualityGate };
