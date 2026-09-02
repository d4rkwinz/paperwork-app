// Fixture for selfcheck.test.js: a test file that throws a real Error.
// Used to verify selfcheck.js reports FAIL and exits non-zero.
const assert = require("assert");

assert.strictEqual(1 + 1, 3, "deliberately wrong on purpose (fixture)");
