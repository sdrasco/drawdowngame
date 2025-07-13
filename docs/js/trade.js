let companies = [];
let gameState;
let tradeMode = "BUY";

let currentHistory = [];

function renderMetrics() {
  if (!gameState) return;
  computeNetWorth(gameState);
  document.getElementById("tNetWorth").textContent = Math.round(
    gameState.netWorth,
  ).toLocaleString();
  document.getElementById("tCash").textContent = Math.round(
    gameState.cash,
  ).toLocaleString();
}

function renderTradeHistory() {
  const tbl = document.getElementById("tradeHistoryTable");
  if (!tbl) return;
  tbl.innerHTML = "";
  const header = document.createElement("tr");
  if (window.optionsTradeHistoryOnly) {
    header.innerHTML =
      "<th>Week</th><th>Action</th><th>Symbol</th><th>Type</th><th>Strike</th><th>Weeks</th><th>Qty</th><th>Price</th><th>Commission</th><th>Fees</th><th>Total</th>";
  } else {
    header.innerHTML =
      "<th>Week</th><th>Type</th><th>Symbol</th><th>Qty</th><th>Price</th><th>Commission</th><th>Fees</th><th>Total</th>";
  }
  tbl.appendChild(header);
  let history = gameState.tradeHistory || [];
  if (window.stockTradeHistoryOnly) {
    history = history.filter((t) => t.type === "BUY" || t.type === "SELL");
  } else if (window.optionsTradeHistoryOnly) {
    history = history.filter((t) => t.type !== "BUY" && t.type !== "SELL");
  }
  history.forEach((t) => {
    const row = document.createElement("tr");
    if (window.optionsTradeHistoryOnly) {
      const act = t.type.startsWith("BUY") ? "BUY" : "SELL";
      const optType =
        t.optionType || (t.type.includes("CALL") ? "call" : "put");
      const strike = t.strike !== undefined ? t.strike : "";
      const weeks = t.weeks !== undefined ? t.weeks : "";
      row.innerHTML = `<td>${t.week}</td><td>${act}</td><td>${t.symbol}</td><td>${optType}</td><td>${strike}</td><td>${weeks}</td><td>${t.qty}</td><td>$${t.price.toFixed(2)}</td><td>$${t.commission.toFixed(2)}</td><td>$${t.fees.toFixed(2)}</td><td>$${t.total.toFixed(2)}</td>`;
    } else {
      row.innerHTML = `<td>${t.week}</td><td>${t.type}</td><td>${t.symbol}</td><td>${t.qty}</td><td>$${t.price.toFixed(2)}</td><td>$${t.commission.toFixed(2)}</td><td>$${t.fees.toFixed(2)}</td><td>$${t.total.toFixed(2)}</td>`;
    }
    tbl.appendChild(row);
  });
}

function showTradeDialog(trade) {
  const totalLabel =
    trade.type && trade.type.startsWith("BUY") ? "Total Cost" : "Net Proceeds";
  const msg =
    `${trade.type} ${trade.qty} ${trade.symbol} @ $${trade.price.toFixed(2)}<br/>` +
    `Commission: $${trade.commission.toFixed(2)}<br/>Fees: $${trade.fees.toFixed(2)}<br/>` +
    `${totalLabel}: $${trade.total.toFixed(2)}`;
  if (typeof showMessage === "function") {
    showMessage(msg);
  }
}

function populateTradeSymbols(list) {
  const select = document.getElementById("tradeSymbol");
  if (!select) return;
  select.innerHTML = "";
  list
    .slice()
    .sort((a, b) => a.symbol.localeCompare(b.symbol))
    .forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.symbol;
      opt.textContent = `${c.symbol} - ${c.name}`;
      select.appendChild(opt);
    });
}

function getHoldingsList() {
  const symbols = Object.keys(gameState.positions || {});
  return companies.filter((c) => symbols.includes(c.symbol));
}

function renderSellHoldings() {
  const tbl = document.getElementById("sellHoldingsTable");
  if (!tbl) return;
  tbl.innerHTML = "";
  const header = document.createElement("tr");
  header.innerHTML = "<th>Symbol</th><th>Qty</th>";
  tbl.appendChild(header);
  Object.keys(gameState.positions || {}).forEach((sym) => {
    const row = document.createElement("tr");
    const qty = gameState.positions[sym].qty;
    row.innerHTML = `<td>${sym}</td><td>${qty}</td>`;
    tbl.appendChild(row);
  });
}

