const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const EXPORT_DIR = path.join(ROOT, "exports");
const RELEASES_DIR = path.join(ROOT, "releases");

const RELEASE_FILES = [
  "evaluations.jsonl",
  "evaluations.csv",
  "manifest.json",
  "quality-report.json",
  "reviewer-quality.json",
  "quality-filtered.jsonl",
  "quality-filter-report.json",
  "reliability-report.json",
  "reviewer-control-report.json",
  "certification-report.json"
];

async function sha256(file) {
  const data = await fs.readFile(file);
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function existingFiles() {
  const result = [];
  for (const name of RELEASE_FILES) {
    const file = path.join(EXPORT_DIR, name);
    try {
      const stat = await fs.stat(file);
      if (stat.isFile()) result.push({ name, path: file, bytes: stat.size });
    } catch {}
  }
  return result;
}

async function buildRelease(version, options = {}) {
  if (!/^v?\d+\.\d+\.\d+$/.test(version)) throw new Error("version must use semantic versioning, e.g. 0.9.0");
  const normalized = version.startsWith("v") ? version : `v${version}`;
  const destination = path.join(RELEASES_DIR, normalized);
  try { await fs.access(destination); throw new Error(`release ${normalized} already exists; releases are immutable`); } catch (error) { if (error.code !== "ENOENT") throw error; }
  const files = await existingFiles();
  if (!files.some(f => f.name === "evaluations.jsonl")) throw new Error("evaluations.jsonl is missing; run npm run export first");
  await fs.mkdir(destination, { recursive: true });
  const checksums = {};
  for (const file of files) {
    await fs.copyFile(file.path, path.join(destination, file.name));
    checksums[file.name] = { sha256: await sha256(file.path), bytes: file.bytes };
  }
  const generatedAt = new Date().toISOString();
  const manifest = {
    dataset_name: "ModelJudge AI Human Preference Evaluations",
    release_version: normalized,
    release_id: `modeljudge-${normalized}`,
    generated_at: generatedAt,
    immutable: true,
    formats: ["JSONL", "CSV"],
    record_count: options.record_count ?? null,
    files: checksums,
    provenance: "Generated from the ModelJudge AI evaluation pipeline. Verify source permissions and reviewer provenance before commercial use.",
    license: "See repository LICENSE and dataset-specific provenance records.",
    verification: "SHA-256 checksums cover each file byte-for-byte."
  };
  await fs.writeFile(path.join(destination, "RELEASE-MANIFEST.json"), JSON.stringify(manifest, null, 2) + "\n");
  await fs.writeFile(path.join(destination, "BUYER-README.md"), `# ModelJudge AI ${normalized}\n\nThis directory is an immutable dataset release snapshot.\n\n## Verify files\n\nCompare each file's SHA-256 digest with \`RELEASE-MANIFEST.json\`.\n\n## Contents\n\n- \`evaluations.jsonl\`: primary machine-readable dataset\n- \`evaluations.csv\`: convenience tabular export\n- \`quality-filtered.jsonl\`: quality-filtered subset when generated\n- quality, reliability, reviewer-control and certification reports\n- \`manifest.json\`: pipeline metadata\n\n## Commercial-use note\n\nThis repository does not by itself grant rights to third-party source material or evaluator contributions. Confirm provenance, consent, licensing, and contractual terms before redistribution or commercial use.\n`);
  const latest = { release_version: normalized, release_path: `releases/${normalized}`, generated_at: generatedAt, immutable: true };
  await fs.writeFile(path.join(RELEASES_DIR, "LATEST.json"), JSON.stringify(latest, null, 2) + "\n");
  return manifest;
}

module.exports = { buildRelease, sha256, existingFiles, RELEASE_FILES };
