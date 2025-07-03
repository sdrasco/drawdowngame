let companies = [];
let gameState;
let tradeMode = 'BUY';

function renderMetrics() {
  if (!gameState) return;
  computeNetWorth(gameState);
  document.getElementById('tNetWorth').textContent = Math.round(gameState.netWorth).toLocaleString();
  document.getElementById('tCash').textContent = Math.round(gameState.cash).toLocaleString();
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

function populateTradeSymbols(list) {
  const select = document.getElementById('tradeSymbol');
  if (!select) return;
  select.innerHTML = '';
  list.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.symbol;
    opt.textContent = `${c.symbol} - ${c.name}`;
    select.appendChild(opt);
  });
}

function getHoldingsList() {
  const symbols = Object.keys(gameState.positions || {});
  return companies.filter(c => symbols.includes(c.symbol));
}

function renderSellHoldings() {
  const tbl = document.getElementById('sellHoldingsTable');
  if (!tbl) return;
  tbl.innerHTML = '';
  const header = document.createElement('tr');
  header.innerHTML = '<th>Symbol</th><th>Qty</th>';
  tbl.appendChild(header);
  Object.keys(gameState.positions || {}).forEach(sym => {
    const row = document.createElement('tr');
    const qty = gameState.positions[sym].qty;
    row.innerHTML = `<td>${sym}</td><td>${qty}</td>`;
    tbl.appendChild(row);
  });
}

function renderSellOptions() {
  const tbl = document.getElementById('sellOptionsTable');
  if (!tbl) return;
  tbl.innerHTML = '';
  const header = document.createElement('tr');
  header.innerHTML = '<th>Symbol</th><th>Type</th><th>Strike</th><th>Qty</th><th>Value</th><th>Weeks Left</th><th></th>';
  tbl.appendChild(header);
  (gameState.options || []).forEach((opt, idx) => {
    const remaining = opt.weeksToExpiry - (gameState.week - opt.purchaseWeek);
    if (remaining <= 0) return;
    const weeks = gameState.prices[opt.symbol];
    if (!weeks || !bsPrice) return;
    const price = weeks[weeks.length - 1][weeks[weeks.length - 1].length - 1];
    const val = bsPrice(price, opt.strike, OPTION_RISK_FREE_RATE, OPTION_VOLATILITY, remaining / 52, opt.type) * opt.qty;
    const row = document.createElement('tr');
    row.innerHTML = `<td>${opt.symbol}</td><td>${opt.type}</td><td>${opt.strike}</td><td>${opt.qty}</td><td>$${val.toFixed(2)}</td><td>${remaining}</td>`;
    const btnCell = document.createElement('td');
    const btn = document.createElement('button');
    btn.textContent = 'Sell';
    btn.addEventListener('click', () => sellOptionPosition(idx));
    btnCell.appendChild(btn);
    row.appendChild(btnCell);
    tbl.appendChild(row);
  });
}

function sellOptionPosition(idx) {
  const opt = (gameState.options || [])[idx];
  if (!opt) return;
  const remaining = opt.weeksToExpiry - (gameState.week - opt.purchaseWeek);
  if (remaining <= 0) return;
  const weeks = gameState.prices[opt.symbol];
  if (!weeks || !bsPrice) { if (typeof showMessage==='function') showMessage('Unknown symbol'); return; }
  const price = weeks[weeks.length-1][weeks[weeks.length-1].length-1];
  const premium = bsPrice(price, opt.strike, OPTION_RISK_FREE_RATE, OPTION_VOLATILITY, remaining/52, opt.type);
  const tradeValue = premium * opt.qty;
  const commission = TRADE_COMMISSION;
  const fees = +(tradeValue * TRADE_FEE_RATE).toFixed(2);
  const proceeds = tradeValue - commission - fees;
  gameState.cash += proceeds;
  gameState.options.splice(idx,1);
  updateRank();
  if (!gameState.tradeHistory) gameState.tradeHistory = [];
  const trade = { week: gameState.week, type: `SELL ${opt.type.toUpperCase()}`, symbol: opt.symbol, qty: opt.qty, price: premium, commission, fees, total: proceeds };
  gameState.tradeHistory.push(trade);
  saveState(gameState);
  showTradeDialog(trade);
  renderMetrics();
  renderTradeHistory();
  renderSellOptions();
}

