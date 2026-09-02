// Fixture for selfcheck.test.js: a test file that throws a non-Error value
// (null). Used to verify selfcheck.js does not crash the runner loop and
// keeps going to later files (see b-runs-after.test.js in this same dir).
throw null;
