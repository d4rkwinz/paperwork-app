const assert = require("assert");

// The harness must be able to require a file and run asserts in it.
assert.strictEqual(1 + 1, 2, "arithmetic works");

// The harness must surface a thrown assert as a failure. Verified manually in
// Step 2 by temporarily inverting this assertion.
assert.ok(true, "harness reaches the end of the file");
