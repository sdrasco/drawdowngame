const assert = require('assert');
const { maybeGenerateIndustryNews, applyNewsEffects, INDUSTRIES } = require('../docs/js/news_engine.js');

function testMaybeGenerateIndustryNews() {
  // Stub Math.random to deterministic value so at least one event triggers
  const originalRandom = Math.random;
  Math.random = () => 0.01; // Always below pIndustryEvent and 0.5 threshold

  const feed = [];
  maybeGenerateIndustryNews(feed);

  // Restore Math.random
  Math.random = originalRandom;

  assert.ok(feed.length > 0, 'no events were generated');
  const event = feed[0];

  // Validate required fields exist
  assert.ok(event.hasOwnProperty('industry'));
  assert.ok(event.hasOwnProperty('sentiment'));
  assert.ok(event.hasOwnProperty('magnitude'));
  assert.ok(event.hasOwnProperty('headline'));

  // Check industry comes from INDUSTRIES list
  assert.ok(INDUSTRIES.includes(event.industry));
}

function testApplyNewsEffects() {
  const stocks = [
    { industry: 'Software', jump: 0, driftBump: [] },
    { industry: 'Energy', jump: 0, driftBump: [] },
    { industry: 'Banking', jump: 0, driftBump: [] }
  ];
  const events = [
    { industry: 'Software', sentiment: 1 },
    { industry: 'Energy', sentiment: -1 }
  ];
  const baseJump = 0.02;
  const baseDelta = 0.01;
  const days = 5;

  const originalRandom = Math.random;
  Math.random = () => 0.5; // Deterministic eps

  applyNewsEffects(stocks, events, baseJump, baseDelta, days);

  Math.random = originalRandom;

  // Software event positive
  assert.strictEqual(stocks[0].jump, baseJump);
  assert.strictEqual(stocks[0].driftBump.length, 1);
  assert.strictEqual(stocks[0].driftBump[0].delta, baseDelta);
  assert.strictEqual(stocks[0].driftBump[0].daysLeft, days);

  // Energy event negative
  assert.strictEqual(stocks[1].jump, -baseJump);
  assert.strictEqual(stocks[1].driftBump.length, 1);
  assert.strictEqual(stocks[1].driftBump[0].delta, -baseDelta);
  assert.strictEqual(stocks[1].driftBump[0].daysLeft, days);

  // Banking unaffected
  assert.strictEqual(stocks[2].jump, 0);
  assert.strictEqual(stocks[2].driftBump.length, 0);
}

try {
  testMaybeGenerateIndustryNews();
  testApplyNewsEffects();
  console.log('News engine tests passed');
} catch (err) {
  console.error('News engine tests failed');
  console.error(err);
  process.exit(1);
}
