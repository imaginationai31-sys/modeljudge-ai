const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 8787;
const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "evaluations.jsonl");

app.use(express.json({ limit: "100kb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const dimensions = ["accuracy", "relevance", "clarity", "safety"];

function validate(body) {
  const errors = [];
  if (!body.prompt || typeof body.prompt !== "string") errors.push("prompt is required");
  if (!body.response_a || typeof body.response_a !== "string") errors.push("response_a is required");
  if (!body.response_b || typeof body.response_b !== "string") errors.push("response_b is required");
  if (!["A", "B", "Tie"].includes(body.preferred_response)) errors.push("preferred_response must be A, B, or Tie");
  if (!body.reason || body.reason.trim().length < 10) errors.push("reason must contain at least ten characters");
  for (const dimension of dimensions) {
    for (const side of ["a", "b"]) {
      const value = body[`${dimension}_${side}`];
      if (!Number.isInteger(value) || value < 1 || value > 5) errors.push(`${dimension}_${side} must be an integer from 1 to 5`);
    }
  }
  return errors;
}

async function readRecords() {
  try {
    const text = await fs.readFile(DATA_FILE, "utf8");
    return text.split("\n").filter(Boolean).map(line => JSON.parse(line));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "modeljudge-api", version: "0.2.0" });
});

app.get("/api/evaluations", async (req, res) => {
  try {
    const records = await readRecords();
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 500);
    res.json({ count: records.length, records: records.slice(-limit).reverse() });
  } catch {
    res.status(500).json({ error: "Unable to read evaluations" });
  }
});

app.post("/api/evaluations", async (req, res) => {
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ error: "Validation failed", errors });

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const records = await readRecords();
    const fingerprint = crypto.createHash("sha256")
      .update([req.body.prompt, req.body.response_a, req.body.response_b].join("\n"))
      .digest("hex");

    if (records.some(record => record.fingerprint === fingerprint)) {
      return res.status(409).json({ error: "Duplicate evaluation pair detected", fingerprint });
    }

    const record = {
      id: req.body.id || `MJ-${String(records.length + 1).padStart(6, "0")}`,
      prompt: req.body.prompt.trim(),
      response_a: req.body.response_a.trim(),
      response_b: req.body.response_b.trim(),
      preferred_response: req.body.preferred_response,
      accuracy_a: req.body.accuracy_a,
      accuracy_b: req.body.accuracy_b,
      relevance_a: req.body.relevance_a,
      relevance_b: req.body.relevance_b,
      clarity_a: req.body.clarity_a,
      clarity_b: req.body.clarity_b,
      safety_a: req.body.safety_a,
      safety_b: req.body.safety_b,
      preference_strength: req.body.preference_strength || "moderate",
      reason: req.body.reason.trim(),
      category: req.body.category || "General Knowledge",
      language: req.body.language || "en",
      verified: false,
      fingerprint,
      created_at: new Date().toISOString(),
      dataset_version: "0.2.0"
    };

    await fs.appendFile(DATA_FILE, JSON.stringify(record) + "\n", "utf8");
    res.status(201).json({ message: "Evaluation saved", record });
  } catch {
    res.status(500).json({ error: "Unable to save evaluation" });
  }
});

app.listen(PORT, () => console.log(`ModelJudge API running on http://localhost:${PORT}`));
