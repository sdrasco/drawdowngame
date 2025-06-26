const { buyStock, sellStock, computeNetWorth } = require('../docs/js/player.js');
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

try {
  testBuySell();
  console.log('All tests passed');
} catch (err) {
  console.error('Test failed');
  console.error(err);
  process.exit(1);
}
