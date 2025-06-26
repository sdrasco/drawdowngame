let companies = [];
let gameState;
const INDEX_SYMBOL = 'INDEX';
let indexShares = {};
const START_WEEK = 14;

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

function nextWeek() {
  if (gameState.week >= gameState.maxWeeks) {
    alert('Game over');
    if (window.drawdownHighScores) {
      window.drawdownHighScores.check(gameState.netWorth, () => {
        window.location.href = 'high-scores.html';
      });
    }
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
  alert('Game over');
  if (window.drawdownHighScores) {
    window.drawdownHighScores.check(gameState.netWorth, () => {
      window.location.href = 'high-scores.html';
    });
  } else {
    window.location.href = 'high-scores.html';
  }
}

function showPlaceholder(msg) {
  alert(msg + ' screen goes here.');
}

document.getElementById('doneBtn').addEventListener('click', nextWeek);
document.getElementById('dataBtn').addEventListener('click', () => {
  window.location.href = 'analysis.html';
});
// TODO: replace placeholder with a full portfolio screen showing
// open positions and trading performance metrics like max drawdown,
// sharpe ratio, and gain to pain ratio.
document.getElementById('portfolioBtn').addEventListener('click', () => {
  window.location.href = 'portfolio.html';
});

function openTrade() {
  document.getElementById('tradeForm').classList.remove('hidden');
}

function closeTrade() {
  document.getElementById('tradeForm').classList.add('hidden');
}

function doBuy() {
  const sym = document.getElementById('tradeSymbol').value.trim().toUpperCase();
  const qty = parseInt(document.getElementById('tradeQty').value, 10);
  if (!sym || !qty) return;
  const weeks = gameState.prices[sym];
  if (!weeks) {
    alert('Unknown symbol');
    return;
  }
  const week = weeks[weeks.length - 1];
  const price = week[week.length - 1];
  if (!buyStock(gameState, sym, qty, price)) {
    alert('Not enough cash');
  } else {
    updateRank();
    updateStatus();
    saveState(gameState);
  }
}

function doSell() {
  const sym = document.getElementById('tradeSymbol').value.trim().toUpperCase();
  const qty = parseInt(document.getElementById('tradeQty').value, 10);
  if (!sym || !qty) return;
  const weeks = gameState.prices[sym];
  if (!weeks) {
    alert('Unknown symbol');
    return;
  }
  const week = weeks[weeks.length - 1];
  const price = week[week.length - 1];
  if (!sellStock(gameState, sym, qty, price)) {
    alert('Not enough shares');
  } else {
    updateRank();
    updateStatus();
    saveState(gameState);
  }
}

document.getElementById('tradeBtn').addEventListener('click', openTrade);
document.getElementById('tradeCloseBtn').addEventListener('click', closeTrade);
document.getElementById('buyBtn').addEventListener('click', doBuy);
document.getElementById('sellBtn').addEventListener('click', doSell);
document.getElementById('cashOutBtn').addEventListener('click', cashOut);

