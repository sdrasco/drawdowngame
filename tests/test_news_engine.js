const assert = require('assert');
const { maybeGenerateIndustryNews, TUNABLES, INDUSTRIES } = require('../docs/js/news_engine.js');

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

try {
  testMaybeGenerateIndustryNews();
  console.log('News engine test passed');
} catch (err) {
  console.error('News engine test failed');
  console.error(err);
  process.exit(1);
}
