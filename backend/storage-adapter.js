const fs = require("fs/promises");
const path = require("path");
const { JsonlStore } = require("./storage");
const db = require("./db");
const pgStore = require("./db-store");

const DATA_DIR = path.join(__dirname, "..", "data");
const evaluationsFile = path.join(DATA_DIR, "evaluations.jsonl");
const evaluationsJsonl = new JsonlStore(evaluationsFile);
const reviewsJsonl = new JsonlStore(path.join(DATA_DIR, "reviews.jsonl"));

function mode() { return db.isConfigured() ? "postgres" : "jsonl"; }

async function listEvaluations(limit) {
  if (mode() === "postgres") return pgStore.listEvaluations(limit);
  const records = await evaluationsJsonl.read();
  return records.slice(-limit).reverse();
}

async function countEvaluations() {
  if (mode() === "postgres") return (await db.query("SELECT COUNT(*)::int AS count FROM evaluations")).rows[0].count;
  return (await evaluationsJsonl.read()).length;
}

async function findEvaluation(id) {
  if (mode() === "postgres") return pgStore.findEvaluation(id);
  return (await evaluationsJsonl.read()).find(r => r.id === id) || null;
}

async function evaluationFingerprintExists(fingerprint) {
  if (mode() === "postgres") return pgStore.fingerprintExists(fingerprint);
  return (await evaluationsJsonl.read()).some(r => r.fingerprint === fingerprint);
}

async function reviewFingerprintExists(fingerprint) {
  if (mode() === "postgres") return pgStore.reviewFingerprintExists(fingerprint);
  return (await reviewsJsonl.read()).some(r => r.fingerprint === fingerprint);
}

async function insertEvaluation(record) {
  if (mode() === "postgres") return pgStore.insertEvaluation(record);
  await evaluationsJsonl.append(record);
  return record;
}

async function markEvaluationVerified(id, verified = true) {
  if (mode() === "postgres") return pgStore.markEvaluationVerified(id, verified);
  const records = await evaluationsJsonl.read();
  const index = records.findIndex(r => r.id === id);
  if (index === -1) return null;
  records[index] = { ...records[index], verified };
  await fs.writeFile(evaluationsFile, records.map(r => JSON.stringify(r)).join("\n") + (records.length ? "\n" : ""), "utf8");
  return records[index];
}

async function listReviews(evaluationId) {
  if (mode() === "postgres") return pgStore.listReviews(evaluationId);
  const reviews = await reviewsJsonl.read();
  return evaluationId ? reviews.filter(r => r.evaluation_id === evaluationId) : reviews.slice(-500).reverse();
}

async function insertReview(review) {
  if (mode() === "postgres") await pgStore.insertReview(review);
  else await reviewsJsonl.append(review);

  if (review.verification_action === "approved") {
    await markEvaluationVerified(review.evaluation_id, true);
  }
  return review;
}

async function reviewerStatsRows() {
  if (mode() === "postgres") {
    const result = await db.query(`SELECT reviewer_id, COUNT(*)::int AS review_count, AVG((accuracy_a + accuracy_b + relevance_a + relevance_b + clarity_a + clarity_b + safety_a + safety_b)::numeric / 8) AS average_score, AVG(CASE WHEN preferred_response = 'Tie' THEN 1.0 ELSE 0.0 END) AS tie_rate FROM reviews GROUP BY reviewer_id ORDER BY average_score DESC, review_count DESC`);
    return result.rows.map(r => ({ reviewer_id: r.reviewer_id, review_count: r.review_count, average_score: Number(r.average_score), tie_rate: Number(r.tie_rate) }));
  }
  return null;
}

module.exports = { mode, listEvaluations, countEvaluations, findEvaluation, evaluationFingerprintExists, reviewFingerprintExists, insertEvaluation, markEvaluationVerified, listReviews, insertReview, reviewerStatsRows };