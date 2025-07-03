function erf(x) {
  // approximate error function using Abramowitz and Stegun formula 7.1.26
  const sign = Math.sign(x);
  x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const expTerm = Math.exp(-x * x);
  const poly = (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t;
  return sign * (1 - poly * expTerm);
}

function normCdf(x) {
  const erfFn = Math.erf || erf;
  return (1 + erfFn(x / Math.SQRT2)) / 2;
}

function blackScholesPrice(S, K, r, sigma, T, type) {
  if (T <= 0 || sigma <= 0) return Math.max(type === 'call' ? S - K : K - S, 0);
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  if (type.toLowerCase() === 'call') {
    return S * normCdf(d1) - K * Math.exp(-r * T) * normCdf(d2);
  }
  return K * Math.exp(-r * T) * normCdf(-d2) - S * normCdf(-d1);
}

if (typeof module !== 'undefined') {
  module.exports = { blackScholesPrice };
}
