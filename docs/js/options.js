function normCdf(x) {
  return (1 + Math.erf(x / Math.SQRT2)) / 2;
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
