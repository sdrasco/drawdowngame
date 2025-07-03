// Placeholder for player portfolio logic. The final implementation should
// track positions and compute metrics such as:
// - Max drawdown (%): largest peak-to-trough decline
// - Sharpe ratio: average return divided by return standard deviation
// - Gain to Pain ratio: total return divided by the absolute value of all negative returns

let bsPrice = typeof blackScholesPrice === 'function' ? blackScholesPrice : null;
if (typeof module !== 'undefined' && !bsPrice) {
  try { bsPrice = require('./options.js').blackScholesPrice; } catch { /* ignore */ }
}
const OPTION_RISK_FREE_RATE = 0.01;
const OPTION_VOLATILITY = 0.3;

function calculateMaxDrawdown(history) {
  if (!history || history.length === 0) return 0;
  let peak = history[0];
  let maxDD = 0;
  for (let i = 1; i < history.length; i++) {
    const value = history[i];
    if (value > peak) {
      peak = value;
    } else {
      const dd = (peak - value) / peak;
      if (dd > maxDD) maxDD = dd;
    }
  }
  return +(maxDD * 100).toFixed(2);
}

function calculateSharpeRatio(returns) {
  if (!returns || returns.length === 0) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
  const std = Math.sqrt(variance);
  if (std === 0) return 0;
  return +(mean / std).toFixed(4);
}

function calculateGainToPainRatio(returns) {
  if (!returns || returns.length === 0) return 0;
  const total = returns.reduce((a, b) => a + b, 0);
  const pain = returns.filter(r => r < 0).reduce((a, b) => a + Math.abs(b), 0);
  if (pain === 0) return 0;
  return +(total / pain).toFixed(4);
}

const TRADE_COMMISSION = 4.95;
const TRADE_FEE_RATE = 0.001; // 0.1% of trade value

function calculateMaxBuy(cash, price) {
  if (cash <= TRADE_COMMISSION || price <= 0) return 0;
  const perShare = price * (1 + TRADE_FEE_RATE);
  return Math.max(0, Math.floor((cash - TRADE_COMMISSION) / perShare));
}

function buyStock(state, symbol, qty, price) {
  const tradeValue = qty * price;
  const commission = TRADE_COMMISSION;
  const fees = +(tradeValue * TRADE_FEE_RATE).toFixed(2);
  const total = tradeValue + commission + fees;
  if (state.cash < total) return { success: false };
  state.cash -= total;
  if (!state.positions[symbol]) {
    state.positions[symbol] = { qty: 0, cost: 0 };
  }
  state.positions[symbol].qty += qty;
  state.positions[symbol].cost += total;
  computeNetWorth(state);
  return { success: true, commission, fees, total };
}

function sellStock(state, symbol, qty, price) {
  const pos = state.positions[symbol];
  if (!pos || pos.qty < qty) return { success: false };
  const tradeValue = qty * price;
  const commission = TRADE_COMMISSION;
  const fees = +(tradeValue * TRADE_FEE_RATE).toFixed(2);
  const proceeds = tradeValue - commission - fees;
  const avgCost = pos.cost / pos.qty;
  pos.qty -= qty;
  pos.cost -= avgCost * qty;
  if (pos.qty <= 0) delete state.positions[symbol];
  state.cash += proceeds;
  computeNetWorth(state);
  return { success: true, commission, fees, total: proceeds };
}

function computeNetWorth(state) {
  let total = state.cash;
  const posKeys = Object.keys(state.positions || {});
  posKeys.forEach(sym => {
    const priceData = state.prices[sym];
    if (!priceData || priceData.length === 0) return;
    const week = priceData[priceData.length - 1];
    const price = week[week.length - 1];
    total += state.positions[sym].qty * price;
  });
  const activeOpts = [];
  (state.options || []).forEach(opt => {
    const remaining = opt.weeksToExpiry - (state.week - opt.purchaseWeek);
    if (remaining <= 0) return;
    const priceData = state.prices[opt.symbol];
    if (priceData && priceData.length > 0 && bsPrice) {
      const week = priceData[priceData.length - 1];
      const S = week[week.length - 1];
      const optionVal = bsPrice(S, opt.strike, OPTION_RISK_FREE_RATE,
                                OPTION_VOLATILITY, remaining / 52, opt.type);
      total += optionVal * opt.qty;
    }
    activeOpts.push(opt);
  });
  state.options = activeOpts;
  state.netWorth = +total.toFixed(2);
  return state.netWorth;
}

function updateRank(state) {
  const worth = state.netWorth;
  if (worth > 1000000) {
    state.rank = 'Tycoon';
  } else if (worth > 250000) {
    state.rank = 'Trader';
  } else if (worth > 50000) {
    state.rank = 'Apprentice';
  } else {
    state.rank = 'Novice';
  }
  return state.rank;
}

if (typeof module !== 'undefined') {
  module.exports = {
    buyStock,
    sellStock,
    computeNetWorth,
    calculateMaxDrawdown,
    calculateSharpeRatio,
    calculateGainToPainRatio,
    calculateMaxBuy,
    updateRank,
    TRADE_COMMISSION,
    TRADE_FEE_RATE
  };
}
