/**
 * ──────────────────────────────────────────────────────────────────────────
 *  Black‑Scholes‑Merton utilities for drawdowngame.com
 * ──────────────────────────────────────────────────────────────────────────
 *
 *  S      … spot price of the underlying asset
 *  K      … strike price
 *  r      … continuously‑compounded risk‑free annual rate (decimal, e.g. 0.03)
 *  sigma  … annualised volatility of log‑returns (decimal, e.g. 0.25)
 *  T      … time to expiry in years (days ÷ 365, months ÷ 12, etc.)
 *  type   … "call" | "put"  (case‑insensitive)
 *
 *  All functions are pure and side‑effect‑free.
 *  Accuracy is better than 0.1 ¢ for vanilla equity options—plenty for a game.
 */

/* ── cached Math constants for micro‑speed & clarity ──────────────────── */
const SQRT2 = Math.SQRT2;
const LOG   = Math.log;
const EXP   = Math.exp;

/* ── error‑function approximation (A&S 7.1.26) ────────────────────────── */
function erfFallback(x) {
  const sign = Math.sign(x);
  x = Math.abs(x);

  // Abramowitz & Stegun 7.1.26 coefficients
  const t  = 1 / (1 + 0.3275911 * x);
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;

  const poly = (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t);
  return sign * (1 - poly * EXP(-x * x));
}

/* ── pick native erf if the JS engine has it ──────────────────────────── */
const erf = typeof Math.erf === 'function' ? Math.erf : erfFallback;

/* ── standard‑normal CDF Φ(x) ─────────────────────────────────────────── */
function normCdf(z) {
  // Φ(z) = ½ [1 + erf(z / √2)]
  return 0.5 * (1 + erf(z / SQRT2));
}

/* ── Black‑Scholes‑Merton price for European call/put ─────────────────── */
function blackScholesPrice(S, K, r, sigma, T, type) {
  const isCall = String(type).toLowerCase() === 'call';

  /* intrinsic value when time or volatility vanish */
  if (T <= 0 || sigma <= 0) {
    return Math.max(isCall ? S - K : K - S, 0);
  }

  const sqrtT = Math.sqrt(T);
  const d1 = (LOG(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;

  return isCall
    ? S * normCdf(d1)             - K * EXP(-r * T) * normCdf(d2)
    : K * EXP(-r * T) * normCdf(-d2) - S * normCdf(-d1);
}

/* ── module exports (CommonJS + ESM) ──────────────────────────────────── */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { blackScholesPrice, normCdf, erf: erfFallback };
} else if (typeof window !== 'undefined') {
  window.blackScholesPrice = blackScholesPrice;
  window.normCdf = normCdf;
  window.erf = erf;
}
