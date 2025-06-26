const {
  buyStock,
  sellStock,
  computeNetWorth,
  calculateMaxDrawdown,
  calculateSharpeRatio,
  calculateGainToPainRatio
} = require('../docs/js/player.js');
const assert = require('assert');

function testBuySell() {
  const state = {
    cash: 1000,
    netWorth: 1000,
    prices: { AAPL: [[100,110,120,130,140]] },
    positions: {}
  };
  const price = 140;
  assert.ok(buyStock(state, 'AAPL', 5, price));
  assert.strictEqual(state.cash, 1000 - 5 * price);
  assert.strictEqual(state.positions['AAPL'].qty, 5);
  assert.strictEqual(state.positions['AAPL'].cost, 5 * price);
  computeNetWorth(state);
  assert.strictEqual(state.netWorth, 1000);

  assert.ok(sellStock(state, 'AAPL', 2, price));
  assert.strictEqual(state.cash, 1000 - 5 * price + 2 * price);
  assert.strictEqual(state.positions['AAPL'].qty, 3);
  computeNetWorth(state);
  assert.strictEqual(state.netWorth, 1000);
}

function testMetrics() {
  const history = [100, 110, 105, 120, 118];
  const returns = [];
  for (let i = 1; i < history.length; i++) {
    returns.push((history[i] - history[i - 1]) / history[i - 1]);
  }
  const dd = calculateMaxDrawdown(history);
  const sr = calculateSharpeRatio(returns);
  const gp = calculateGainToPainRatio(returns);
  assert.ok(Math.abs(dd - 4.55) < 0.01);
  assert.ok(sr > 0.57 && sr < 0.58);
  assert.ok(gp > 2.9 && gp < 2.92);
}

try {
  testBuySell();
  testMetrics();
  console.log('All tests passed');
} catch (err) {
  console.error('Test failed');
  console.error(err);
  process.exit(1);
}
