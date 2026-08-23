const assert = require("assert");
const data = require("../src/data.js");

const { SERVICES, DATES, TIMES, PRIORITIES, ADDRESSES, INITIAL_REQUESTS } = data;

assert.ok(Array.isArray(SERVICES) && SERVICES.length > 0, "SERVICES is a non-empty array");

// Every service has the fields the screens dereference without guarding.
for (const s of SERVICES) {
  for (const field of ["id", "title", "category", "short", "details", "price", "eta", "accent"]) {
    assert.ok(s[field], `service ${s.id} has ${field}`);
  }
  assert.match(s.accent, /^#[0-9A-Fa-f]{6}$/, `service ${s.id} accent is a hex color`);
}

// Service ids must be unique - they are used as route params.
const ids = SERVICES.map((s) => s.id);
assert.strictEqual(new Set(ids).size, ids.length, "service ids are unique");

// Every seeded request points at a real service and a real address.
for (const r of INITIAL_REQUESTS) {
  assert.ok(ids.includes(r.serviceId), `request ${r.id} references a real service`);
  assert.ok(ADDRESSES.includes(r.address), `request ${r.id} uses a seeded address`);
  assert.ok(DATES.includes(r.date) || /^[A-Z][a-z]{2} [A-Z][a-z]{2} \d+$/.test(r.date), `request ${r.id} date is a choice or a literal date`);
  assert.ok(TIMES.includes(r.time), `request ${r.id} time is one of TIMES`);
  assert.ok(PRIORITIES.includes(r.priority), `request ${r.id} priority is one of PRIORITIES`);
  assert.ok(Array.isArray(r.timeline) && r.timeline.length > 0, `request ${r.id} has a timeline`);
}

// Request ids must be unique - they are route params and testID suffixes.
const reqIds = INITIAL_REQUESTS.map((r) => r.id);
assert.strictEqual(new Set(reqIds).size, reqIds.length, "request ids are unique");
