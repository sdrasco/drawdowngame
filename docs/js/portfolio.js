let gameState;
let companies = [];

document.addEventListener('DOMContentLoaded', () => {
  gameState = loadState();
  const backTo = sessionStorage.getItem('backTo');
  if (gameState && (gameState.week >= gameState.maxWeeks || gameState.gameOver) && backTo !== 'game-over.html') {
    window.location.href = 'game-over.html';
    return;
  }
  if (!gameState) return;
  if (!gameState.positions) gameState.positions = {};
  computeNetWorth(gameState);
  document.getElementById('pNetWorth').textContent = Math.round(gameState.netWorth).toLocaleString();
  document.getElementById('pCash').textContent = Math.round(gameState.cash).toLocaleString();
  renderPositions();
  renderMetrics();
  fetch('data/company_master_data.json')
    .then(r => r.json())
    .then(data => {
      companies = data.companies;
      renderTreemaps();
    });
  const back = document.getElementById('backBtn');
  if (back) back.addEventListener('click', () => {
    const dest = sessionStorage.getItem('backTo') || 'play.html';
    window.location.href = dest;
  });
  window.addEventListener('resize', renderTreemaps);
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

function renderTreemaps() {
  drawSectorTreemap();
  drawCompanyTreemap();
}

function drawSectorTreemap() {
  if (companies.length === 0) return;
  const data = {};
  data['Cash'] = gameState.cash || 0;
  Object.keys(gameState.positions).forEach(sym => {
    const comp = companies.find(c => c.symbol === sym);
    if (!comp) return;
    const weeks = gameState.prices[sym];
    if (!weeks) return;
    const price = weeks[weeks.length - 1][weeks[weeks.length - 1].length - 1];
    const value = (gameState.positions[sym].qty || 0) * price;
    const ind = comp.industry || 'Other';
    data[ind] = (data[ind] || 0) + value;
  });
  drawTreemap('sectorTreemap', data);
}

function drawCompanyTreemap() {
  const data = { 'Cash': gameState.cash || 0 };
  Object.keys(gameState.positions).forEach(sym => {
    const weeks = gameState.prices[sym];
    if (!weeks) return;
    const price = weeks[weeks.length - 1][weeks[weeks.length - 1].length - 1];
    const value = (gameState.positions[sym].qty || 0) * price;
    data[sym] = (data[sym] || 0) + value;
  });
  drawTreemap('companyTreemap', data);
}

function drawTreemap(id, obj) {
  const entries = Object.keys(obj).map(k => ({ name: k, value: obj[k] })).filter(d => d.value > 0);
  const container = d3.select('#' + id);
  if (container.empty()) return;
  container.selectAll('*').remove();
  if (entries.length === 0) return;
  const width = container.node().clientWidth;
  const height = width * 350 / 600;
  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height);
  const root = d3.hierarchy({ children: entries }).sum(d => d.value);
  d3.treemap().size([width, height]).padding(2)(root);
  const nodes = svg.selectAll('g')
    .data(root.leaves())
    .enter().append('g')
    .attr('transform', d => `translate(${d.x0},${d.y0})`);
  nodes.append('rect')
    .attr('width', d => d.x1 - d.x0)
    .attr('height', d => d.y1 - d.y0)
    .attr('fill', '#111')
    .attr('stroke', '#66ff66');
  nodes.append('text')
    .attr('x', d => (d.x1 - d.x0) / 2)
    .attr('y', d => (d.y1 - d.y0) / 2)
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('fill', '#ccffcc')
    .attr('font-size', '0.75rem')
    .text(d => d.data.name);
}

