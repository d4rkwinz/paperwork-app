// Fixture for selfcheck.test.js: sorts after a-throws-null.test.js
// alphabetically. Its PASS must still show up in selfcheck output, proving
// that a `throw null` in an earlier file does not abort the run early.
const assert = require("assert");

assert.strictEqual(1 + 1, 2, "runs after the throw-null fixture");
