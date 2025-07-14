const assert = require('assert');
const { computeNetWorth } = require('../docs/js/player.js');
const { blackScholesPrice } = require('../docs/js/options.js');

function testOptionValuation() {
  const state = {
    cash: 1000,
    netWorth: 1000,
    week: 5,
    prices: {
      ABC: [[50, 52, 54, 56, 58]],
      XYZ: [[30, 32, 31, 33, 32]]
    },
    options: [
      { symbol: 'ABC', type: 'call', strike: 55, qty: 1, purchaseWeek: 3, weeksToExpiry: 3 },
      { symbol: 'XYZ', type: 'put', strike: 31, qty: 2, purchaseWeek: 1, weeksToExpiry: 3 }
    ]
  };

  // Expected value for the active option (ABC)
  const active = { ...state.options[0] };
  const remaining = active.weeksToExpiry - (state.week - active.purchaseWeek);
  const priceData = state.prices[active.symbol];
  const lastWeek = priceData[priceData.length - 1];
  const S = lastWeek[lastWeek.length - 1];
  const optVal = blackScholesPrice(S, active.strike, 0.01, 0.3, remaining / 52, active.type);
  const expectedWorth = +(state.cash + optVal * active.qty).toFixed(2);

  computeNetWorth(state);

  assert.strictEqual(state.options.length, 1);
  assert.deepStrictEqual(state.options[0], active);
  assert.strictEqual(state.netWorth, expectedWorth);
}

try {
  testOptionValuation();
  console.log('Option valuation test passed');
} catch (err) {
  console.error('Option valuation test failed');
  console.error(err);
  process.exit(1);
}
