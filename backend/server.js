const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { validateReview, reviewFingerprint, buildConsensus, reviewerStats } = require("./reviewer");
const store = require("./storage-adapter");
const auth = require("./auth");
const gold = require("./gold");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 8787;
const EXPORT_DIR = path.join(__dirname, "..", "exports");
const dimensions = ["accuracy", "relevance", "clarity", "safety"];
const DATASET_VERSION = "0.6.0";

app.use(express.json({ limit: "100kb" }));
app.use((req, res, next) => { const origin = process.env.CORS_ORIGIN || "*"; res.setHeader("Access-Control-Allow-Origin", origin); res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization"); res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS"); if (req.method === "OPTIONS") return res.sendStatus(204); next(); });

function validate(body) {
  const errors = [];
  if (!body.prompt || typeof body.prompt !== "string") errors.push("prompt is required");
  if (!body.response_a || typeof body.response_a !== "string") errors.push("response_a is required");
  if (!body.response_b || typeof body.response_b !== "string") errors.push("response_b is required");
  if (!["A", "B", "Tie"].includes(body.preferred_response)) errors.push("preferred_response must be A, B, or Tie");
  if (!body.reason || body.reason.trim().length < 10) errors.push("reason must contain at least ten characters");
  for (const dimension of dimensions) for (const side of ["a", "b"]) { const value = body[`${dimension}_${side}`]; if (!Number.isInteger(value) || value < 1 || value > 5) errors.push(`${dimension}_${side} must be an integer from 1 to 5`); }
  return errors;
}

async function readExport(name) { return JSON.parse(await fs.readFile(path.join(EXPORT_DIR, name), "utf8")); }
function sendStorageError(res, error, fallback) { console.error(error); if (error?.code === "23505") return res.status(409).json({ error: "Duplicate record violates a database uniqueness rule" }); if (error?.code === "23503") return res.status(400).json({ error: "Referenced record does not exist" }); return res.status(500).json({ error: fallback }); }

app.get("/api/health", async (req, res) => { try { if (store.mode() === "postgres") await db.query("SELECT 1"); res.json({ status: "ok", service: "modeljudge-api", version: DATASET_VERSION, storage: store.mode(), authentication: store.mode() === "postgres" ? "enabled" : "requires-postgres", gold_calibration: "enabled" }); } catch { res.status(503).json({ status: "error", service: "modeljudge-api", version: DATASET_VERSION, storage: store.mode() }); } });

app.post("/api/auth/login", async (req, res) => { const { reviewer_id, password } = req.body || {}; if (typeof reviewer_id !== "string" || typeof password !== "string") return res.status(400).json({ error: "reviewer_id and password are required" }); try { const session = await auth.login(reviewer_id.trim(), password); if (!session) return res.status(401).json({ error: "Invalid reviewer credentials" }); res.json(session); } catch (error) { return sendStorageError(res, error, "Unable to authenticate reviewer"); } });
app.post("/api/auth/logout", auth.requireAuth, async (req, res) => { try { await auth.revoke(auth.bearerToken(req)); res.json({ message: "Logged out" }); } catch { res.status(500).json({ error: "Unable to revoke session" }); } });
app.get("/api/auth/me", auth.requireAuth, (req, res) => res.json({ reviewer_id: req.auth.reviewer_id, role: req.auth.role }));
app.post("/api/auth/accounts", async (req, res) => { if (!db.isConfigured()) return res.status(503).json({ error: "Account creation requires PostgreSQL" }); const bootstrap = process.env.ADMIN_BOOTSTRAP_TOKEN; if (!bootstrap || req.get("x-admin-bootstrap-token") !== bootstrap) return res.status(403).json({ error: "Admin bootstrap authorization required" }); try { const account = await auth.createAccount({ reviewerId: req.body.reviewer_id, password: req.body.password, role: req.body.role || "reviewer" }); res.status(201).json(account); } catch (error) { return sendStorageError(res, error, "Unable to create reviewer account"); } });

app.get("/api/gold/task", auth.requireAuth, async (req, res) => { try { const task = await gold.getTask(req.auth.reviewer_id); if (!task) return res.status(503).json({ error: "No calibration tasks configured" }); res.json(task); } catch { res.status(503).json({ error: "Calibration service unavailable" }); } });
app.post("/api/gold/submit", auth.requireAuth, async (req, res) => { const errors = gold.validateSubmission(req.body); if (errors.length) return res.status(400).json({ error: "Calibration validation failed", errors }); try { const result = await gold.submit({ reviewerId: req.auth.reviewer_id, goldEvaluationId: req.body.gold_evaluation_id, preferredResponse: req.body.preferred_response }); if (result.error) return res.status(result.status).json({ error: result.error }); res.json(result); } catch (error) { return sendStorageError(res, error, "Unable to record calibration attempt"); } });
app.get("/api/gold/me", auth.requireAuth, async (req, res) => { try { res.json(await gold.reviewerQuality(req.auth.reviewer_id)); } catch { res.status(503).json({ error: "Unable to calculate calibration quality" }); } });

