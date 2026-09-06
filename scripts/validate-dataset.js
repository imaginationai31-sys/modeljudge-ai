#!/usr/bin/env node

const fs = require("fs/promises");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "data", "evaluations.jsonl");
const required = ["id", "prompt", "response_a", "response_b", "preferred_response", "reason", "category", "language"];
const scoreFields = ["accuracy_a", "accuracy_b", "relevance_a", "relevance_b", "clarity_a", "clarity_b", "safety_a", "safety_b"];

async function main() {
  let text = "";
  try { text = await fs.readFile(DATA_FILE, "utf8"); }
  catch (error) { if (error.code === "ENOENT") return fail("Dataset file not found"); throw error; }

  const lines = text.split("\n").filter(Boolean);
  const errors = [];
  const ids = new Set();
  const fingerprints = new Set();

  lines.forEach((line, index) => {
    let r;
    try { r = JSON.parse(line); }
    catch { errors.push(`line ${index + 1}: invalid JSON`); return; }

    for (const field of required) if (typeof r[field] !== "string" || !r[field].trim()) errors.push(`line ${index + 1}: missing ${field}`);
    if (!["A", "B", "Tie"].includes(r.preferred_response)) errors.push(`line ${index + 1}: invalid preferred_response`);
    if ((r.reason || "").trim().length < 10) errors.push(`line ${index + 1}: reason is too short`);
    for (const field of scoreFields) if (!Number.isInteger(r[field]) || r[field] < 1 || r[field] > 5) errors.push(`line ${index + 1}: invalid ${field}`);
    if (ids.has(r.id)) errors.push(`line ${index + 1}: duplicate id ${r.id}`);
    ids.add(r.id);
    if (r.fingerprint) {
      if (fingerprints.has(r.fingerprint)) errors.push(`line ${index + 1}: duplicate fingerprint`);
      fingerprints.add(r.fingerprint);
    }
  });

  if (errors.length) return fail(`${errors.length} validation error(s)\n${errors.slice(0, 50).join("\n")}`);
  console.log(`Dataset valid: ${lines.length} record(s)`);
}

function fail(message) { console.error(message); process.exitCode = 1; }
main().catch(error => { console.error(error); process.exitCode = 1; });
