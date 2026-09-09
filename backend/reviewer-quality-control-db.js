const crypto = require("crypto");
const db = require("./db");
const { calculateReviewerControl, DEFAULT_POLICY } = require("./reviewer-quality-control");

let schemaReady = false;
async function ensureSchema() {
  if (schemaReady) return;
  await db.query(`CREATE TABLE IF NOT EXISTS reviewer_quality_control (reviewer_id TEXT PRIMARY KEY,status TEXT NOT NULL DEFAULT 'insufficient' CHECK (status IN ('insufficient','active','warning','suspended')),reason TEXT,calibration_accuracy NUMERIC(6,5) NOT NULL DEFAULT 0,consistency_score NUMERIC(6,5) NOT NULL DEFAULT 0,quality_score NUMERIC(6,5) NOT NULL DEFAULT 0,calibration_attempts INTEGER NOT NULL DEFAULT 0,consecutive_calibration_failures INTEGER NOT NULL DEFAULT 0,suspended_until TIMESTAMPTZ,updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
  await db.query(`CREATE TABLE IF NOT EXISTS reviewer_quality_audit (id UUID PRIMARY KEY,reviewer_id TEXT NOT NULL,action TEXT NOT NULL,previous_status TEXT,new_status TEXT NOT NULL,reason TEXT,actor_reviewer_id TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_reviewer_quality_status ON reviewer_quality_control(status)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_reviewer_quality_audit_reviewer ON reviewer_quality_audit(reviewer_id, created_at DESC)`);
  schemaReady = true;
}

function policyFromEnv() {
  return {...DEFAULT_POLICY,minCalibrationAttempts:Number(process.env.REVIEWER_MIN_CALIBRATION_ATTEMPTS)||DEFAULT_POLICY.minCalibrationAttempts,passCalibrationAccuracy:Number(process.env.REVIEWER_PASS_CALIBRATION_ACCURACY)||DEFAULT_POLICY.passCalibrationAccuracy,reviewCalibrationAccuracy:Number(process.env.REVIEWER_WARNING_CALIBRATION_ACCURACY)||DEFAULT_POLICY.reviewCalibrationAccuracy,warningScore:Number(process.env.REVIEWER_WARNING_SCORE)||DEFAULT_POLICY.warningScore,suspensionScore:Number(process.env.REVIEWER_SUSPENSION_SCORE)||DEFAULT_POLICY.suspensionScore,maxConsecutiveFailures:Number(process.env.REVIEWER_MAX_CONSECUTIVE_FAILURES)||DEFAULT_POLICY.maxConsecutiveFailures};
}

async function compute(reviewerId) {
  await ensureSchema();
  const c=await db.query("SELECT is_correct FROM calibration_attempts WHERE reviewer_id=$1 ORDER BY created_at ASC",[reviewerId]);
  const r=await db.query("SELECT id FROM reviews WHERE reviewer_id=$1",[reviewerId]);
  const correct=c.rows.filter(x=>x.is_correct).length;

  const accuracy=c.rows.length?correct/c.rows.length:0; const consistency=r.rows.length>=2?1:r.rows.length===1?0.5:0;
  return calculateReviewerControl({reviewer_id:reviewerId,calibration_attempts:c.rows.length,calibration_accuracy:accuracy,consistency_score:consistency},policyFromEnv());
}

async function refresh(reviewerId,actor=null,action="automatic_evaluation") {
  await ensureSchema(); const control=await compute(reviewerId); const old=await db.query("SELECT status FROM reviewer_quality_control WHERE reviewer_id=$1",[reviewerId]); const previous=old.rows[0]?.status||null;
  await db.query(`INSERT INTO reviewer_quality_control (reviewer_id,status,reason,calibration_accuracy,consistency_score,quality_score,calibration_attempts,consecutive_calibration_failures,suspended_until) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (reviewer_id) DO UPDATE SET status=EXCLUDED.status,reason=EXCLUDED.reason,calibration_accuracy=EXCLUDED.calibration_accuracy,consistency_score=EXCLUDED.consistency_score,quality_score=EXCLUDED.quality_score,calibration_attempts=EXCLUDED.calibration_attempts,consecutive_calibration_failures=EXCLUDED.consecutive_calibration_failures,suspended_until=EXCLUDED.suspended_until,updated_at=CURRENT_TIMESTAMP`,[reviewerId,control.status,control.reasons.join(",")||null,control.calibration_accuracy,Number(control.consistency_score||0),control.quality_score,control.calibration_attempts,control.consecutive_calibration_failures,control.status==="suspended"?new Date(Date.now()+86400000).toISOString():null]);
  if(previous!==control.status||action!=="automatic_evaluation") await audit(reviewerId,action,previous,control.status,control.reasons.join(",")||null,actor); return control;
}
async function audit(reviewerId,action,previous,next,reason,actor){await ensureSchema();await db.query("INSERT INTO reviewer_quality_audit (id,reviewer_id,action,previous_status,new_status,reason,actor_reviewer_id) VALUES ($1,$2,$3,$4,$5,$6,$7)",[crypto.randomUUID(),reviewerId,action,previous,next,reason,actor]);}
async function get(reviewerId){await ensureSchema();const result=await db.query("SELECT * FROM reviewer_quality_control WHERE reviewer_id=$1",[reviewerId]);return result.rows[0]||refresh(reviewerId);}
async function list(){await ensureSchema();return (await db.query("SELECT * FROM reviewer_quality_control ORDER BY updated_at DESC")).rows;}
async function history(reviewerId){await ensureSchema();return (await db.query("SELECT * FROM reviewer_quality_audit WHERE reviewer_id=$1 ORDER BY created_at DESC LIMIT 100",[reviewerId])).rows;}
async function adminSet(reviewerId,status,actor,reason){if(!["active","warning","suspended"].includes(status))throw new Error("invalid reviewer status");await ensureSchema();const current=await get(reviewerId);await db.query("UPDATE reviewer_quality_control SET status=$1,reason=$2,suspended_until=$3,updated_at=CURRENT_TIMESTAMP WHERE reviewer_id=$4",[status,reason||`admin_${status}`,status==="suspended"?new Date(Date.now()+86400000).toISOString():null,reviewerId]);await audit(reviewerId,`admin_${status}`,current.status,status,reason||null,actor);return get(reviewerId);}
module.exports={compute,refresh,get,list,history,adminSet,policyFromEnv,ensureSchema};
