const assert = require('assert');
const { normCdf, erf } = require('../docs/js/options.js');

function testNormCdfZero() {
  assert.strictEqual(normCdf(0), 0.5);
}

function testNormCdfSymmetry() {
  const samples = [-3, -1, -0.5, 0.5, 1, 3];
  for (const x of samples) {
    const expected = 1 - normCdf(-x);
    assert.ok(Math.abs(normCdf(x) - expected) < 1e-12);
  }
}

function testErfOne() {
  const approx = 0.8427;
  assert.ok(Math.abs(erf(1) - approx) < 1e-4);
}

try {
  testNormCdfZero();
  testNormCdfSymmetry();
  testErfOne();
  console.log('Options math tests passed');
} catch (err) {
  console.error('Options math tests failed');
  console.error(err);
  process.exit(1);
}
