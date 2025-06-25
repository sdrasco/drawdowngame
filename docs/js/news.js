// Generate weekly headlines from company news pools
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function generateHeadlines() {
  const n = Math.floor(Math.random() * 5); // 0-4
  if (n === 0) {
    return ['No market headlines this week.'];
  }
  const available = companies.filter(c => !c.isIndex);
  shuffle(available);
  const chosen = available.slice(0, n);
  const result = [];
  chosen.forEach(c => {
    const type = Math.random() < 0.5 ? 'good_news_headlines' : 'bad_news_headlines';
    const pool = c[type] || [];
    if (pool.length) {
      const idx = Math.floor(Math.random() * pool.length);
      result.push(pool[idx]);
    }
  });
  return result;
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
  headlines.forEach(text => {
    const div = document.createElement('div');
    div.className = 'headline';
    div.textContent = text;
    container.appendChild(div);
  });
}
