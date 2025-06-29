let companies = [];
let gameState;
let tradeMode = 'BUY';

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
  header.innerHTML = '<th>Week</th><th>Type</th><th>Symbol</th><th>Qty</th><th>Price</th><th>Commission</th><th>Fees</th><th>Total</th>';
  tbl.appendChild(header);
  (gameState.tradeHistory || []).forEach(t => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${t.week}</td><td>${t.type}</td><td>${t.symbol}</td><td>${t.qty}</td><td>$${t.price.toFixed(2)}</td><td>$${t.commission.toFixed(2)}</td><td>$${t.fees.toFixed(2)}</td><td>$${t.total.toFixed(2)}</td>`;
    tbl.appendChild(row);
  });
}

function showTradeDialog(trade) {
  const totalLabel = trade.type === 'BUY' ? 'Total Cost' : 'Net Proceeds';
  const msg = `${trade.type} ${trade.qty} ${trade.symbol} @ $${trade.price.toFixed(2)}<br/>` +
    `Commission: $${trade.commission.toFixed(2)}<br/>Fees: $${trade.fees.toFixed(2)}<br/>` +
    `${totalLabel}: $${trade.total.toFixed(2)}`;
  if (typeof showMessage === 'function') {
    showMessage(msg);
  }
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
  updateTradeTotal();
}

function updateTradeTotal() {
  const qty = parseInt(document.getElementById('tradeQty').value, 10) || 0;
  const price = parseFloat(document.getElementById('tradePrice').textContent) || 0;
  const tradeValue = qty * price;
  const commission = TRADE_COMMISSION;
  const fees = +(tradeValue * TRADE_FEE_RATE).toFixed(2);
  let total;
  const label = document.getElementById('tradeTotalLabel');
  if (tradeMode === 'SELL') {
    total = tradeValue - commission - fees;
    if (label) label.textContent = 'Net Proceeds:';
  } else {
    total = tradeValue + commission + fees;
    if (label) label.textContent = 'Total Cost:';
  }
  const span = document.getElementById('tradeTotal');
  if (span) span.textContent = total.toFixed(2);
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
  const result = buyStock(gameState, sym, qty, price);
  if (!result.success) {
    if (typeof showMessage === 'function') {
      showMessage('Not enough cash');
    }
  } else {
    updateRank();
    if (!gameState.tradeHistory) gameState.tradeHistory = [];
    const trade = { week: gameState.week, type: 'BUY', symbol: sym, qty, price, commission: result.commission, fees: result.fees, total: result.total };
    gameState.tradeHistory.push(trade);
    saveState(gameState);
    showTradeDialog(trade);
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
  const result = sellStock(gameState, sym, qty, price);
  if (!result.success) {
    if (typeof showMessage === 'function') {
      showMessage('Not enough shares');
    }
  } else {
    updateRank();
    if (!gameState.tradeHistory) gameState.tradeHistory = [];
    const trade = { week: gameState.week, type: 'SELL', symbol: sym, qty, price, commission: result.commission, fees: result.fees, total: result.total };
    gameState.tradeHistory.push(trade);
    saveState(gameState);
    showTradeDialog(trade);
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
    updateTradeTotal();
  });
  document.getElementById('tradeQty').addEventListener('input', e => {
    document.getElementById('tradeQtySlider').value = e.target.value;
    updateTradeTotal();
  });
  document.getElementById('buyBtn').addEventListener('click', doBuy);
  document.getElementById('sellBtn').addEventListener('click', doSell);
  document.getElementById('buyBtn').addEventListener('mouseenter', () => { tradeMode = 'BUY'; updateTradeTotal(); });
  document.getElementById('buyBtn').addEventListener('focus', () => { tradeMode = 'BUY'; updateTradeTotal(); });
  document.getElementById('sellBtn').addEventListener('mouseenter', () => { tradeMode = 'SELL'; updateTradeTotal(); });
  document.getElementById('sellBtn').addEventListener('focus', () => { tradeMode = 'SELL'; updateTradeTotal(); });
});
