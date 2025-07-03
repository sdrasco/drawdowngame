// Generate weekly headlines from company news pools
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

const INDUSTRY_MAP = {
  Software: 'Computer / Tech',
  Semiconductors: 'Computer / Tech',
  Retail: 'Retail',
  Energy: 'Oil and Gas',
  Banking: 'Heavy Industry / Materials',
  Healthcare: 'Healthcare',
  Utilities: 'Utilities',
  'Financial Services': 'Financial Services'
};

function generateHeadlines() {
  const result = [];
  if (typeof maybeGenerateIndustryNews === 'function') {
    maybeGenerateIndustryNews(result);
  }

  let n = Math.floor(Math.random() * 5); // 0-4 company headlines
  if (n === 0 && result.length === 0) {
    return [{ text: 'No market headlines this week.' }];
  }
  const available = companies.filter(c => !c.isIndex);
  shuffle(available);
  const chosen = available.slice(0, Math.min(n, 4 - result.length));
  chosen.forEach(c => {
    const typeKey = Math.random() < 0.5 ? 'good_news_headlines' : 'bad_news_headlines';
    const pool = c[typeKey] || [];
    if (pool.length) {
      const idx = Math.floor(Math.random() * pool.length);
      result.push({
        text: pool[idx],
        symbol: c.symbol,
        type: typeKey === 'good_news_headlines' ? 'good' : 'bad',
        impact: Math.random() < 0.5
      });
    }
  });

  // convert industry events to a common format and limit to 4 total
  result.forEach(evt => {
    if (evt.industry) {
      evt.text = evt.headline;
      evt.category = INDUSTRY_MAP[evt.industry] || evt.industry;
    }
  });

  return result.slice(0, 4);
}

function renderNews() {
  const container = document.getElementById('news');
  if (!container) return;
  container.innerHTML = '';
  let headlines = gameState.headlines[gameState.week];
  if (!headlines) {
    headlines = generateHeadlines();
    gameState.headlines[gameState.week] = headlines;
    saveState(gameState);
  }
  headlines.forEach(h => {
    const div = document.createElement('div');
    div.className = 'headline';
    const text = (h && h.text) || h;
    div.textContent = text;
    container.appendChild(div);
  });
}