function renderSellOptions() {
  const tbl = document.getElementById("sellOptionsTable");
  if (!tbl) return;
  tbl.innerHTML = "";
  const header = document.createElement("tr");
  header.innerHTML =
    "<th>Symbol</th><th>Type</th><th>Strike</th><th>Qty</th><th>Value</th><th>Weeks Left</th><th>Action</th>";
  tbl.appendChild(header);
  (gameState.options || []).forEach((opt, idx) => {
    const remaining = opt.weeksToExpiry - (gameState.week - opt.purchaseWeek);
    if (remaining <= 0) return;
    const weeks = gameState.prices[opt.symbol];
    if (!weeks || !bsPrice) return;
    const price = weeks[weeks.length - 1][weeks[weeks.length - 1].length - 1];
    const val =
      bsPrice(
        price,
        opt.strike,
        OPTION_RISK_FREE_RATE,
        OPTION_VOLATILITY,
        remaining / 52,
        opt.type,
      ) * opt.qty;
    const row = document.createElement("tr");
    row.innerHTML = `<td>${opt.symbol}</td><td>${opt.type}</td><td>${opt.strike}</td><td>${opt.qty}</td><td>$${val.toFixed(2)}</td><td>${remaining}</td>`;
    const btnCell = document.createElement("td");
    const btn = document.createElement("button");
    btn.textContent = "Close Position";
    btn.addEventListener("click", () => closeOptionPosition(idx));
    btnCell.appendChild(btn);
    row.appendChild(btnCell);
    tbl.appendChild(row);
  });
}

function populateOptionSymbols(list) {
  const select = document.getElementById("optSymbol");
  if (!select) return;
  select.innerHTML = "";
  list
    .slice()
    .sort((a, b) => a.symbol.localeCompare(b.symbol))
    .forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.symbol;
      opt.textContent = `${c.symbol} - ${c.name}`;
      select.appendChild(opt);
    });
}

function populateOptionDetails() {
  const sym = document.getElementById("optSymbol").value;
  const weeksArr = gameState.prices[sym];
  if (!weeksArr) return;
  const week = weeksArr[weeksArr.length - 1];
  const price = week[week.length - 1];

  document.getElementById("optStockPrice").textContent = price.toFixed(2);

  const strikeSelect = document.getElementById("optStrike");
  strikeSelect.innerHTML = "";
  const deltas = [-0.2, -0.1, 0, 0.1, 0.2];
  deltas.forEach((d) => {
    const strike = Math.round((price * (1 + d)) / 5) * 5;
    const opt = document.createElement("option");
    opt.value = strike.toFixed(2);
    opt.textContent = strike.toFixed(2);
    strikeSelect.appendChild(opt);
  });

  const weeksSelect = document.getElementById("optWeeks");
  weeksSelect.innerHTML = "";
  [4, 8, 12, 16].forEach((w) => {
    const opt = document.createElement("option");
    opt.value = w;
    opt.textContent = w;
    weeksSelect.appendChild(opt);
  });
}

function updateOptionInfo() {
  const sym = document.getElementById("optSymbol").value;
  const strike = parseFloat(document.getElementById("optStrike").value) || 0;
  const weeks = parseInt(document.getElementById("optWeeks").value, 10) || 0;
  const qty = parseInt(document.getElementById("optQty").value, 10) || 0;
  const type = document.getElementById("optType").value;
  const weeksArr = gameState.prices[sym];
  if (!weeksArr || !bsPrice) return;
  const week = weeksArr[weeksArr.length - 1];
  const S = week[week.length - 1];
  document.getElementById("optStockPrice").textContent = S.toFixed(2);
  const premium = bsPrice(
    S,
    strike,
    OPTION_RISK_FREE_RATE,
    OPTION_VOLATILITY,
    weeks / 52,
    type,
  );
  document.getElementById("optPremium").textContent = premium.toFixed(2);
  const tradeValue = premium * qty;
  const commission = TRADE_COMMISSION;
  const fees = +(tradeValue * TRADE_FEE_RATE).toFixed(2);
  document.getElementById("optTotal").textContent = (
    tradeValue +
    commission +
    fees
  ).toFixed(2);
  updateAnalysisPanel();
}

