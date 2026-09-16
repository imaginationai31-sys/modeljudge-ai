const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

test("environment manifest stays synchronized with the application config", () => {
  const script = path.join(__dirname, "..", "scripts", "check-env.js");
  const result = spawnSync(process.execPath, [script], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Environment manifest OK/);
});