function populateOptionSymbols(list) {
  const select = document.getElementById('optSymbol');
  if (!select) return;
  select.innerHTML = '';
  list.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.symbol;
    opt.textContent = `${c.symbol} - ${c.name}`;
    select.appendChild(opt);
  });
}

function updateOptionInfo() {
  const sym = document.getElementById('optSymbol').value;
  const strike = parseFloat(document.getElementById('optStrike').value) || 0;
  const weeks = parseInt(document.getElementById('optWeeks').value, 10) || 0;
  const qty = parseInt(document.getElementById('optQty').value, 10) || 0;
  const type = document.getElementById('optType').value;
  const weeksArr = gameState.prices[sym];
  if (!weeksArr || !bsPrice) return;
  const week = weeksArr[weeksArr.length - 1];
  const S = week[week.length - 1];
  const premium = bsPrice(S, strike, OPTION_RISK_FREE_RATE, OPTION_VOLATILITY,
                         weeks / 52, type);
  document.getElementById('optPremium').textContent = premium.toFixed(2);
  const tradeValue = premium * qty;
  const commission = TRADE_COMMISSION;
  const fees = +(tradeValue * TRADE_FEE_RATE).toFixed(2);
  document.getElementById('optTotal').textContent = (tradeValue + commission + fees).toFixed(2);
}

function showOrderForm(mode) {
  tradeMode = mode;
  document.getElementById('tradeModeSelect').classList.add('hidden');
  document.getElementById('tradeForm').classList.remove('hidden');
  document.getElementById('buyBtn').classList.toggle('hidden', mode !== 'BUY');
  document.getElementById('sellBtn').classList.toggle('hidden', mode !== 'SELL');
  const holdingsDiv = document.getElementById('sellHoldings');
  if (mode === 'SELL') {
    holdingsDiv.classList.remove('hidden');
    renderSellHoldings();
    populateTradeSymbols(getHoldingsList());
  } else {
    holdingsDiv.classList.add('hidden');
    populateTradeSymbols(companies.filter(c => !c.isIndex));
  }
  updateTradeInfo();
}

function hideOrderForm() {
  document.getElementById('tradeForm').classList.add('hidden');
  document.getElementById('sellHoldings').classList.add('hidden');
  document.getElementById('tradeModeSelect').classList.remove('hidden');
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
  const maxBuy = calculateMaxBuy(gameState.cash, price);
  const holdings = (gameState.positions[sym] && gameState.positions[sym].qty) || 0;
  let max;
  if (tradeMode === 'SELL') {
    max = Math.max(holdings, 1);
  } else {
    max = Math.max(maxBuy, 1);
  }
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
  } else if (worth > 50000) {
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
    renderSellHoldings();
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
    renderSellHoldings();
    renderTradeHistory();
  }
}

function doBuyOption() {
  const sym = document.getElementById('optSymbol').value.trim().toUpperCase();
  const type = document.getElementById('optType').value;
  const strike = parseFloat(document.getElementById('optStrike').value);
  const qty = parseInt(document.getElementById('optQty').value, 10);
  const w = parseInt(document.getElementById('optWeeks').value, 10);
  if (!sym || !qty || isNaN(strike) || isNaN(w)) return;
  const weeks = gameState.prices[sym];
  if (!weeks || !bsPrice) { if (typeof showMessage==='function') showMessage('Unknown symbol'); return; }
  const price = weeks[weeks.length-1][weeks[weeks.length-1].length-1];
  const premium = bsPrice(price, strike, OPTION_RISK_FREE_RATE, OPTION_VOLATILITY, w/52, type);
  const tradeValue = premium * qty;
  const commission = TRADE_COMMISSION;
  const fees = +(tradeValue * TRADE_FEE_RATE).toFixed(2);
  const total = tradeValue + commission + fees;
  if (gameState.cash < total) { if (typeof showMessage==='function') showMessage('Not enough cash'); return; }
  gameState.cash -= total;
  if (!gameState.options) gameState.options = [];
  gameState.options.push({ symbol: sym, type, strike, premium, qty, weeksToExpiry: w, purchaseWeek: gameState.week });
  updateRank();
  if (!gameState.tradeHistory) gameState.tradeHistory = [];
  const trade = { week: gameState.week, type: `BUY ${type.toUpperCase()}`, symbol: sym, qty, price: premium, commission, fees, total };
  gameState.tradeHistory.push(trade);
  saveState(gameState);
  showTradeDialog(trade);
  renderMetrics();
  renderTradeHistory();
  renderSellOptions();
}

