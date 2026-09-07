const db = require("./db");

async function insertEvaluation(record) {
  await db.query(`INSERT INTO evaluations (id,prompt,response_a,response_b,preferred_response,accuracy_a,accuracy_b,relevance_a,relevance_b,clarity_a,clarity_b,safety_a,safety_b,reason,fingerprint,category,language,verified,dataset_version,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`, [record.id,record.prompt,record.response_a,record.response_b,record.preferred_response,record.accuracy_a,record.accuracy_b,record.relevance_a,record.relevance_b,record.clarity_a,record.clarity_b,record.safety_a,record.safety_b,record.reason,record.fingerprint,record.category,record.language,record.verified,record.dataset_version,record.created_at]);
  return record;
}

async function listEvaluations(limit = 500) {
  const result = await db.query(`SELECT e.*, CASE WHEN e.verified = TRUE OR EXISTS (SELECT 1 FROM reviews r WHERE r.evaluation_id = e.id AND (LOWER(COALESCE(r.verification_action,'')) = 'approved' OR LOWER(COALESCE(r.reason,'')) LIKE 'reviewer approved:%')) THEN TRUE ELSE FALSE END AS verified FROM evaluations e ORDER BY e.created_at DESC LIMIT $1`, [limit]);
  return result.rows;
}

async function countEvaluations() {
  const result = await db.query("SELECT COUNT(*)::int AS count FROM evaluations");
  return result.rows[0].count;
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
  await db.query(`INSERT INTO reviews (id,evaluation_id,reviewer_id,preferred_response,accuracy_a,accuracy_b,relevance_a,relevance_b,clarity_a,clarity_b,safety_a,safety_b,reason,confidence,fingerprint,created_at,verification_action) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`, [review.id,review.evaluation_id,review.reviewer_id,review.preferred_response,review.accuracy_a,review.accuracy_b,review.relevance_a,review.relevance_b,review.clarity_a,review.clarity_b,review.safety_a,review.safety_b,review.reason,review.confidence,review.fingerprint,review.created_at,review.verification_action || "pending"]);
  return review;
}

async function markEvaluationVerified(id, verified = true) {
  const result = await db.query("UPDATE evaluations SET verified = $2 WHERE id = $1 RETURNING *", [id, verified]);
  return result.rows[0] || null;
}

async function listReviews(evaluationId) {
  const result = evaluationId ? await db.query("SELECT * FROM reviews WHERE evaluation_id = $1 ORDER BY created_at DESC", [evaluationId]) : await db.query("SELECT * FROM reviews ORDER BY created_at DESC LIMIT 500");
  return result.rows;
}

async function reviewFingerprintExists(fingerprint) {
  const result = await db.query("SELECT 1 FROM reviews WHERE fingerprint = $1 LIMIT 1", [fingerprint]);
  return result.rowCount > 0;
}

async function reviewerStatsRows() {
  const result = await db.query(`SELECT reviewer_id, COUNT(*)::int AS review_count, AVG((accuracy_a + accuracy_b + relevance_a + relevance_b + clarity_a + clarity_b + safety_a + safety_b)::numeric / 8) AS average_score, AVG(CASE WHEN preferred_response = 'Tie' THEN 1.0 ELSE 0.0 END) AS tie_rate FROM reviews GROUP BY reviewer_id ORDER BY average_score DESC, review_count DESC`);
  return result.rows.map(r => ({ reviewer_id: r.reviewer_id, review_count: r.review_count, average_score: Number(r.average_score), tie_rate: Number(r.tie_rate) }));
}

async function withTransaction(work) {
  const client = db.getPool().connect ? await db.getPool().connect() : null;
  if (!client) throw new Error("PostgreSQL is not configured");
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}

module.exports = { insertEvaluation, listEvaluations, countEvaluations, findEvaluation, fingerprintExists, insertReview, markEvaluationVerified, listReviews, reviewFingerprintExists, reviewerStatsRows, withTransaction };