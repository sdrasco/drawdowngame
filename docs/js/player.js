// Placeholder for player portfolio logic. The final implementation should
// track positions and compute metrics such as:
// - Max drawdown (%): largest peak-to-trough decline
// - Sharpe ratio: average return divided by return standard deviation
// - Gain to Pain ratio: total return divided by the absolute value of all negative returns

function calculateMaxDrawdown(history) {
  // TODO: implement max drawdown calculation
}

function calculateSharpeRatio(returns) {
  // TODO: implement sharpe ratio calculation
}

function calculateGainToPainRatio(returns) {
  // TODO: implement gain to pain ratio calculation
}

function buyStock(state, symbol, qty, price) {
  const cost = qty * price;
  if (state.cash < cost) return false;
  state.cash -= cost;
  if (!state.positions[symbol]) {
    state.positions[symbol] = { qty: 0, cost: 0 };
  }
  state.positions[symbol].qty += qty;
  state.positions[symbol].cost += cost;
  computeNetWorth(state);
  return true;
}

function sellStock(state, symbol, qty, price) {
  const pos = state.positions[symbol];
  if (!pos || pos.qty < qty) return false;
  const avgCost = pos.cost / pos.qty;
  pos.qty -= qty;
  pos.cost -= avgCost * qty;
  if (pos.qty <= 0) delete state.positions[symbol];
  state.cash += qty * price;
  computeNetWorth(state);
  return true;
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
  state.netWorth = +total.toFixed(2);
  return state.netWorth;
}

if (typeof module !== 'undefined') {
  module.exports = { buyStock, sellStock, computeNetWorth };
}
