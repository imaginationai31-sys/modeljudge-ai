const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { validateReview, reviewFingerprint, buildConsensus, reviewerStats } = require("./reviewer");

const app = express();
const PORT = process.env.PORT || 8787;
const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "evaluations.jsonl");
const REVIEWS_FILE = path.join(DATA_DIR, "reviews.jsonl");
const dimensions = ["accuracy", "relevance", "clarity", "safety"];

app.use(express.json({ limit: "100kb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

function validate(body) {
  const errors = [];
  if (!body.prompt || typeof body.prompt !== "string") errors.push("prompt is required");
  if (!body.response_a || typeof body.response_a !== "string") errors.push("response_a is required");
  if (!body.response_b || typeof body.response_b !== "string") errors.push("response_b is required");
  if (!["A", "B", "Tie"].includes(body.preferred_response)) errors.push("preferred_response must be A, B, or Tie");
  if (!body.reason || body.reason.trim().length < 10) errors.push("reason must contain at least ten characters");
  for (const dimension of dimensions) for (const side of ["a", "b"]) {
    const value = body[`${dimension}_${side}`];
    if (!Number.isInteger(value) || value < 1 || value > 5) errors.push(`${dimension}_${side} must be an integer from 1 to 5`);
  }
  return errors;
}

async function readJsonl(file) {
  try {
    const text = await fs.readFile(file, "utf8");
    return text.split("\n").filter(Boolean).map(JSON.parse);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function appendJsonl(file, record) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.appendFile(file, JSON.stringify(record) + "\n", "utf8");
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "modeljudge-api", version: "0.3.0" });
});

app.get("/api/evaluations", async (req, res) => {
  try {
    const records = await readJsonl(DATA_FILE);
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 500);
    res.json({ count: records.length, records: records.slice(-limit).reverse() });
  } catch { res.status(500).json({ error: "Unable to read evaluations" }); }
});

app.post("/api/evaluations", async (req, res) => {
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ error: "Validation failed", errors });
  try {
    const records = await readJsonl(DATA_FILE);
    const fingerprint = crypto.createHash("sha256").update([req.body.prompt, req.body.response_a, req.body.response_b].join("\n")).digest("hex");
    if (records.some(record => record.fingerprint === fingerprint)) return res.status(409).json({ error: "Duplicate evaluation pair detected", fingerprint });
    const record = {
      id: req.body.id || `MJ-${String(records.length + 1).padStart(6, "0")}`,
      prompt: req.body.prompt.trim(), response_a: req.body.response_a.trim(), response_b: req.body.response_b.trim(),
      preferred_response: req.body.preferred_response,
      ...Object.fromEntries(dimensions.flatMap(d => [[`${d}_a`, req.body[`${d}_a`]], [`${d}_b`, req.body[`${d}_b`]]])),
      preference_strength: req.body.preference_strength || "moderate", reason: req.body.reason.trim(),
      category: req.body.category || "General Knowledge", language: req.body.language || "en",
      verified: false, fingerprint, created_at: new Date().toISOString(), dataset_version: "0.3.0"
    };
    await appendJsonl(DATA_FILE, record);
    res.status(201).json({ message: "Evaluation saved", record });
  } catch { res.status(500).json({ error: "Unable to save evaluation" }); }
});

app.get("/api/reviews", async (req, res) => {
  try {
    const reviews = await readJsonl(REVIEWS_FILE);
    const evaluationId = req.query.evaluation_id;
    const filtered = evaluationId ? reviews.filter(r => r.evaluation_id === evaluationId) : reviews;
    res.json({ count: filtered.length, reviews: filtered.slice(-500).reverse() });
  } catch { res.status(500).json({ error: "Unable to read reviews" }); }
});

app.post("/api/reviews", async (req, res) => {
  const errors = validateReview(req.body);
  if (errors.length) return res.status(400).json({ error: "Review validation failed", errors });
  try {
    const evaluations = await readJsonl(DATA_FILE);
    if (!evaluations.some(r => r.id === req.body.evaluation_id)) return res.status(404).json({ error: "Evaluation not found" });
    const reviews = await readJsonl(REVIEWS_FILE);
    const fingerprint = reviewFingerprint(req.body);
    if (reviews.some(r => r.fingerprint === fingerprint)) return res.status(409).json({ error: "Reviewer already reviewed this evaluation" });
    const review = {
      id: `REV-${crypto.randomUUID()}`, evaluation_id: req.body.evaluation_id, reviewer_id: req.body.reviewer_id.trim(),
      preferred_response: req.body.preferred_response,
      ...Object.fromEntries(dimensions.flatMap(d => [[`${d}_a`, req.body[`${d}_a`]], [`${d}_b`, req.body[`${d}_b`]]])),
      reason: req.body.reason.trim(), confidence: req.body.confidence || "medium",
      fingerprint, created_at: new Date().toISOString(), quality_flag: "pending"
    };
    await appendJsonl(REVIEWS_FILE, review);
    const evaluationReviews = [...reviews, review].filter(r => r.evaluation_id === review.evaluation_id);
    const consensus = buildConsensus(evaluationReviews);
    res.status(201).json({ message: "Review saved", review, consensus });
  } catch { res.status(500).json({ error: "Unable to save review" }); }
});

app.get("/api/reviews/consensus/:evaluationId", async (req, res) => {
  try {
    const reviews = await readJsonl(REVIEWS_FILE);
    const matching = reviews.filter(r => r.evaluation_id === req.params.evaluationId);
    res.json({ evaluation_id: req.params.evaluationId, ...buildConsensus(matching) });
  } catch { res.status(500).json({ error: "Unable to calculate consensus" }); }
});

app.get("/api/reviewers/stats", async (req, res) => {
  try {
    const reviews = await readJsonl(REVIEWS_FILE);
    res.json({ reviewer_count: new Set(reviews.map(r => r.reviewer_id)).size, reviewers: reviewerStats(reviews) });
  } catch { res.status(500).json({ error: "Unable to calculate reviewer statistics" }); }
});

app.listen(PORT, () => console.log(`ModelJudge API running on http://localhost:${PORT}`));
