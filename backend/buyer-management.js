const crypto = require("crypto");
const db = require("./db");

function requireDb(){if(!db.isConfigured())throw new Error("Buyer management requires PostgreSQL");}

async function createBuyer({buyerId,companyName,contactEmail,notes}){
  requireDb();
  const result=await db.query(`INSERT INTO buyer_accounts (buyer_id,company_name,contact_email,notes) VALUES ($1,$2,$3,$4) RETURNING *`,[buyerId,companyName,contactEmail||null,notes||null]);
  return result.rows[0];
}

async function listBuyers(){requireDb();const r=await db.query(`SELECT b.*,COUNT(k.id)::int AS api_key_count,COALESCE(SUM(CASE WHEN k.revoked_at IS NULL THEN 1 ELSE 0 END),0)::int AS active_api_key_count FROM buyer_accounts b LEFT JOIN buyer_api_keys k ON k.buyer_id=b.buyer_id GROUP BY b.buyer_id ORDER BY b.created_at DESC`);return r.rows;}
async function getBuyer(buyerId){requireDb();const r=await db.query(`SELECT * FROM buyer_accounts WHERE buyer_id=$1`,[buyerId]);return r.rows[0]||null;}
async function setBuyerStatus(buyerId,status){requireDb();const r=await db.query(`UPDATE buyer_accounts SET status=$2,updated_at=CURRENT_TIMESTAMP WHERE buyer_id=$1 RETURNING *`,[buyerId,status]);return r.rows[0]||null;}
async function listKeys(buyerId){requireDb();const r=await db.query(`SELECT id,buyer_id,name,key_prefix,scopes,daily_limit,requests_today,day_started_at,last_used_at,revoked_at,created_at FROM buyer_api_keys WHERE buyer_id=$1 ORDER BY created_at DESC`,[buyerId]);return r.rows;}
async function revokeKey(id,buyerId){requireDb();const r=await db.query(`UPDATE buyer_api_keys SET revoked_at=COALESCE(revoked_at,CURRENT_TIMESTAMP) WHERE id=$1 AND buyer_id=$2 RETURNING id,buyer_id,key_prefix,revoked_at`,[id,buyerId]);return r.rows[0]||null;}
async function rotateKey(id,buyerId,name){requireDb();const client=await db.getPool().connect();try{await client.query("BEGIN");const old=await client.query(`UPDATE buyer_api_keys SET revoked_at=COALESCE(revoked_at,CURRENT_TIMESTAMP) WHERE id=$1 AND buyer_id=$2 AND revoked_at IS NULL RETURNING *`,[id,buyerId]);if(!old.rows[0]){await client.query("ROLLBACK");return null;}const raw=`mj_live_${crypto.randomBytes(32).toString("hex")}`;const hash=crypto.createHash("sha256").update(raw).digest("hex");const r=await client.query(`INSERT INTO buyer_api_keys (id,buyer_id,name,key_prefix,key_hash,scopes,daily_limit) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,buyer_id,name,key_prefix,scopes,daily_limit,created_at`,[crypto.randomUUID(),buyerId,name||old.rows[0].name,raw.slice(0,12),hash,old.rows[0].scopes,old.rows[0].daily_limit]);await client.query("COMMIT");return {...r.rows[0],api_key:raw};}catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}}
async function usage(buyerId){requireDb();const r=await db.query(`SELECT COUNT(*)::int AS total_downloads,COALESCE(SUM(record_count),0)::bigint AS records_downloaded,COUNT(DISTINCT version)::int AS versions_downloaded,MAX(created_at) AS last_download_at FROM buyer_access_log WHERE buyer_id=$1 AND action='dataset_download'`,[buyerId]);const recent=await db.query(`SELECT version,format,record_count,created_at FROM buyer_access_log WHERE buyer_id=$1 ORDER BY created_at DESC LIMIT 25`,[buyerId]);return {...r.rows[0],recent_downloads:recent.rows};}
module.exports={createBuyer,listBuyers,getBuyer,setBuyerStatus,listKeys,revokeKey,rotateKey,usage};