function showOrderForm(mode) {
  tradeMode = mode;
  document.getElementById("tradeModeSelect").classList.add("hidden");
  document.getElementById("tradeForm").classList.remove("hidden");
  document.getElementById("analysisPanel").classList.remove("hidden");
  document.getElementById("buyBtn").classList.toggle("hidden", mode !== "BUY");
  document
    .getElementById("sellBtn")
    .classList.toggle("hidden", mode !== "SELL");
  const holdingsDiv = document.getElementById("sellHoldings");
  if (mode === "SELL") {
    holdingsDiv.classList.remove("hidden");
    renderSellHoldings();
    populateTradeSymbols(getHoldingsList());
  } else {
    holdingsDiv.classList.add("hidden");
    populateTradeSymbols(companies.filter((c) => !c.isIndex));
  }
  updateTradeInfo();
  updateAnalysisPanel();
}

function hideOrderForm() {
  document.getElementById("tradeForm").classList.add("hidden");
  document.getElementById("sellHoldings").classList.add("hidden");
  document.getElementById("tradeModeSelect").classList.remove("hidden");
  document.getElementById("analysisPanel").classList.add("hidden");
}

function updateTradeInfo() {
  const sym = document.getElementById("tradeSymbol").value;
  const weeks = gameState.prices[sym];
  if (!weeks) return;
  const week = weeks[weeks.length - 1];
  const price = week[week.length - 1];
  document.getElementById("tradePrice").textContent = price.toFixed(2);

  const slider = document.getElementById("tradeQtySlider");
  const input = document.getElementById("tradeQty");
  const maxBuy = calculateMaxBuy(gameState.cash, price);
  const holdings =
    (gameState.positions[sym] && gameState.positions[sym].qty) || 0;
  let max;
  if (tradeMode === "SELL") {
    max = Math.max(holdings, 1);
  } else {
    max = Math.max(maxBuy, 1);
  }
  slider.max = max;
  slider.value = 1;
  input.value = 1;
  updateTradeTotal();
  updateAnalysisPanel();
}

function updateTradeTotal() {
  const qty = parseInt(document.getElementById("tradeQty").value, 10) || 0;
  const price =
    parseFloat(document.getElementById("tradePrice").textContent) || 0;
  const tradeValue = qty * price;
  const commission = TRADE_COMMISSION;
  const fees = +(tradeValue * TRADE_FEE_RATE).toFixed(2);
  let total;
  const label = document.getElementById("tradeTotalLabel");
  if (tradeMode === "SELL") {
    total = tradeValue - commission - fees;
    if (label) label.textContent = "Net Proceeds:";
  } else {
    total = tradeValue + commission + fees;
    if (label) label.textContent = "Total Cost:";
  }
  const span = document.getElementById("tradeTotal");
  if (span) span.textContent = total.toFixed(2);
}

