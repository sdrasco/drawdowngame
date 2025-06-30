let companies = [];
let gameState;
const INDEX_SYMBOL = 'INDEX';
let indexShares = {};
const START_WEEK = 14;

function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

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
function getBeta(c) {
  if (c.beta !== undefined) return c.beta;
  const cat = (c.market_cap_category || "").toLowerCase();
  if (cat.includes("mega")) c.beta = 0.8;
  else if (cat.includes("large")) c.beta = 0.7;
  else c.beta = 0.5;
  return c.beta;
}

function generateWeekPrices(lastPrice, comp, effect = {}, epsMarket = 0, newsDrift = 0) {
  const beta = getBeta(comp);
  let mu = comp.mu + newsDrift;
  let sigma = comp.sigma;
  if (effect.vol) sigma *= 1.3;
  const eta = randn();
  const eps = beta * epsMarket + Math.sqrt(1 - beta * beta) * eta;
  let x = Math.log(lastPrice);
  x += (mu - 0.5 * sigma * sigma) + sigma * eps;
  if (effect.jump) x += effect.jump;
  const price = +Math.exp(x).toFixed(2);
  return [price, price, price, price, price];
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

function newsImpactsForWeek(week) {
  const impacts = {};
  const headlines = gameState.headlines[week] || [];
  headlines.forEach(h => {
    if (!h) return;
    if (h.symbol) {
      const sign = h.type === "good" ? 1 : h.type === "bad" ? -1 : 0;
      if (sign === 0) return;
      if (!impacts[h.symbol]) impacts[h.symbol] = { drift: 0, jump: 0, vol: false };
      if (h.impact) {
        const mag = 0.1 + 0.1 * Math.random();
        impacts[h.symbol].jump += sign * Math.log(1 + mag);
        impacts[h.symbol].vol = true;
      } else {
        impacts[h.symbol].drift += sign * 0.02;
      }
    } else if (h.industry) {
      const sign = h.sentiment || 0;
      if (sign === 0) return;
      const magKey = h.magnitude || 'small';
      const mag = magKey === 'large' ? 0.15 : magKey === 'medium' ? 0.1 : 0.05;
      const jump = sign * Math.log(1 + mag);
      companies.forEach(c => {
        if (c.isIndex) return;
        const ind = h.category || h.industry;
        if (c.industry !== ind) return;
        if (!impacts[c.symbol]) impacts[c.symbol] = { drift: 0, jump: 0, vol: false };
        impacts[c.symbol].jump += jump;
        impacts[c.symbol].vol = true;
      });
    }
  });
  return impacts;

}
function startGame() {
  gameState = loadState();
  if (gameState && !gameState.positions) {
    gameState.positions = {};
  }
  if (gameState && !gameState.newsDrift) {
    gameState.newsDrift = {};
  }
  if (gameState && gameState.gameOver === undefined) {
    gameState.gameOver = false;
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
      prices: {},
      newsDrift: {},
      gameOver: false
    };
    const lastPrices = {};
    companies.forEach(c => {
      if (c.isIndex) return;
      gameState.prices[c.symbol] = [];
      lastPrices[c.symbol] = c.initial_price;
      gameState.newsDrift[c.symbol] = 0;
    });
    gameState.prices[INDEX_SYMBOL] = [];
    for (let i = 0; i < START_WEEK; i++) {
      const epsMarket = randn();
      Object.keys(lastPrices).forEach(sym => {
        const comp = companies.find(cc => cc.symbol === sym);
        const weekPrices = generateWeekPrices(lastPrices[sym], comp, {}, epsMarket, gameState.newsDrift[sym]);
        gameState.prices[sym].push(weekPrices);
        lastPrices[sym] = weekPrices[weekPrices.length - 1];
        gameState.newsDrift[sym] *= 0.5;
      });
      gameState.prices[INDEX_SYMBOL].push(computeIndexWeekPrices(i));
    }

    saveState(gameState);
  }
  computeNetWorth(gameState);
  if (!gameState.netWorthHistory) {
    // Pre-fill history so the chart includes the pre-game weeks
    gameState.netWorthHistory = Array(gameState.week).fill(gameState.netWorth);
  }
  displayUsername();
  updateStatus();
  initMarketHistory();
  renderMarketChart();
  renderNews();
  if (gameState.week >= gameState.maxWeeks || gameState.gameOver) {
    gameState.gameOver = true;
    const done = document.getElementById('doneBtn');
    if (done) {
      done.disabled = true;
      done.classList.add('hidden');
    }
    saveState(gameState);
    showGameOverDialog();
  }
}

