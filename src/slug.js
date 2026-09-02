// src/slug.js  (CommonJS: must be require()-able by scripts/*.test.js under plain node)
//
// Single source of truth for testID derivation. Do not change this
// behavior - external agent suites depend on the exact strings it produces.
function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

module.exports = { slug };