function computeVolatility(prices) {
  if (prices.length < 2) return 0;
  const rets = [];
  for (let i = 1; i < prices.length; i++) {
    rets.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length;
  return Math.sqrt(variance);
}

function computeAverage(prices) {
  if (prices.length === 0) return 0;
  return prices.reduce((a, b) => a + b, 0) / prices.length;
}

function drawChart(history) {
  const accentColor =
    getComputedStyle(document.body).getPropertyValue("--accent-color").trim() ||
    "#39ff14";
  currentHistory = history;
  const container = d3.select("#companyChart");
  if (container.empty()) return;
  container.selectAll("*").remove();
  if (history.length === 0) return;
  const width = container.node().clientWidth;
  const height = (width * 350) / 600;
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };
  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height);
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  const weeks = history.map((_, i) => i + 1);
  const x = d3.scaleLinear().domain(d3.extent(weeks)).range([0, chartWidth]);
  const y = d3
    .scaleLinear()
    .domain([d3.min(history), d3.max(history)])
    .nice()
    .range([chartHeight, 0]);
  const line = d3
    .line()
    .x((d, i) => x(weeks[i]))
    .y((d) => y(d))
    .curve(d3.curveMonotoneX);

  svg.style("touch-action", "none");

  const clipId = "clip-companyChart";
  svg
    .append("defs")
    .append("clipPath")
    .attr("id", clipId)
    .append("rect")
    .attr("width", chartWidth)
    .attr("height", chartHeight);

  const plot = g.append("g").attr("clip-path", `url(#${clipId})`);

  const pricePath = plot
    .append("path")
    .datum(history)
    .attr("fill", "none")
    .attr("stroke", accentColor)
    .attr("stroke-width", 2)
    .attr("d", line);

  const xAxis = g
    .append("g")
    .attr("transform", `translate(0,${chartHeight})`)
    .call(d3.axisBottom(x).ticks(10));
  const yAxis = g.append("g").call(
    d3
      .axisLeft(y)
      .ticks(5)
      .tickFormat((d) => {
        return Math.abs(d) >= 1000 ? Math.round(d / 1000) + "k" : d;
      }),
  );
  g.append("text")
    .attr("x", chartWidth / 2)
    .attr("y", chartHeight + margin.bottom - 5)
    .attr("text-anchor", "middle")
    .attr("fill", accentColor)
    .text("Week");

  const zoom = d3
    .zoom()
    .scaleExtent([1, 10])
    .translateExtent([
      [0, 0],
      [chartWidth, chartHeight],
    ])
    .extent([
      [0, 0],
      [chartWidth, chartHeight],
    ])
    .on("zoom", (event) => {
      const newX = event.transform.rescaleX(x);
      xAxis.call(d3.axisBottom(newX).ticks(10));
      const [xStart, xEnd] = newX.domain();
      const visible = [];
      for (let i = 0; i < weeks.length; i++) {
        if (weeks[i] >= xStart && weeks[i] <= xEnd) {
          visible.push(history[i]);
        }
      }
      if (visible.length > 0) {
        y.domain(d3.extent(visible)).nice();
        yAxis.call(
          d3
            .axisLeft(y)
            .ticks(5)
            .tickFormat((d) => {
              return Math.abs(d) >= 1000 ? Math.round(d / 1000) + "k" : d;
            }),
        );
      }
      pricePath.attr(
        "d",
        d3
          .line()
          .x((d, i) => newX(weeks[i]))
          .y((d) => y(d))
          .curve(d3.curveMonotoneX),
      );
    });

  svg.call(zoom);
}

function updateAnalysisPanel() {
  const tradeSel = document.getElementById("tradeSymbol");
  const optSel = document.getElementById("optSymbol");
  const sym = tradeSel ? tradeSel.value : optSel ? optSel.value : null;
  if (!sym) return;
  const panel = document.getElementById("analysisPanel");
  if (panel) panel.classList.remove("hidden");
  const historyWeeks = gameState.prices[sym] || [];
  const closes = historyWeeks.map((w) => w[w.length - 1]);
  drawChart(closes);
  if (closes.length > 0) {
    document.getElementById("price").textContent =
      closes[closes.length - 1].toFixed(2);
    document.getElementById("average").textContent =
      computeAverage(closes).toFixed(2);
    document.getElementById("high").textContent = Math.max(...closes).toFixed(
      2,
    );
    document.getElementById("low").textContent = Math.min(...closes).toFixed(2);
  } else {
    document.getElementById("average").textContent = "0";
    document.getElementById("high").textContent = "0";
    document.getElementById("low").textContent = "0";
  }
  const vol = computeVolatility(closes);
  document.getElementById("volatility").textContent = vol.toFixed(4);
}

function updateRank() {
  const prev = gameState.rank;
  const worth = gameState.netWorth;
  const ranks = ["Novice", "Apprentice", "Trader", "Tycoon"];
  const prevIndex = ranks.indexOf(prev);
  const newIndex =
    worth > 1000000 ? 3 : worth > 250000 ? 2 : worth > 50000 ? 1 : 0;
  if (newIndex > prevIndex) {
    gameState.rank = ranks[newIndex];
  }
  if (
    gameState.rank === "Apprentice" &&
    prev !== "Apprentice" &&
    typeof hasSeenApprentice === "function" &&
    typeof setApprenticeSeen === "function" &&
    !hasSeenApprentice()
  ) {
    if (typeof showMessage === "function") {
      showMessage(
        "Well look at that, you're an Apprentice. Options unlocked. Try not to blow up.",
      );
    }
    setApprenticeSeen();
  }
}

