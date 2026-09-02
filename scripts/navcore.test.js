const assert = require("assert");
const nav = require("../src/navcore.js");

nav._resetSeq();

// entry() assigns a unique key even for the same route name.
const a = nav.entry("Home");
const b = nav.entry("Home");
assert.notStrictEqual(a.key, b.key, "two entries for the same name get different keys");
assert.strictEqual(a.name, "Home");
assert.deepStrictEqual(a.params, {}, "params defaults to an empty object");

// push appends without mutating.
const s0 = nav.root("Home");
const s1 = nav.push(s0, "ServiceDetail", { serviceId: "plumbing" });
assert.strictEqual(s0.length, 1, "push does not mutate the input stack");
assert.strictEqual(s1.length, 2);
assert.strictEqual(s1[1].name, "ServiceDetail");
assert.strictEqual(s1[1].params.serviceId, "plumbing");

// replace swaps the top and keeps the length.
const s2 = nav.replace(s1, "BookingForm", { serviceId: "plumbing" });
assert.strictEqual(s2.length, 2, "replace keeps stack length");
assert.strictEqual(s2[1].name, "BookingForm");
assert.notStrictEqual(s2[1].key, s1[1].key, "replace assigns a fresh key so the screen remounts");

// back pops, and is identity at the root.
const s3 = nav.back(s2);
assert.strictEqual(s3.length, 1);
const s4 = nav.back(s3);
assert.strictEqual(s4, s3, "back at the root returns the same reference");

// root resets to a single entry.
const s5 = nav.root("Requests");
assert.strictEqual(s5.length, 1);
assert.strictEqual(s5[0].name, "Requests");

// THE REGRESSION THIS TASK RISKS: navigating between two routes that share one
// component must produce different keys, or React reuses the instance and
// useState initializers never re-run, leaking form drafts across routes.
const alias1 = nav.push(nav.root("Billing"), "HelpCenter");
const alias2 = nav.replace(alias1, "SupportFaq");
assert.notStrictEqual(alias1[1].key, alias2[1].key, "aliased routes get distinct keys");

// Keys must be unique across a long session including cycles.
let stack = nav.root("Home");
for (let i = 0; i < 50; i += 1) {
  stack = nav.push(stack, i % 2 === 0 ? "Referral" : "Profile");
}
const keys = stack.map((e) => e.key);
assert.strictEqual(new Set(keys).size, keys.length, "50 pushes through a cycle produce unique keys");
