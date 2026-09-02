const assert = require("assert");
const path = require("path");
const { spawnSync } = require("child_process");

// Meta-test: proves selfcheck.js's failure signal is real by spawning it
// (as a subprocess, so process.exit() inside it can't kill this run) against
// small fixture directories under scripts/fixtures/. Those fixtures are not
// *.test.js files themselves at the scripts/ top level, and selfcheck.js
// scans its target directory non-recursively (fs.readdirSync, no descent
// into subdirectories), so this outer run never picks them up as its own
// tests.
const SELFCHECK = path.join(__dirname, "selfcheck.js");
const FIXTURES = path.join(__dirname, "fixtures");

function run(fixtureName) {
  const result = spawnSync(process.execPath, [SELFCHECK, path.join(FIXTURES, fixtureName)], {
    encoding: "utf8",
  });
  return {
    status: result.status,
    output: `${result.stdout}\n${result.stderr}`,
  };
}

// A fixture dir with a test file that throws must fail loudly.
{
  const { status, output } = run("throws");
  assert.notStrictEqual(status, 0, "selfcheck should exit non-zero when a test throws");
  assert.ok(output.includes("FAIL"), "output should mention FAIL");
}

// A fixture dir with a passing test file must succeed.
{
  const { status, output } = run("passing");
  assert.strictEqual(status, 0, "selfcheck should exit 0 when all tests pass");
  assert.ok(output.includes("PASS"), "output should mention PASS");
}

// An empty fixture dir (no *.test.js) must fail with a clear message.
{
  const { status, output } = run("empty");
  assert.notStrictEqual(status, 0, "selfcheck should exit non-zero when no test files exist");
  assert.ok(
    /no \*?\.?test\.js files found/i.test(output) || /no.*test files/i.test(output),
    "output should mention that no test files were found"
  );
}

// `throw null` must not crash the runner loop: it must be reported as a
// failure, AND the alphabetically later file in the same directory must
// still run and be reported (proving the loop did not abort early).
{
  const { status, output } = run("throw-null");
  assert.notStrictEqual(status, 0, "selfcheck should exit non-zero on `throw null`");
  assert.ok(output.includes("FAIL a-throws-null.test.js"), "the throw-null file should be reported as FAIL");
  assert.ok(
    output.includes("b-runs-after.test.js"),
    "a later test file in the same dir must still run after `throw null`"
  );
  assert.ok(output.includes("PASS b-runs-after.test.js"), "the later test file should pass and be reported");
}
