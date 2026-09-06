const db = require("./db");

async function insertEvaluation(record) {
  await db.query(`INSERT INTO evaluations (id,prompt,response_a,response_b,preferred_response,accuracy_a,accuracy_b,relevance_a,relevance_b,clarity_a,clarity_b,safety_a,safety_b,reason,fingerprint,category,language,verified,dataset_version,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`, [record.id,record.prompt,record.response_a,record.response_b,record.preferred_response,record.accuracy_a,record.accuracy_b,record.relevance_a,record.relevance_b,record.clarity_a,record.clarity_b,record.safety_a,record.safety_b,record.reason,record.fingerprint,record.category,record.language,record.verified,record.dataset_version,record.created_at]);
  return record;
}

async function listEvaluations(limit = 500) {
  const result = await db.query("SELECT * FROM evaluations ORDER BY created_at DESC LIMIT $1", [limit]);
  return result.rows;
}

async function findEvaluation(id) {
  const result = await db.query("SELECT * FROM evaluations WHERE id = $1 LIMIT 1", [id]);
  return result.rows[0] || null;
}

async function fingerprintExists(fingerprint) {
  const result = await db.query("SELECT 1 FROM evaluations WHERE fingerprint = $1 LIMIT 1", [fingerprint]);
  return result.rowCount > 0;
}

async function insertReview(review) {
  await db.query(`INSERT INTO reviews (id,evaluation_id,reviewer_id,preferred_response,reason,confidence,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [review.id,review.evaluation_id,review.reviewer_id,review.preferred_response,review.reason,review.confidence,review.created_at]);
  return review;
}

async function listReviews(evaluationId) {
  const result = evaluationId ? await db.query("SELECT * FROM reviews WHERE evaluation_id = $1 ORDER BY created_at DESC", [evaluationId]) : await db.query("SELECT * FROM reviews ORDER BY created_at DESC LIMIT 500");
  return result.rows;
}

module.exports = { insertEvaluation, listEvaluations, findEvaluation, fingerprintExists, insertReview, listReviews };
