// src/navcore.js  (CommonJS: require()-able by scripts/*.test.js under plain node)

let seq = 0;

function entry(name, params = {}) {
  seq += 1;
  return { key: `${name}#${seq}`, name, params };
}

function push(stack, name, params) {
  return [...stack, entry(name, params)];
}

function replace(stack, name, params) {
  return [...stack.slice(0, -1), entry(name, params)];
}

function back(stack) {
  return stack.length > 1 ? stack.slice(0, -1) : stack;
}

function root(name, params) {
  return [entry(name, params)];
}

function _resetSeq() {
  seq = 0;
}

module.exports = { entry, push, replace, back, root, _resetSeq };
