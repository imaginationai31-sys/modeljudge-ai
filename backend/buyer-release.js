const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const store = require("./storage-adapter");

const ROOT = path.join(__dirname, "..");
const RELEASES_DIR = path.join(ROOT, "releases");

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(records) {
  const fields = [
    "id", "prompt", "response_a", "response_b", "preferred_response",
    "accuracy_a", "accuracy_b", "relevance_a", "relevance_b",
    "clarity_a", "clarity_b", "safety_a", "safety_b", "reason",
    "fingerprint", "category", "language", "verified", "dataset_version", "created_at"
  ];
  return [fields.join(","), ...records.map(record => fields.map(field => csvEscape(record[field])).join(","))].join("\n") + (records.length ? "\n" : "");
}

async function sha256(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

async function writeReviewerQualityReport(destination, version, generatedAt) {
  const reviewerQuality = {
    release_version: `v${version}`,
    generated_at: generatedAt,
    reviewers: (await store.reviewerStatsRows()) || [],
    note: "Reviewer statistics are derived from persisted review records."
  };
  const content = JSON.stringify(reviewerQuality, null, 2) + "\n";
  await fs.writeFile(path.join(destination, "reviewer-quality-report.json"), content, "utf8");
  return reviewerQuality;
}

async function ensureBuyerRelease(version = "1.0.0") {
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error("Invalid release version");
  const destination = path.join(RELEASES_DIR, `v${version}`);
  const datasetPath = path.join(destination, "evaluations.jsonl");
  try {
    await fs.access(datasetPath);
    try {
      await fs.access(path.join(destination, "reviewer-quality-report.json"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      await writeReviewerQualityReport(destination, version, new Date().toISOString());
      return { created: false, repaired: true, path: destination };
    }
    return { created: false, path: destination };
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const records = await store.listEvaluations(5000);
  const jsonl = records.map(record => JSON.stringify(record)).join("\n") + (records.length ? "\n" : "");
  const csv = toCsv(records);
  const qualityScores = records.flatMap(record => [
    record.accuracy_a, record.accuracy_b, record.relevance_a, record.relevance_b,
    record.clarity_a, record.clarity_b, record.safety_a, record.safety_b
  ]).map(Number).filter(Number.isFinite);
  const averageQuality = qualityScores.length ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length : 0;
  const verifiedCount = records.filter(record => record.verified === true).length;
  const generatedAt = new Date().toISOString();

  await fs.mkdir(destination, { recursive: true });
  await fs.writeFile(path.join(destination, "evaluations.jsonl"), jsonl, "utf8");
  await fs.writeFile(path.join(destination, "evaluations.csv"), csv, "utf8");

  const quality = {
    dataset_name: "ModelJudge AI Human Preference Evaluations",
    release_version: `v${version}`,
    generated_at: generatedAt,
    record_count: records.length,
    verified_count: verifiedCount,
    verified_rate: records.length ? verifiedCount / records.length : 0,
    average_quality_score: Number(averageQuality.toFixed(4)),
    score_scale: "1-5",
    source: store.mode()
  };
  await writeReviewerQualityReport(destination, version, generatedAt);
  const pipelineManifest = {
    dataset_name: "ModelJudge AI Human Preference Evaluations",
    version: `v${version}`,
    generated_at: generatedAt,
    record_count: records.length,
    source: store.mode()
  };

  const checksums = {
    "evaluations.jsonl": { sha256: await sha256(jsonl), bytes: Buffer.byteLength(jsonl) },
    "evaluations.csv": { sha256: await sha256(csv), bytes: Buffer.byteLength(csv) }
  };
  const manifest = {
    dataset_name: "ModelJudge AI Human Preference Evaluations",
    release_version: `v${version}`,
    release_id: `modeljudge-v${version}`,
    generated_at: generatedAt,
    immutable: true,
    formats: ["JSONL", "CSV"],
    record_count: records.length,
    files: checksums,
    provenance: "Generated from the ModelJudge AI evaluation pipeline. Verify source permissions and reviewer provenance before commercial use.",
    license: "See repository LICENSE and dataset-specific provenance records.",
    verification: "SHA-256 checksums cover each dataset file byte-for-byte."
  };

  await fs.writeFile(path.join(destination, "manifest.json"), JSON.stringify(pipelineManifest, null, 2) + "\n", "utf8");
  await fs.writeFile(path.join(destination, "quality-report.json"), JSON.stringify(quality, null, 2) + "\n", "utf8");
  await fs.writeFile(path.join(destination, "RELEASE-MANIFEST.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
  await fs.writeFile(path.join(destination, "BUYER-README.md"), `# ModelJudge AI v${version}\n\nImmutable buyer dataset release generated from the persisted evaluation store.\n\nVerify SHA-256 checksums in RELEASE-MANIFEST.json before redistribution.\n`, "utf8");
  await fs.writeFile(path.join(RELEASES_DIR, "LATEST.json"), JSON.stringify({ release_version: `v${version}`, release_path: `releases/v${version}`, generated_at: generatedAt, immutable: true }, null, 2) + "\n", "utf8");

  return { created: true, path: destination, record_count: records.length };
}

module.exports = { ensureBuyerRelease };
