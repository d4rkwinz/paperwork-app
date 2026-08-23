// Runs every scripts/*.test.js under plain node. No test framework by design.
const fs = require("fs");
const path = require("path");

const dir = __dirname;
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".test.js")).sort();

if (files.length === 0) {
  console.error("selfcheck: no *.test.js files found in scripts/");
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
    console.error(err.message);
  }
}

console.log(`\n${files.length - failed}/${files.length} files passed`);
process.exit(failed === 0 ? 0 : 1);
