const assert = require("assert");
const v = require("../src/validate.js");

// Card number: exactly 16 digits, separators ignored.
assert.strictEqual(v.cardNumber("4111111111111111"), true);
assert.strictEqual(v.cardNumber("4111 1111 1111 1111"), true, "spaces are ignored");
assert.strictEqual(v.cardNumber("4111-1111-1111-1111"), true, "dashes are ignored");
assert.strictEqual(v.cardNumber("411111111111111"), false, "15 digits is not enough");
assert.strictEqual(v.cardNumber("41111111111111111"), false, "17 digits is too many");
assert.strictEqual(v.cardNumber(""), false);
assert.strictEqual(v.cardNumber(undefined), false, "undefined must not throw");

// Expiry: MM/YY with a real month.
assert.strictEqual(v.expiry("04/27"), true);
assert.strictEqual(v.expiry("12/30"), true);
assert.strictEqual(v.expiry("00/27"), false, "month 00 is invalid");
assert.strictEqual(v.expiry("13/27"), false, "month 13 is invalid");
assert.strictEqual(v.expiry("4/27"), false, "single-digit month is rejected");
assert.strictEqual(v.expiry("0427"), false, "missing separator is rejected");
assert.strictEqual(v.expiry(""), false);
assert.strictEqual(v.expiry(undefined), false);

// CVV: exactly 3 digits.
assert.strictEqual(v.cvv("123"), true);
assert.strictEqual(v.cvv("12"), false);
assert.strictEqual(v.cvv("1234"), false);
assert.strictEqual(v.cvv("abc"), false);

// cardValid requires all four fields.
assert.strictEqual(v.cardValid({ number: "4111111111111111", expiry: "04/27", cvv: "123", name: "A Morgan" }), true);
assert.strictEqual(v.cardValid({ number: "4111111111111111", expiry: "04/27", cvv: "123", name: "  " }), false, "whitespace name is rejected");
assert.strictEqual(v.cardValid({ number: "4111", expiry: "04/27", cvv: "123", name: "A" }), false);
assert.strictEqual(v.cardValid({}), false, "empty object must not throw");

// Typed confirmation is exact and case-sensitive, trimmed.
assert.strictEqual(v.confirmsDelete("DELETE"), true);
assert.strictEqual(v.confirmsDelete("  DELETE  "), true, "surrounding whitespace is trimmed");
assert.strictEqual(v.confirmsDelete("delete"), false, "must be uppercase");
assert.strictEqual(v.confirmsDelete("DELETE ACCOUNT"), false);
assert.strictEqual(v.confirmsDelete(""), false);
assert.strictEqual(v.confirmsDelete(undefined), false);
