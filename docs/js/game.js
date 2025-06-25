let companies = [];
let gameState;
const INDEX_SYMBOL = 'INDEX';
let indexShares = {};

fetch('data/company_master_data.json')
  .then(r => r.json())
  .then(data => {
    companies = data.companies;
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
  for (let i = 0; i < 5; i++) {
    price = +(price * (1 + randPct(mu, sigma))).toFixed(2);
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
  if (!gameState) {
    gameState = {
      week: 1,
      maxWeeks: 104,
      cash: 35000,
      netWorth: 35000,
      rank: 'Novice',
      headlines: {},
      prices: {}
    };
    companies.forEach(c => {
      if (c.isIndex) return;
      const weekPrices = generateWeekPrices(c.initial_price, c.mu, c.sigma);
      gameState.prices[c.symbol] = [weekPrices];
    });
    gameState.prices[INDEX_SYMBOL] = [computeIndexWeekPrices(0)];
    saveState(gameState);
  }
  displayUsername();
  updateStatus();
  initMarketHistory();
  renderMarketChart();
  renderNews();
}

function updateStatus() {
  document.getElementById('week').textContent = gameState.week;
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

function nextWeek() {
  if (gameState.week >= gameState.maxWeeks) {
    alert('Game over');
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
  // simple demo economic change
  const change = Math.floor(Math.random() * 1500 - 500);
  gameState.cash += change;
  gameState.netWorth += change;
  updateRank();
  updateStatus();
  updateMarket();
  saveState(gameState);
  renderNews();
}

function showPlaceholder(msg) {
  alert(msg + ' screen goes here.');
}

document.getElementById('doneBtn').addEventListener('click', nextWeek);
document.getElementById('dataBtn').addEventListener('click', () => showPlaceholder('Data'));
// TODO: replace placeholder with a full portfolio screen showing
// open positions and trading performance metrics like max drawdown,
// sharpe ratio, and gain to pain ratio.
document.getElementById('portfolioBtn').addEventListener('click', () => showPlaceholder('Portfolio'));
document.getElementById('tradeBtn').addEventListener('click', () => showPlaceholder('Trade'));