function updateStatus() {
  document.getElementById('week').textContent = gameState.week;
  const maxEl = document.getElementById('maxWeek');
  if (maxEl) maxEl.textContent = gameState.maxWeeks;
  document.getElementById('rank').textContent = gameState.rank;
  document.getElementById('netWorth').textContent = Math.round(gameState.netWorth).toLocaleString();
  document.getElementById('cash').textContent = Math.round(gameState.cash).toLocaleString();
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

function showGameOverDialog() {
  const dialogEl = document.getElementById('gameOverDialog');
  if (!dialogEl) return;
  const admireBtn = document.getElementById('gameOverAdmire');
  const scoresBtn = document.getElementById('gameOverScores');
  const newBtn = document.getElementById('gameOverNew');
  const menuBtn = document.getElementById('gameOverMenu');
  const worthEl = document.getElementById('gameOverNetWorth');
  if (worthEl) worthEl.textContent = gameState.netWorth.toLocaleString();

  function cleanup() {
    admireBtn.removeEventListener('click', onAdmire);
    scoresBtn.removeEventListener('click', onScores);
    newBtn.removeEventListener('click', onNew);
    menuBtn.removeEventListener('click', onMenu);
    dialogEl.classList.add('hidden');
  }

  function onAdmire() {
    cleanup();
    window.location.href = 'game-over.html';
  }

  function onScores() {
    cleanup();
    window.location.href = 'high-scores.html';
  }

  function onNew() {
    cleanup();
    sessionStorage.removeItem('backTo');
    localStorage.clear();
    window.location.href = 'play.html';
  }

  function onMenu() {
    cleanup();
    sessionStorage.removeItem('backTo');
    localStorage.clear();
    window.location.href = 'index.html';
  }

  admireBtn.addEventListener('click', onAdmire);
  scoresBtn.addEventListener('click', onScores);
  newBtn.addEventListener('click', onNew);
  menuBtn.addEventListener('click', onMenu);
  dialogEl.classList.remove('hidden');
}

function endGame() {
  gameState.gameOver = true;
  const done = document.getElementById('doneBtn');
  if (done) {
    done.disabled = true;
    done.classList.add('hidden');
  }
  saveState(gameState);
  if (window.drawdownHighScores &&
      typeof window.drawdownHighScores.prepareEntry === 'function') {
    window.drawdownHighScores.prepareEntry(gameState.netWorth)
      .then(needsPage => {
        if (needsPage) {
          window.location.href = 'new-high-score.html';
        } else {
          showGameOverDialog();
        }
      });
  } else {
    showGameOverDialog();
  }
}

function nextWeek() {
  if (gameState.week >= gameState.maxWeeks) {
    endGame();
    return;
  }
  gameState.week += 1;
  const effects = newsImpactsForWeek(gameState.week - 1);
  const epsMarket = randn();
  Object.keys(gameState.prices).forEach(sym => {
    if (sym === INDEX_SYMBOL) return;
    const arr = gameState.prices[sym];
    const prev = arr[arr.length - 1];
    const last = prev[prev.length - 1];
    const comp = companies.find(c => c.symbol === sym);
    gameState.newsDrift[sym] = (gameState.newsDrift[sym] || 0) * 0.5;
    const effect = effects[sym];
    if (effect && effect.drift) {
      gameState.newsDrift[sym] += effect.drift;
    }
    arr.push(generateWeekPrices(last, comp, effect, epsMarket, gameState.newsDrift[sym]));
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
  if (typeof showMessage === 'function') {
    showMessage(msg + ' screen goes here.');
  }
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

const menuBtnEl = document.getElementById('menuBtn');
if (menuBtnEl) menuBtnEl.addEventListener('click', () => {
  sessionStorage.removeItem('backTo');
  localStorage.clear();
  window.location.href = 'index.html';
});

const scoresBtnEl = document.getElementById('scoresBtn');
if (scoresBtnEl) scoresBtnEl.addEventListener('click', () => {
  window.location.href = 'high-scores.html';
});