function doBuy() {
  const sym = document.getElementById("tradeSymbol").value.trim().toUpperCase();
  const qty = parseInt(document.getElementById("tradeQty").value, 10);
  if (!sym || !qty) return;
  const weeks = gameState.prices[sym];
  if (!weeks) {
    if (typeof showMessage === "function") {
      showMessage("Unknown symbol");
    }
    return;
  }
  const week = weeks[weeks.length - 1];
  const price = week[week.length - 1];
  const result = buyStock(gameState, sym, qty, price);
  if (!result.success) {
    if (typeof showMessage === "function") {
      showMessage("Not enough cash");
    }
  } else {
    updateRank();
    if (!gameState.tradeHistory) gameState.tradeHistory = [];
    const trade = {
      week: gameState.week,
      type: "BUY",
      symbol: sym,
      qty,
      price,
      commission: result.commission,
      fees: result.fees,
      total: result.total,
    };
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
  const sym = document.getElementById("tradeSymbol").value.trim().toUpperCase();
  const qty = parseInt(document.getElementById("tradeQty").value, 10);
  if (!sym || !qty) return;
  const weeks = gameState.prices[sym];
  if (!weeks) {
    if (typeof showMessage === "function") {
      showMessage("Unknown symbol");
    }
    return;
  }
  const week = weeks[weeks.length - 1];
  const price = week[week.length - 1];
  const result = sellStock(gameState, sym, qty, price);
  if (!result.success) {
    if (typeof showMessage === "function") {
      showMessage("Not enough shares");
    }
  } else {
    updateRank();
    if (!gameState.tradeHistory) gameState.tradeHistory = [];
    const trade = {
      week: gameState.week,
      type: "SELL",
      symbol: sym,
      qty,
      price,
      commission: result.commission,
      fees: result.fees,
      total: result.total,
    };
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
  const sym = document.getElementById("optSymbol").value.trim().toUpperCase();
  const type = document.getElementById("optType").value;
  const strike = parseFloat(document.getElementById("optStrike").value);
  const qty = parseInt(document.getElementById("optQty").value, 10);
  const w = parseInt(document.getElementById("optWeeks").value, 10);
  if (!sym || !qty || isNaN(strike) || isNaN(w)) return;
  const weeks = gameState.prices[sym];
  if (!weeks || !bsPrice) {
    if (typeof showMessage === "function") showMessage("Unknown symbol");
    return;
  }
  const price = weeks[weeks.length - 1][weeks[weeks.length - 1].length - 1];
  const premium = bsPrice(
    price,
    strike,
    OPTION_RISK_FREE_RATE,
    OPTION_VOLATILITY,
    w / 52,
    type,
  );
  const tradeValue = premium * qty;
  const commission = TRADE_COMMISSION;
  const fees = +(tradeValue * TRADE_FEE_RATE).toFixed(2);
  const total = tradeValue + commission + fees;
  if (gameState.cash < total) {
    if (typeof showMessage === "function") showMessage("Not enough cash");
    return;
  }
  gameState.cash -= total;
  if (!gameState.options) gameState.options = [];
  gameState.options.push({
    symbol: sym,
    type,
    strike,
    premium,
    qty,
    weeksToExpiry: w,
    purchaseWeek: gameState.week,
  });
  updateRank();
  if (!gameState.tradeHistory) gameState.tradeHistory = [];
  const trade = {
    week: gameState.week,
    type: `BUY ${type.toUpperCase()}`,
    symbol: sym,
    strike,
    optionType: type,
    weeks: w,
    qty,
    price: premium,
    commission,
    fees,
    total,
  };
  gameState.tradeHistory.push(trade);
  saveState(gameState);
  showTradeDialog(trade);
  renderMetrics();
  renderTradeHistory();
  renderSellOptions();
}

function closeOptionPosition(idx) {
  const opt = (gameState.options || [])[idx];
  if (!opt) return;
  const remaining = opt.weeksToExpiry - (gameState.week - opt.purchaseWeek);
  if (remaining <= 0) return;
  const weeks = gameState.prices[opt.symbol];
  if (!weeks || !bsPrice) {
    if (typeof showMessage === "function") showMessage("Unknown symbol");
    return;
  }
  const price = weeks[weeks.length - 1][weeks[weeks.length - 1].length - 1];
  const premium = bsPrice(
    price,
    opt.strike,
    OPTION_RISK_FREE_RATE,
    OPTION_VOLATILITY,
    remaining / 52,
    opt.type,
  );
  const tradeValue = premium * opt.qty;
  const commission = TRADE_COMMISSION;
  const fees = +(tradeValue * TRADE_FEE_RATE).toFixed(2);
  const proceeds = tradeValue - commission - fees;
  gameState.cash += proceeds;
  gameState.options.splice(idx, 1);
  updateRank();
  if (!gameState.tradeHistory) gameState.tradeHistory = [];
  const trade = {
    week: gameState.week,
    type: `SELL ${opt.type.toUpperCase()}`,
    symbol: opt.symbol,
    strike: opt.strike,
    optionType: opt.type,
    weeks: remaining,
    qty: opt.qty,
    price: premium,
    commission,
    fees,
    total: proceeds,
  };
  gameState.tradeHistory.push(trade);
  saveState(gameState);
  showTradeDialog(trade);
  renderMetrics();
  renderTradeHistory();
  renderSellOptions();
}

document.addEventListener("DOMContentLoaded", () => {
  gameState = loadState();
  if (
    gameState &&
    (gameState.week >= gameState.maxWeeks || gameState.gameOver)
  ) {
    window.location.href = "game-over.html";
    return;
  }
  renderMetrics();
  renderTradeHistory();
  renderSellOptions();
  fetch("data/company_master_data.json")
    .then((r) => r.json())
    .then((data) => {
      companies = data.companies;
      renderMetrics();
      renderTradeHistory();
      const optForm = document.getElementById("optionsForm");
      const unlocked =
        gameState.rank !== "Novice" ||
        (typeof hasSeenApprentice === "function" && hasSeenApprentice());
      if (unlocked && optForm) {
        populateOptionSymbols(companies.filter((c) => !c.isIndex));
        populateOptionDetails();
        optForm.classList.remove("hidden");
        updateOptionInfo();
        renderSellOptions();
      }
    });

  const tradeSymbol = document.getElementById("tradeSymbol");
  if (tradeSymbol) tradeSymbol.addEventListener("change", updateTradeInfo);
  const tradeQtySlider = document.getElementById("tradeQtySlider");
  const tradeQtyInput = document.getElementById("tradeQty");
  if (tradeQtySlider)
    tradeQtySlider.addEventListener("input", (e) => {
      if (tradeQtyInput) tradeQtyInput.value = e.target.value;
      updateTradeTotal();
    });
  if (tradeQtyInput)
    tradeQtyInput.addEventListener("input", (e) => {
      if (tradeQtySlider) tradeQtySlider.value = e.target.value;
      updateTradeTotal();
    });
  const buyBtn = document.getElementById("buyBtn");
  if (buyBtn) buyBtn.addEventListener("click", doBuy);
  const sellBtn = document.getElementById("sellBtn");
  if (sellBtn) sellBtn.addEventListener("click", doSell);
  const startBuyBtn = document.getElementById("startBuyBtn");
  if (startBuyBtn)
    startBuyBtn.addEventListener("click", () => showOrderForm("BUY"));
  const startSellBtn = document.getElementById("startSellBtn");
  if (startSellBtn)
    startSellBtn.addEventListener("click", () => showOrderForm("SELL"));
  const cancelTradeBtn = document.getElementById("cancelTradeBtn");
  if (cancelTradeBtn) cancelTradeBtn.addEventListener("click", hideOrderForm);

  const unlocked =
    gameState.rank !== "Novice" ||
    (typeof hasSeenApprentice === "function" && hasSeenApprentice());
  if (unlocked) {
    const optSymbol = document.getElementById("optSymbol");
    if (optSymbol)
      optSymbol.addEventListener("change", () => {
        populateOptionDetails();
        updateOptionInfo();
      });
    const optType = document.getElementById("optType");
    if (optType) optType.addEventListener("change", updateOptionInfo);
    const optStrike = document.getElementById("optStrike");
    if (optStrike) optStrike.addEventListener("change", updateOptionInfo);
    const optWeeks = document.getElementById("optWeeks");
    if (optWeeks) optWeeks.addEventListener("change", updateOptionInfo);
    const optQty = document.getElementById("optQty");
    if (optQty) optQty.addEventListener("input", updateOptionInfo);
    const optBuyBtn = document.getElementById("optBuyBtn");
    if (optBuyBtn) optBuyBtn.addEventListener("click", doBuyOption);
  }
});

window.addEventListener("resize", () => {
  if (currentHistory.length > 0) drawChart(currentHistory);
});
