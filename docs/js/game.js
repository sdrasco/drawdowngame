let companies = [];
let gameState;

fetch('data/company_master_data.json')
  .then(r => r.json())
  .then(data => {
    companies = data.companies;
    startGame();
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
      const weekPrices = generateWeekPrices(c.initial_price, c.mu, c.sigma);
      gameState.prices[c.symbol] = [weekPrices];
    });
    saveState(gameState);
  }
  updateStatus();
  renderMarketChart();
  renderNews();
}

function updateStatus() {
  document.getElementById('week').textContent = gameState.week;
  document.getElementById('rank').textContent = gameState.rank;
  document.getElementById('netWorth').textContent = gameState.netWorth.toLocaleString();
  document.getElementById('cash').textContent = gameState.cash.toLocaleString();
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
    const arr = gameState.prices[sym];
    const prev = arr[arr.length - 1];
    const last = prev[prev.length - 1];
    const comp = companies.find(c => c.symbol === sym);
    arr.push(generateWeekPrices(last, comp.mu, comp.sigma));
  });
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

