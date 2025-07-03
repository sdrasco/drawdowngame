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
      renderPieCharts();
    });
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

function renderPieCharts() {
  drawSectorChart();
  drawCompanyChart();
}

function drawSectorChart() {
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
  drawPie('sectorChart', data);
}

function drawCompanyChart() {
  const data = { 'Cash': gameState.cash || 0 };
  Object.keys(gameState.positions).forEach(sym => {
    const weeks = gameState.prices[sym];
    if (!weeks) return;
    const price = weeks[weeks.length - 1][weeks[weeks.length - 1].length - 1];
    const value = (gameState.positions[sym].qty || 0) * price;
    data[sym] = (data[sym] || 0) + value;
  });
  drawPie('companyChartPie', data);
}

function drawPie(id, obj) {
  const entries = Object.keys(obj).map(k => ({ name: k, value: obj[k] })).filter(d => d.value > 0);
  const container = d3.select('#' + id);
  if (container.empty()) return;
  container.selectAll('*').remove();
  if (entries.length === 0) return;
  const width = container.node().clientWidth;
  const height = width;
  const radius = Math.min(width, height) / 2;
  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`);
  const pie = d3.pie().sort(null).value(d => d.value);
  const arc = d3.arc().outerRadius(radius - 10).innerRadius(0);
  const labelArc = d3.arc().outerRadius(radius * 0.7).innerRadius(radius * 0.7);

  const defs = svg.append('defs');
  const patternTypes = ['diag1', 'diag2', 'grid', 'dots'];
  entries.forEach((_, i) => {
    const type = patternTypes[i % patternTypes.length];
    const pat = defs.append('pattern')
      .attr('id', `piePattern${i}`)
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 8)
      .attr('height', 8);
    pat.append('rect')
      .attr('width', 8)
      .attr('height', 8)
      .attr('fill', '#222');
    if (type === 'diag1') {
      pat.append('path').attr('d', 'M0,8 l8,-8 M-2,6 l4,-4 M6,10 l4,-4')
        .attr('stroke', '#66ff66').attr('stroke-width', 2);
    } else if (type === 'diag2') {
      pat.append('path').attr('d', 'M0,0 l8,8 M-2,2 l4,4 M6,-2 l4,4')
        .attr('stroke', '#66ff66').attr('stroke-width', 2);
    } else if (type === 'grid') {
      pat.append('path').attr('d', 'M0,2 l8,0 M0,6 l8,0 M2,0 l0,8 M6,0 l0,8')
        .attr('stroke', '#66ff66').attr('stroke-width', 2);
    } else if (type === 'dots') {
      pat.append('circle').attr('cx', 2).attr('cy', 2).attr('r', 1).attr('fill', '#66ff66');
      pat.append('circle').attr('cx', 6).attr('cy', 6).attr('r', 1).attr('fill', '#66ff66');
      pat.append('circle').attr('cx', 2).attr('cy', 6).attr('r', 1).attr('fill', '#66ff66');
      pat.append('circle').attr('cx', 6).attr('cy', 2).attr('r', 1).attr('fill', '#66ff66');
    }
  });

  const arcs = svg.selectAll('path')
    .data(pie(entries))
    .enter().append('path')
    .attr('d', arc)
    .attr('fill', (_, i) => `url(#piePattern${i})`)
    .attr('stroke', '#66ff66')
    .attr('stroke-width', 1);
  svg.selectAll('text')
    .data(pie(entries))
    .enter().append('text')
    .attr('transform', d => `translate(${labelArc.centroid(d)})`)
    .attr('dy', '0.35em')
    .attr('text-anchor', 'middle')
    .attr('fill', '#ccffcc')
    .attr('font-size', '0.75rem')
    .text(d => d.data.name);
}