function doSellOption() {
  const sym = document.getElementById('optSymbol').value.trim().toUpperCase();
  const type = document.getElementById('optType').value;
  const strike = parseFloat(document.getElementById('optStrike').value);
  const qty = parseInt(document.getElementById('optQty').value, 10);
  if (!sym || !qty || isNaN(strike)) return;
  const idx = (gameState.options || []).findIndex(o => o.symbol===sym && o.type===type && o.strike===strike && o.qty>=qty && (o.weeksToExpiry - (gameState.week - o.purchaseWeek) > 0));
  if (idx === -1) { if (typeof showMessage==='function') showMessage('No matching option position'); return; }
  const optPos = gameState.options[idx];
  const remaining = optPos.weeksToExpiry - (gameState.week - optPos.purchaseWeek);
  const weeks = gameState.prices[sym];
  if (!weeks || !bsPrice) { if (typeof showMessage==='function') showMessage('Unknown symbol'); return; }
  const price = weeks[weeks.length-1][weeks[weeks.length-1].length-1];
  const premium = bsPrice(price, strike, OPTION_RISK_FREE_RATE, OPTION_VOLATILITY, remaining/52, type);
  const tradeValue = premium * qty;
  const commission = TRADE_COMMISSION;
  const fees = +(tradeValue * TRADE_FEE_RATE).toFixed(2);
  const proceeds = tradeValue - commission - fees;
  gameState.cash += proceeds;
  optPos.qty -= qty;
  if (optPos.qty <= 0) gameState.options.splice(idx,1);
  updateRank();
  if (!gameState.tradeHistory) gameState.tradeHistory = [];
  const trade = { week: gameState.week, type: `SELL ${type.toUpperCase()}`, symbol: sym, qty, price: premium, commission, fees, total: proceeds };
  gameState.tradeHistory.push(trade);
  saveState(gameState);
  showTradeDialog(trade);
  renderMetrics();
  renderTradeHistory();
  renderSellOptions();
}

document.addEventListener('DOMContentLoaded', () => {
  gameState = loadState();
  if (gameState && (gameState.week >= gameState.maxWeeks || gameState.gameOver)) {
    window.location.href = 'game-over.html';
    return;
  }
  renderMetrics();
  renderTradeHistory();
  renderSellOptions();
  fetch('data/company_master_data.json')
    .then(r => r.json())
    .then(data => {
      companies = data.companies;
      renderMetrics();
      renderTradeHistory();
      if (gameState.rank !== 'Novice') {
        populateOptionSymbols(companies.filter(c => !c.isIndex));
        document.getElementById('optionsForm').classList.remove('hidden');
        updateOptionInfo();
        renderSellOptions();
      }
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
  document.getElementById('startBuyBtn').addEventListener('click', () => showOrderForm('BUY'));
  document.getElementById('startSellBtn').addEventListener('click', () => showOrderForm('SELL'));
  document.getElementById('cancelTradeBtn').addEventListener('click', hideOrderForm);

  if (gameState.rank !== 'Novice') {
    document.getElementById('optSymbol').addEventListener('change', updateOptionInfo);
    document.getElementById('optType').addEventListener('change', updateOptionInfo);
    document.getElementById('optStrike').addEventListener('input', updateOptionInfo);
    document.getElementById('optWeeks').addEventListener('input', updateOptionInfo);
    document.getElementById('optQty').addEventListener('input', updateOptionInfo);
    document.getElementById('optBuyBtn').addEventListener('click', doBuyOption);
    document.getElementById('optSellBtn').addEventListener('click', doSellOption);
  }
});
