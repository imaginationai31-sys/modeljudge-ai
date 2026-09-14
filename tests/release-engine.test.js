const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { buildRelease, sha256 } = require("../backend/release-engine");

test("release creation is immutable and records file checksums", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "modeljudge-release-"));
  try {
    const exportsDir = path.join(root, "exports");
    await fs.mkdir(exportsDir, { recursive: true });
    const dataset = '{"id":"MJ-000001"}\n';
    await fs.writeFile(path.join(exportsDir, "evaluations.jsonl"), dataset);

    const manifest = await buildRelease("1.0.0", { root_dir: root, record_count: 1 });
    const releaseDir = path.join(root, "releases", "v1.0.0");
    const releasedFile = path.join(releaseDir, "evaluations.jsonl");

    assert.equal(manifest.immutable, true);
    assert.equal(manifest.record_count, 1);
    assert.equal(manifest.files["evaluations.jsonl"].sha256, await sha256(releasedFile));
    assert.equal(manifest.files["evaluations.jsonl"].bytes, Buffer.byteLength(dataset));
    assert.equal(await fs.readFile(releasedFile, "utf8"), dataset);

    await assert.rejects(
      () => buildRelease("1.0.0", { root_dir: root, record_count: 1 }),
      /already exists; releases are immutable/
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("release creation fails when the canonical dataset export is missing", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "modeljudge-release-"));
  try {
    await fs.mkdir(path.join(root, "exports"), { recursive: true });
    await assert.rejects(
      () => buildRelease("1.0.0", { root_dir: root }),
      /evaluations\.jsonl is missing/
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
