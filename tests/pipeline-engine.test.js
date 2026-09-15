const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { runPipeline, sha256 } = require("../scripts/pipeline-engine");

async function makeRoot() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "modeljudge-pipeline-"));
  await fs.mkdir(path.join(root, "data"), { recursive: true });
  await fs.writeFile(path.join(root, "data", "evaluations.jsonl"), '{"id":"MJ-TEST-001"}\n');
  return root;
}

test("pipeline runs stages in order and records deterministic output hashes", async () => {
  const root = await makeRoot();
  const stateFile = path.join(root, ".pipeline", "pipeline-manifest.json");
  const order = [];
  const stages = [
    { name: "validate", command: "validate-dataset.js", outputs: [] },
    { name: "export", command: "dataset-engine.js", outputs: ["exports/evaluations.jsonl"] },
    { name: "quality", command: "quality-filter.js", outputs: ["exports/quality-filtered.jsonl"] }
  ];
  try {
    const result = await runPipeline({
      rootDir: root,
      stateFile,
      inputFingerprint: "input-1",
      runId: "pipeline-test-1",
      stages,
      executeStage: async stage => {
        order.push(stage.name);
        for (const output of stage.outputs) {
          const file = path.join(root, output);
          await fs.mkdir(path.dirname(file), { recursive: true });
          await fs.writeFile(file, `${stage.name}\n`);
        }
        return { stdout: `${stage.name} complete` };
      }
    });

    assert.equal(result.status, "passed");
    assert.deepEqual(order, ["validate", "export", "quality"]);
    assert.equal(result.run_id, "pipeline-test-1");
    assert.equal(result.stages.length, 3);
    assert.equal(result.outputs[0].sha256, sha256(Buffer.from("export\n")));
    assert.equal(result.outputs[0].bytes, 7);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("identical input and configuration skips a completed pipeline", async () => {
  const root = await makeRoot();
  const stateFile = path.join(root, ".pipeline", "pipeline-manifest.json");
  let executions = 0;
  const stages = [{ name: "export", command: "dataset-engine.js", outputs: ["exports/evaluations.jsonl"] }];
  try {
    const executeStage = async stage => {
      executions++;
      const file = path.join(root, stage.outputs[0]);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, "stable\n");
    };
    const first = await runPipeline({ rootDir: root, stateFile, inputFingerprint: "same-input", stages, executeStage, runId: "first" });
    const second = await runPipeline({ rootDir: root, stateFile, inputFingerprint: "same-input", stages, executeStage, runId: "second" });

    assert.equal(first.status, "passed");
    assert.equal(second.status, "skipped");
    assert.equal(second.reason, "identical input and configuration");
    assert.equal(executions, 1);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("pipeline records a failed stage and stops subsequent stages", async () => {
  const root = await makeRoot();
  const stateFile = path.join(root, ".pipeline", "pipeline-manifest.json");
  const stages = [
    { name: "validate", command: "validate-dataset.js", outputs: [] },
    { name: "export", command: "dataset-engine.js", outputs: [] },
    { name: "quality", command: "quality-filter.js", outputs: [] }
  ];
  const order = [];
  try {
    await assert.rejects(
      () => runPipeline({
        rootDir: root,
        stateFile,
        stages,
        executeStage: async stage => {
          order.push(stage.name);
          if (stage.name === "export") throw new Error("export failed");
        }
      }),
      /Pipeline stage 'export' failed: export failed/
    );
    assert.deepEqual(order, ["validate", "export"]);
    const state = JSON.parse(await fs.readFile(stateFile, "utf8"));
    assert.equal(state.status, "failed");
    assert.equal(state.stages[1].status, "failed");
    assert.match(state.stages[1].error, /export failed/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
