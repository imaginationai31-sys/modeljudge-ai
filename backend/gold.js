const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const db = require("./db");

const DEFAULT_GOLD_FILE = path.join(__dirname, "..", "data", "gold", "gold-evaluations.jsonl");
let calibrationSchemaReady = false;

function goldFile() {
  const configured = process.env.GOLD_TASKS_FILE;
  return configured || DEFAULT_GOLD_FILE;
}

async function loadGoldTasks() {
  const configured = process.env.GOLD_TASKS_FILE;
  const candidate = goldFile();
  try {
    const text = await fs.readFile(candidate, "utf8");
    return text.split("\n").filter(Boolean).map(JSON.parse);
  } catch (error) {
    if (error.code === "ENOENT" && configured) {
      console.warn(`[calibration] GOLD_TASKS_FILE not found: ${candidate}; falling back to repository gold dataset`);
      const text = await fs.readFile(DEFAULT_GOLD_FILE, "utf8");
      return text.split("\n").filter(Boolean).map(JSON.parse);
    }
    throw error;
  }
}

async function ensureCalibrationSchema() {
  if (!db.isConfigured() || calibrationSchemaReady) return;
  await db.query(`CREATE TABLE IF NOT EXISTS calibration_attempts (
    id TEXT PRIMARY KEY,
    reviewer_id TEXT NOT NULL,
    gold_evaluation_id TEXT NOT NULL,
    submitted_preference TEXT NOT NULL,
    expected_preference TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  await db.query(`ALTER TABLE calibration_attempts ADD COLUMN IF NOT EXISTS reviewer_id TEXT`);
  await db.query(`ALTER TABLE calibration_attempts ADD COLUMN IF NOT EXISTS gold_evaluation_id TEXT`);
  await db.query(`ALTER TABLE calibration_attempts ADD COLUMN IF NOT EXISTS submitted_preference TEXT`);
  await db.query(`ALTER TABLE calibration_attempts ADD COLUMN IF NOT EXISTS expected_preference TEXT`);
  await db.query(`ALTER TABLE calibration_attempts ADD COLUMN IF NOT EXISTS preferred_response TEXT`);
  await db.query(`ALTER TABLE calibration_attempts ADD COLUMN IF NOT EXISTS is_correct BOOLEAN`);
  await db.query(`ALTER TABLE calibration_attempts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`);
  await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS calibration_attempts_reviewer_task_idx ON calibration_attempts (reviewer_id, gold_evaluation_id)`);
  calibrationSchemaReady = true;
}

function publicTask(task) { return { gold_evaluation_id: task.gold_evaluation_id, prompt: task.prompt, response_a: task.response_a, response_b: task.response_b }; }

function pickTask(tasks, reviewerId, excludedIds = []) {
  const available = tasks.filter(task => !excludedIds.includes(task.gold_evaluation_id));
  const pool = available.length ? available : tasks;
  if (!pool.length) return null;
  const seed = crypto.createHash("sha256").update(`${reviewerId}:${Date.now()}:${crypto.randomBytes(8).toString("hex")}`).digest("hex");
  return pool[parseInt(seed.slice(0, 8), 16) % pool.length];
}

async function reviewerAttemptIds(reviewerId) {
  if (db.isConfigured()) {
    await ensureCalibrationSchema();
    return (await db.query("SELECT gold_evaluation_id FROM calibration_attempts WHERE reviewer_id = $1", [reviewerId])).rows.map(row => row.gold_evaluation_id);
  }
  try { return (await fs.readFile(path.join(__dirname, "..", "data", "calibration-attempts.jsonl"), "utf8")).split("\n").filter(Boolean).map(JSON.parse).filter(row => row.reviewer_id === reviewerId).map(row => row.gold_evaluation_id); }
  catch (error) { if (error.code === "ENOENT") return []; throw error; }
}

async function getTask(reviewerId) {
  const tasks = await loadGoldTasks();
  const task = pickTask(tasks, reviewerId, await reviewerAttemptIds(reviewerId));
  return task ? publicTask(task) : null;
}

function validateSubmission(body) {
  const errors = [];
  if (!body || typeof body.gold_evaluation_id !== "string") errors.push("gold_evaluation_id is required");
  if (!["A", "B", "Tie"].includes(body?.preferred_response)) errors.push("preferred_response must be A, B, or Tie");
  return errors;
}

async function submit({ reviewerId, goldEvaluationId, preferredResponse }) {
  const tasks = await loadGoldTasks();
  const task = tasks.find(item => item.gold_evaluation_id === goldEvaluationId);
  if (!task) return { error: "Gold task not found", status: 404 };
  if ((await reviewerAttemptIds(reviewerId)).includes(goldEvaluationId)) return { error: "Calibration task already attempted", status: 409 };
  const correct = task.preferred_response === preferredResponse;
  const record = { id: `CAL-${crypto.randomUUID()}`, reviewer_id: reviewerId, gold_evaluation_id: goldEvaluationId, submitted_preference: preferredResponse, expected_preference: task.preferred_response, preferred_response: task.preferred_response, is_correct: correct, created_at: new Date().toISOString() };
  if (db.isConfigured()) {
    await ensureCalibrationSchema();
    await db.query("INSERT INTO calibration_attempts (id,reviewer_id,gold_evaluation_id,submitted_preference,expected_preference,preferred_response,is_correct,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [record.id, record.reviewer_id, record.gold_evaluation_id, record.submitted_preference, record.expected_preference, record.preferred_response, record.is_correct, record.created_at]);
  } else await fs.appendFile(path.join(__dirname, "..", "data", "calibration-attempts.jsonl"), JSON.stringify(record) + "\n", "utf8");
  return { id: record.id, correct, gold_evaluation_id: goldEvaluationId };
}

async function reviewerQuality(reviewerId) {
  let rows;
  if (db.isConfigured()) {
    await ensureCalibrationSchema();
    rows = (await db.query("SELECT is_correct FROM calibration_attempts WHERE reviewer_id = $1 ORDER BY created_at DESC", [reviewerId])).rows;
  } else {
    try { rows = (await fs.readFile(path.join(__dirname, "..", "data", "calibration-attempts.jsonl"), "utf8")).split("\n").filter(Boolean).map(JSON.parse).filter(r => r.reviewer_id === reviewerId); }
    catch (e) { if (e.code === "ENOENT") rows = []; else throw e; }
  }
  const count = rows.length;
  const correct = rows.filter(r => r.is_correct).length;
  return { reviewer_id: reviewerId, calibration_attempts: count, correct, accuracy: count ? Number((correct / count).toFixed(5)) : null, status: count < 3 ? "insufficient" : correct / count >= 0.8 ? "pass" : "review" };
}

module.exports = { loadGoldTasks, publicTask, getTask, validateSubmission, submit, reviewerQuality, pickTask, ensureCalibrationSchema };