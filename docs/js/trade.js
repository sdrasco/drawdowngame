let companies = [];
let gameState;

function renderMetrics() {
  if (!gameState) return;
  computeNetWorth(gameState);
  document.getElementById('tNetWorth').textContent = gameState.netWorth.toLocaleString();
  document.getElementById('tCash').textContent = gameState.cash.toLocaleString();
}

function renderTradeHistory() {
  const tbl = document.getElementById('tradeHistoryTable');
  if (!tbl) return;
  tbl.innerHTML = '';
  const header = document.createElement('tr');
  header.innerHTML = '<th>Week</th><th>Type</th><th>Symbol</th><th>Qty</th><th>Price</th>';
  tbl.appendChild(header);
  (gameState.tradeHistory || []).forEach(t => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${t.week}</td><td>${t.type}</td><td>${t.symbol}</td><td>${t.qty}</td><td>$${t.price.toFixed(2)}</td>`;
    tbl.appendChild(row);
  });
}

function confirmTrade(msg) {
  const el = document.getElementById('tradeConfirm');
  if (el) el.textContent = msg;
}

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

function updateTradeInfo() {
  const sym = document.getElementById('tradeSymbol').value;
  const weeks = gameState.prices[sym];
  if (!weeks) return;
  const week = weeks[weeks.length - 1];
  const price = week[week.length - 1];
  document.getElementById('tradePrice').textContent = price.toFixed(2);

  const slider = document.getElementById('tradeQtySlider');
  const input = document.getElementById('tradeQty');
  const maxBuy = Math.floor(gameState.cash / price);
  const holdings = (gameState.positions[sym] && gameState.positions[sym].qty) || 0;
  const max = Math.max(maxBuy, holdings, 1);
  slider.max = max;
  slider.value = 1;
  input.value = 1;
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

function doBuy() {
  const sym = document.getElementById('tradeSymbol').value.trim().toUpperCase();
  const qty = parseInt(document.getElementById('tradeQty').value, 10);
  if (!sym || !qty) return;
  const weeks = gameState.prices[sym];
  if (!weeks) {
    if (typeof showMessage === 'function') {
      showMessage('Unknown symbol');
    }
    return;
  }
  const week = weeks[weeks.length - 1];
  const price = week[week.length - 1];
  if (!buyStock(gameState, sym, qty, price)) {
    if (typeof showMessage === 'function') {
      showMessage('Not enough cash');
    }
  } else {
    updateRank();
    if (!gameState.tradeHistory) gameState.tradeHistory = [];
    gameState.tradeHistory.push({ week: gameState.week, type: 'BUY', symbol: sym, qty, price });
    saveState(gameState);
    confirmTrade(`Bought ${qty} ${sym} @ $${price.toFixed(2)}`);
    renderMetrics();
    updateTradeInfo();
    renderTradeHistory();
  }
}

function doSell() {
  const sym = document.getElementById('tradeSymbol').value.trim().toUpperCase();
  const qty = parseInt(document.getElementById('tradeQty').value, 10);
  if (!sym || !qty) return;
  const weeks = gameState.prices[sym];
  if (!weeks) {
    if (typeof showMessage === 'function') {
      showMessage('Unknown symbol');
    }
    return;
  }
  const week = weeks[weeks.length - 1];
  const price = week[week.length - 1];
  if (!sellStock(gameState, sym, qty, price)) {
    if (typeof showMessage === 'function') {
      showMessage('Not enough shares');
    }
  } else {
    updateRank();
    if (!gameState.tradeHistory) gameState.tradeHistory = [];
    gameState.tradeHistory.push({ week: gameState.week, type: 'SELL', symbol: sym, qty, price });
    saveState(gameState);
    confirmTrade(`Sold ${qty} ${sym} @ $${price.toFixed(2)}`);
    renderMetrics();
    updateTradeInfo();
    renderTradeHistory();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  gameState = loadState();
  if (gameState && (gameState.week >= gameState.maxWeeks || gameState.gameOver)) {
    window.location.href = 'game-over.html';
    return;
  }
  renderMetrics();
  renderTradeHistory();
  fetch('data/company_master_data.json')
    .then(r => r.json())
    .then(data => {
      companies = data.companies;
      populateTradeSymbols();
      updateTradeInfo();
      renderMetrics();
      renderTradeHistory();
    });

  document.getElementById('tradeSymbol').addEventListener('change', updateTradeInfo);
  document.getElementById('tradeQtySlider').addEventListener('input', e => {
    document.getElementById('tradeQty').value = e.target.value;
  });
  document.getElementById('tradeQty').addEventListener('input', e => {
    document.getElementById('tradeQtySlider').value = e.target.value;
  });
  document.getElementById('buyBtn').addEventListener('click', doBuy);
  document.getElementById('sellBtn').addEventListener('click', doSell);
});
