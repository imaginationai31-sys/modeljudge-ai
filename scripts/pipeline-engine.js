#!/usr/bin/env node

const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);
const ROOT_DIR = path.join(__dirname, "..");

const BASE_STAGES = [
  { name: "validate", command: "validate-dataset.js", outputs: [] },
  { name: "export", command: "dataset-engine.js", outputs: ["exports/evaluations.jsonl", "exports/evaluations.csv", "exports/manifest.json", "exports/quality-report.json"] },
  { name: "filter", command: "quality-filter.js", outputs: ["exports/quality-filtered.jsonl", "exports/quality-filter-report.json"] },
  { name: "reliability", command: "reliability-report.js", outputs: ["exports/reliability-report.json"] },
  { name: "reviewer-control", command: "reviewer-quality-control.js", outputs: ["exports/reviewer-control-report.json", "exports/reviewer-quality.json"] },
  { name: "certification", command: "certification-report.js", outputs: ["exports/certification-report.json"] }
];

function pipelineStages(releaseVersion = process.env.PIPELINE_RELEASE_VERSION) {
  if (!releaseVersion) return BASE_STAGES;
  return [...BASE_STAGES, {
    name: "release",
    command: "create-release.js",
    args: [releaseVersion],
    outputs: [`releases/v${releaseVersion}/RELEASE-MANIFEST.json`, `releases/v${releaseVersion}/BUYER-README.md`]
  }];
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function fileHash(filePath) {
  try {
    const data = await fs.readFile(filePath);
    return { sha256: sha256(data), bytes: data.length };
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function fingerprintInput(rootDir) {
  const input = await fileHash(path.join(rootDir, "data", "evaluations.jsonl"));
  return input ? input.sha256 : sha256("missing-dataset");
}

async function readState(stateFile) {
  try { return JSON.parse(await fs.readFile(stateFile, "utf8")); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
}

async function writeState(stateFile, state) {
  await fs.mkdir(path.dirname(stateFile), { recursive: true });
  const tempFile = `${stateFile}.${process.pid}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(state, null, 2) + "\n");
  await fs.rename(tempFile, stateFile);
}

function defaultExecutor(stage, rootDir) {
  return execFileAsync(process.execPath, [path.join(rootDir, "scripts", stage.command), ...(stage.args || [])], {
    cwd: rootDir,
    env: process.env,
    maxBuffer: 10 * 1024 * 1024
  });
}

async function runPipeline(options = {}) {
  const rootDir = options.rootDir || ROOT_DIR;
  const stateFile = options.stateFile || path.join(rootDir, ".pipeline", "pipeline-manifest.json");
  const stages = options.stages || pipelineStages(options.releaseVersion);
  const executor = options.executeStage || defaultExecutor;
  const inputFingerprint = options.inputFingerprint || await fingerprintInput(rootDir);
  const config = {
    dataset_version: process.env.DATASET_VERSION || "1.0.0",
    release_version: options.releaseVersion || process.env.PIPELINE_RELEASE_VERSION || null,
    stages: stages.map(stage => ({ name: stage.name, command: stage.command, args: stage.args || [] }))
  };
  const configFingerprint = sha256(JSON.stringify(config));
  const previous = await readState(stateFile);

  if (previous && previous.input_sha256 === inputFingerprint && previous.config_sha256 === configFingerprint) {
    const outputChecks = await Promise.all((previous.outputs || []).map(output => fileHash(path.join(rootDir, output.path))));
    if (outputChecks.length > 0 && outputChecks.every(Boolean)) {
      return { ...previous, status: "skipped", reason: "identical input and configuration" };
    }
  }

  const runId = options.runId || `pipeline-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}-${process.pid}`;
  const startedAt = new Date().toISOString();
  const stageResults = [];
  const allOutputs = [];

  for (const stage of stages) {
    const stageStarted = Date.now();
    try {
      const result = await executor(stage, rootDir);
      const outputFiles = [];
      for (const relativePath of stage.outputs || []) {
        const metadata = await fileHash(path.join(rootDir, relativePath));
        if (!metadata) throw new Error(`Stage ${stage.name} did not produce required output: ${relativePath}`);
        outputFiles.push({ path: relativePath, ...metadata });
        allOutputs.push({ path: relativePath, ...metadata });
      }
      stageResults.push({
        name: stage.name,
        command: stage.command,
        status: "passed",
        duration_ms: Date.now() - stageStarted,
        outputs: outputFiles,
        stdout: result && result.stdout ? result.stdout.trim().slice(-2000) : ""
      });
    } catch (error) {
      stageResults.push({ name: stage.name, command: stage.command, status: "failed", duration_ms: Date.now() - stageStarted, error: error.message });
      const failedState = {
        pipeline: "ModelJudge AI dataset pipeline",
        run_id: runId,
        status: "failed",
        started_at: startedAt,
        finished_at: new Date().toISOString(),
        input_sha256: inputFingerprint,
        config_sha256: configFingerprint,
        config,
        stages: stageResults,
        outputs: allOutputs
      };
      await writeState(stateFile, failedState);
      throw Object.assign(new Error(`Pipeline stage '${stage.name}' failed: ${error.message}`), { pipelineState: failedState });
    }
  }

  const state = {
    pipeline: "ModelJudge AI dataset pipeline",
    run_id: runId,
    status: "passed",
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    input_sha256: inputFingerprint,
    config_sha256: configFingerprint,
    config,
    stages: stageResults,
    outputs: allOutputs
  };
  await writeState(stateFile, state);
  return state;
}

if (require.main === module) {
  runPipeline().then(state => {
    console.log(JSON.stringify(state, null, 2));
  }).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { BASE_STAGES, pipelineStages, fileHash, fingerprintInput, runPipeline, sha256 };
