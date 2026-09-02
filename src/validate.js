// src/validate.js  (CommonJS: require()-able by scripts/*.test.js under plain node)

function digits(value) {
  return String(value == null ? "" : value).replace(/\D/g, "");
}

function cardNumber(value) {
  return digits(value).length === 16;
}

function expiry(value) {
  const match = /^(\d{2})\/(\d{2})$/.exec(String(value == null ? "" : value).trim());
  if (!match) return false;
  const month = Number(match[1]);
  return month >= 1 && month <= 12;
}

function cvv(value) {
  return digits(value).length === 3;
}

function cardValid(fields) {
  const f = fields || {};
  return (
    cardNumber(f.number) &&
    expiry(f.expiry) &&
    cvv(f.cvv) &&
    String(f.name == null ? "" : f.name).trim().length > 0
  );
}

function confirmsDelete(value) {
  return String(value == null ? "" : value).trim() === "DELETE";
}

module.exports = { cardNumber, expiry, cvv, cardValid, confirmsDelete };