app.get("/api/evaluations", async (req, res) => { try { const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 500); const records = await store.listEvaluations(limit); res.json({ count: await store.countEvaluations(), records }); } catch { res.status(500).json({ error: "Unable to read evaluations" }); } });
app.post("/api/evaluations", async (req, res) => { const errors = validate(req.body); if (errors.length) return res.status(400).json({ error: "Validation failed", errors }); try { const fingerprint = crypto.createHash("sha256").update([req.body.prompt, req.body.response_a, req.body.response_b].join("\n")).digest("hex"); if (await store.evaluationFingerprintExists(fingerprint)) return res.status(409).json({ error: "Duplicate evaluation pair detected", fingerprint }); const record = { id: req.body.id || `MJ-${crypto.randomUUID()}`, prompt: req.body.prompt.trim(), response_a: req.body.response_a.trim(), response_b: req.body.response_b.trim(), preferred_response: req.body.preferred_response, ...Object.fromEntries(dimensions.flatMap(d => [[`${d}_a`, req.body[`${d}_a`]], [`${d}_b`, req.body[`${d}_b`]]])), preference_strength: req.body.preference_strength || "moderate", reason: req.body.reason.trim(), category: req.body.category || "General Knowledge", language: req.body.language || "en", verified: false, fingerprint, created_at: new Date().toISOString(), dataset_version: DATASET_VERSION }; await store.insertEvaluation(record); res.status(201).json({ message: "Evaluation saved", record }); } catch (error) { return sendStorageError(res, error, "Unable to save evaluation"); } });
app.get("/api/reviews", async (req, res) => { try { const reviews = await store.listReviews(req.query.evaluation_id); res.json({ count: reviews.length, reviews }); } catch { res.status(500).json({ error: "Unable to read reviews" }); } });
app.post("/api/reviews", auth.requireAuth, async (req, res) => { const errors = validateReview(req.body); if (errors.length) return res.status(400).json({ error: "Review validation failed", errors }); try { if (req.body.reviewer_id && req.body.reviewer_id !== req.auth.reviewer_id) return res.status(403).json({ error: "reviewer_id does not match authenticated reviewer" }); if (!await store.findEvaluation(req.body.evaluation_id)) return res.status(404).json({ error: "Evaluation not found" }); const reviews = await store.listReviews(req.body.evaluation_id); const reviewerId = req.auth.reviewer_id; const payload = { ...req.body, reviewer_id: reviewerId }; const fingerprint = reviewFingerprint(payload); if (await store.reviewFingerprintExists(fingerprint) || reviews.some(r => r.reviewer_id === reviewerId)) return res.status(409).json({ error: "Reviewer already reviewed this evaluation" }); const review = { id: `REV-${crypto.randomUUID()}`, evaluation_id: req.body.evaluation_id, reviewer_id: reviewerId, submitted_by_account_id: req.auth.id, preferred_response: req.body.preferred_response, ...Object.fromEntries(dimensions.flatMap(d => [[`${d}_a`, req.body[`${d}_a`]], [`${d}_b`, req.body[`${d}_b`]]])), reason: req.body.reason.trim(), confidence: req.body.confidence || "medium", fingerprint, created_at: new Date().toISOString(), quality_flag: "pending" }; await store.insertReview(review); const consensus = buildConsensus([...reviews, review]); res.status(201).json({ message: "Review saved", review, consensus }); } catch (error) { return sendStorageError(res, error, "Unable to save review"); } });
app.get("/api/reviews/consensus/:evaluationId", async (req, res) => { try { const reviews = await store.listReviews(req.params.evaluationId); res.json({ evaluation_id: req.params.evaluationId, ...buildConsensus(reviews) }); } catch { res.status(500).json({ error: "Unable to calculate consensus" }); } });
app.get("/api/reviewers/stats", async (req, res) => { try { const pgRows = await store.reviewerStatsRows(); if (pgRows) return res.json({ reviewer_count: pgRows.length, reviewers: pgRows }); const reviews = await store.listReviews(); res.json({ reviewer_count: new Set(reviews.map(r => r.reviewer_id)).size, reviewers: reviewerStats(reviews) }); } catch { res.status(500).json({ error: "Unable to calculate reviewer statistics" }); } });
app.get("/api/release", async (req, res) => { try { const report = await readExport("quality-report.json"); const manifest = await readExport("manifest.json"); res.json({ version: manifest.version, dataset_name: manifest.dataset_name, format: manifest.format, record_count: manifest.record_count, generated_at: manifest.generated_at, average_quality_score: report.average_quality_score, human_verification_rate: report.human_verification_rate, unique_prompts: report.unique_prompts, duplicate_rate: report.duplicate_rate, schema: manifest.schema, quality_report: manifest.quality_report }); } catch { res.status(503).json({ error: "Release metadata is not generated yet. Run npm run export." }); } });

if (require.main === module) app.listen(PORT, () => console.log(`ModelJudge API running on http://localhost:${PORT} using ${store.mode()} storage`));
module.exports = app;
