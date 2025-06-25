const gameState = {
  week: 14,
  maxWeeks: 104,
  cash: 35000,
  netWorth: 35000,
  rank: 'Novice'
};

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
  // simple demo economic change
  const change = Math.floor(Math.random() * 1500 - 500);
  gameState.cash += change;
  gameState.netWorth += change;
  updateRank();
  updateStatus();
  updateMarket();
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

updateStatus();
renderMarketChart();
renderNews();

