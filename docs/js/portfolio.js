let gameState;

document.addEventListener('DOMContentLoaded', () => {
  gameState = loadState();
  if (gameState && (gameState.week >= gameState.maxWeeks || gameState.gameOver)) {
    window.location.href = 'game-over.html';
    return;
  }
  if (!gameState) return;
  if (!gameState.positions) gameState.positions = {};
  computeNetWorth(gameState);
  document.getElementById('pNetWorth').textContent = gameState.netWorth.toLocaleString();
  document.getElementById('pCash').textContent = gameState.cash.toLocaleString();
  renderPositions();
  renderMetrics();
  const back = document.getElementById('backBtn');
  if (back) back.addEventListener('click', () => {
    const dest = sessionStorage.getItem('backTo') || 'play.html';
    window.location.href = dest;
  });
});

function renderPositions() {
  const tbl = document.getElementById('positionsTable');
  tbl.innerHTML = '';
  const header = document.createElement('tr');
  header.innerHTML = '<th>Symbol</th><th>Qty</th><th>Value</th>';
  tbl.appendChild(header);
  Object.keys(gameState.positions).forEach(sym => {
    const pos = gameState.positions[sym];
    const weeks = gameState.prices[sym];
    if (!weeks) return;
    const week = weeks[weeks.length - 1];
    const price = week[week.length - 1];
    const row = document.createElement('tr');
    const value = (pos.qty * price).toFixed(2);
    row.innerHTML = `<td>${sym}</td><td>${pos.qty}</td><td>$${parseFloat(value).toLocaleString()}</td>`;
    tbl.appendChild(row);
  });
}

function renderMetrics() {
  const hist = gameState.netWorthHistory || [];
  const rets = [];
  for (let i = 1; i < hist.length; i++) {
    rets.push((hist[i] - hist[i - 1]) / hist[i - 1]);
  }
  document.getElementById('maxDrawdown').textContent = calculateMaxDrawdown(hist);
  document.getElementById('sharpeRatio').textContent = calculateSharpeRatio(rets);
  document.getElementById('gainToPain').textContent = calculateGainToPainRatio(rets);
}
