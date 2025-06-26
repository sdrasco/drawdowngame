let companies = [];
let gameState;
const INDEX_SYMBOL = 'INDEX';
let indexShares = {};
const START_WEEK = 14;

fetch('data/company_master_data.json')
  .then(r => r.json())
  .then(data => {
    companies = data.companies;
    // keep mu as provided; drift direction will change week by week
    setupMarketIndex();
    ensureUser(() => {
      startGame();
    });
  });

function randPct(mu, sigma) {
  return mu + sigma * (Math.random() * 2 - 1);
}

function generateWeekPrices(lastPrice, mu, sigma) {
  const prices = [];
  let price = lastPrice;
  // Randomize drift direction each week so stocks don't persistently trend one way
  const weeklyMu = Math.abs(mu) * (Math.random() < 0.5 ? -1 : 1);
  for (let i = 0; i < 5; i++) {
    price = +(price * (1 + randPct(weeklyMu, sigma))).toFixed(2);
    prices.push(price);
  }
  return prices;
}

function setupMarketIndex() {
  if (companies.some(c => c.symbol === INDEX_SYMBOL)) return;
  companies.push({
    id: companies.length + 1,
    name: 'Market Index',
    symbol: INDEX_SYMBOL,
    initial_price: companies.length * 1000,
    isIndex: true
  });
  indexShares = {};
  companies.forEach(c => {
    if (c.isIndex) return;
    indexShares[c.symbol] = 1000 / c.initial_price;
  });
}

function computeIndexWeekPrices(weekIdx) {
  const values = [0, 0, 0, 0, 0];
  companies.forEach(c => {
    if (c.isIndex) return;
    const prices = gameState.prices[c.symbol][weekIdx];
    const shares = indexShares[c.symbol];
    for (let i = 0; i < 5; i++) {
      values[i] += shares * prices[i];
    }
  });
  return values.map(v => +v.toFixed(2));
}

function startGame() {
  gameState = loadState();
  if (gameState && !gameState.positions) {
    gameState.positions = {};
  }
  if (!gameState) {
    gameState = {
      week: START_WEEK,
      maxWeeks: 104,
      cash: 35000,
      netWorth: 35000,
      positions: {},
      rank: 'Novice',
      headlines: {},
      prices: {}
    };
    companies.forEach(c => {
      if (c.isIndex) return;
      gameState.prices[c.symbol] = [];
      let last = c.initial_price;
      for (let i = 0; i < START_WEEK; i++) {
        const weekPrices = generateWeekPrices(last, c.mu, c.sigma);
        gameState.prices[c.symbol].push(weekPrices);
        last = weekPrices[weekPrices.length - 1];
      }
    });
    gameState.prices[INDEX_SYMBOL] = [];
    for (let i = 0; i < START_WEEK; i++) {
      gameState.prices[INDEX_SYMBOL].push(computeIndexWeekPrices(i));
    }
    saveState(gameState);
  }
  computeNetWorth(gameState);
  if (!gameState.netWorthHistory) {
    gameState.netWorthHistory = [gameState.netWorth];
  }
  displayUsername();
  updateStatus();
  initMarketHistory();
  renderMarketChart();
  renderNews();
}

function updateStatus() {
  document.getElementById('week').textContent = gameState.week;
  const maxEl = document.getElementById('maxWeek');
  if (maxEl) maxEl.textContent = gameState.maxWeeks;
  document.getElementById('rank').textContent = gameState.rank;
  document.getElementById('netWorth').textContent = gameState.netWorth.toLocaleString();
  document.getElementById('cash').textContent = gameState.cash.toLocaleString();
}

function displayUsername() {
  const el = document.getElementById('username');
  if (el) {
    el.textContent = `trading as: ${getUser()}`;
  }
}

function updateRank() {
  const worth = gameState.netWorth;
  if (worth > 1000000) {
    gameState.rank = 'Tycoon';
  } else if (worth > 250000) {
    gameState.rank = 'Trader';
  } else if (worth > 100000) {
    gameState.rank = 'Apprentice';
  } else {
    gameState.rank = 'Novice';
  }
}

function endGame() {
  const afterScore = () => {
    const admire = confirm('Game over.\nClick OK to admire your work or Cancel to start a new game.');
    if (admire) {
      window.location.href = 'game-over.html';
    } else {
      sessionStorage.removeItem('backTo');
      localStorage.clear();
      window.location.href = 'play.html';
    }
  };
  if (window.drawdownHighScores) {
    window.drawdownHighScores.check(gameState.netWorth, afterScore);
  } else {
    afterScore();
  }
}

function nextWeek() {
  if (gameState.week >= gameState.maxWeeks) {
    endGame();
    return;
  }
  gameState.week += 1;
  Object.keys(gameState.prices).forEach(sym => {
    if (sym === INDEX_SYMBOL) return;
    const arr = gameState.prices[sym];
    const prev = arr[arr.length - 1];
    const last = prev[prev.length - 1];
    const comp = companies.find(c => c.symbol === sym);
    arr.push(generateWeekPrices(last, comp.mu, comp.sigma));
  });
  const indexWeek = computeIndexWeekPrices(gameState.prices[INDEX_SYMBOL].length);
  gameState.prices[INDEX_SYMBOL].push(indexWeek);
  computeNetWorth(gameState);
  if (gameState.netWorthHistory) {
    gameState.netWorthHistory.push(gameState.netWorth);
  }
  updateRank();
  updateStatus();
  updateMarket();
  saveState(gameState);
  renderNews();
}

function cashOut() {
  const confirmMsg = 'Are you sure you want to retire and cash out?';
  if (confirm(confirmMsg)) {
    endGame();
  }
}

function showPlaceholder(msg) {
  alert(msg + ' screen goes here.');
}

const doneEl = document.getElementById('doneBtn');
if (doneEl) doneEl.addEventListener('click', nextWeek);
const dataEl = document.getElementById('dataBtn');
if (dataEl) dataEl.addEventListener('click', () => {
  window.location.href = 'analysis.html';
});
// TODO: replace placeholder with a full portfolio screen showing
// open positions and trading performance metrics like max drawdown,
// sharpe ratio, and gain to pain ratio.
const portEl = document.getElementById('portfolioBtn');
if (portEl) portEl.addEventListener('click', () => {
  window.location.href = 'portfolio.html';
});

function populateTradeSymbols() {
  const select = document.getElementById('tradeSymbol');
  if (!select) return;
  if (select.childElementCount > 0) return; // already populated
  companies.filter(c => !c.isIndex).forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.symbol;
    opt.textContent = `${c.symbol} - ${c.name}`;
    select.appendChild(opt);
  });
}

function openTrade() {
  window.location.href = 'trade.html';
}

const tradeEl = document.getElementById('tradeBtn');
if (tradeEl) tradeEl.addEventListener('click', openTrade);
const cashEl = document.getElementById('cashOutBtn');
if (cashEl) cashEl.addEventListener('click', cashOut);
const newGameEl = document.getElementById('newGameBtn');
if (newGameEl) newGameEl.addEventListener('click', () => {
  sessionStorage.removeItem('backTo');
  localStorage.clear();
  window.location.href = 'play.html';
});

