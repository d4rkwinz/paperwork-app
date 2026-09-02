// Runs every scripts/*.test.js under plain node. No test framework by design.
//
// ponytail: synchronous require() only — an assertion inside a setTimeout or
// promise callback never fires, so such a file always reports PASS. Upgrade
// path: await a default-exported async function per test file, if async tests
// ever become necessary.
const fs = require("fs");
const path = require("path");

const dir = path.resolve(process.argv[2] || __dirname);
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".test.js")).sort();

if (files.length === 0) {
  console.error(`selfcheck: no *.test.js files found in ${dir}`);
  process.exit(1);
}

let failed = 0;
for (const file of files) {
  try {
    require(path.join(dir, file));
    console.log(`PASS ${file}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL ${file}`);
    // err can be anything a test file throws (null, undefined, a string, a
    // plain object, an Error) — never assume it has a .message.
    if (err instanceof Error) {
      console.error(err.stack || err.message);
    } else {
      console.error(String(err));
    }
  }
}

console.log(`\n${files.length - failed}/${files.length} files passed`);
process.exit(failed === 0 ? 0 : 1);
