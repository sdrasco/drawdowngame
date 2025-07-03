const {
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
} = require('../docs/js/player.js');
const { blackScholesPrice } = require('../docs/js/options.js');
const assert = require('assert');

function testBuySell() {
  const state = {
    cash: 1000,
    netWorth: 1000,
    prices: { AAPL: [[100,110,120,130,140]] },
    positions: {}
  };
  const price = 140;
  const buy = buyStock(state, 'AAPL', 5, price);
  assert.ok(buy.success);
  const buyFees = +(5 * price * TRADE_FEE_RATE).toFixed(2);
  const buyTotal = 5 * price + TRADE_COMMISSION + buyFees;
  assert.strictEqual(buy.fees, buyFees);
  assert.strictEqual(buy.total, buyTotal);
  assert.strictEqual(state.cash, 1000 - buyTotal);
  assert.strictEqual(state.positions['AAPL'].qty, 5);
  assert.strictEqual(state.positions['AAPL'].cost, buyTotal);
  computeNetWorth(state);
  assert.strictEqual(state.netWorth, +(1000 - buyFees - TRADE_COMMISSION).toFixed(2));

  const sell = sellStock(state, 'AAPL', 2, price);
  assert.ok(sell.success);
  const sellFees = +(2 * price * TRADE_FEE_RATE).toFixed(2);
  const sellTotal = 2 * price - TRADE_COMMISSION - sellFees;
  assert.strictEqual(sell.fees, sellFees);
  assert.strictEqual(sell.total, sellTotal);
  assert.strictEqual(state.cash, 1000 - buyTotal + sellTotal);
  assert.strictEqual(state.positions['AAPL'].qty, 3);
  computeNetWorth(state);
  const finalWorth = 1000 - buyFees - TRADE_COMMISSION - sellFees - TRADE_COMMISSION;
  assert.strictEqual(state.netWorth, +finalWorth.toFixed(2));
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

function testCalculateMaxBuy() {
  const price = 50;
  const cash = 1000;
  const expected = Math.floor((cash - TRADE_COMMISSION) / (price * (1 + TRADE_FEE_RATE)));
  const qty = calculateMaxBuy(cash, price);
  assert.strictEqual(qty, expected);
  assert.strictEqual(calculateMaxBuy(TRADE_COMMISSION - 1, price), 0);
}

function testBlackScholes() {
  const call = blackScholesPrice(100, 100, 0.05, 0.2, 1, 'call');
  const put = blackScholesPrice(100, 100, 0.05, 0.2, 1, 'put');
  assert.ok(Math.abs(call - 10.4506) < 1e-4);
  assert.ok(Math.abs(put - 5.5735) < 1e-4);
}

function testUpdateRank() {
  const state = { netWorth: 50001, rank: 'Novice' };
  updateRank(state);
  assert.strictEqual(state.rank, 'Apprentice');
}

function testRankNeverDecreases() {
  const state = { netWorth: 100000, rank: 'Novice' };
  updateRank(state);
  assert.strictEqual(state.rank, 'Apprentice');
  state.netWorth = 40000;
  updateRank(state);
  assert.strictEqual(state.rank, 'Apprentice');
}

try {
  testBuySell();
  testMetrics();
  testCalculateMaxBuy();
  testBlackScholes();
  testUpdateRank();
  testRankNeverDecreases();
  console.log('All tests passed');
} catch (err) {
  console.error('Test failed');
  console.error(err);
  process.exit(1);
}
