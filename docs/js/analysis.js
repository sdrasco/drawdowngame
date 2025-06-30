let companies = [];
let gameState;
let currentIndex = 0;

function init() {
  fetch('data/company_master_data.json')
    .then(r => r.json())
    .then(data => {
      companies = data.companies.filter(c => !c.isIndex);
      populateSelect();
      gameState = loadState();
      const backTo = sessionStorage.getItem('backTo');
      if (gameState && (gameState.week >= gameState.maxWeeks || gameState.gameOver) && backTo !== 'game-over.html') {
        window.location.href = 'game-over.html';
        return;
      }
      const sel = document.getElementById('companySelect');
      sel.addEventListener('change', () => {
        currentIndex = companies.findIndex(c => c.symbol === sel.value);
        renderSelection();
      });
      document.getElementById('prevBtn').addEventListener('click', () => {
        if (companies.length === 0) return;
        currentIndex = (currentIndex - 1 + companies.length) % companies.length;
        sel.value = companies[currentIndex].symbol;
        renderSelection();
      });
      document.getElementById('nextBtn').addEventListener('click', () => {
        if (companies.length === 0) return;
        currentIndex = (currentIndex + 1) % companies.length;
        sel.value = companies[currentIndex].symbol;
        renderSelection();
      });
      if (companies.length > 0) {
        sel.value = companies[0].symbol;
        currentIndex = 0;
        renderSelection();
      }
    });
}

function populateSelect() {
  const sel = document.getElementById('companySelect');
  companies.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.symbol;
    opt.textContent = c.name;
    sel.appendChild(opt);
  });
}

function renderSelection() {
  const symbol = document.getElementById('companySelect').value;
  const company = companies.find(c => c.symbol === symbol);
  if (!company || !gameState) return;
  const historyWeeks = gameState.prices[symbol] || [];
  const closes = historyWeeks.map(w => w[w.length - 1]);
  drawChart(closes);
  if (closes.length > 0) {
    document.getElementById('price').textContent = closes[closes.length - 1].toFixed(2);
    document.getElementById('average').textContent = computeAverage(closes).toFixed(2);
    document.getElementById('high').textContent = Math.max(...closes).toFixed(2);
    document.getElementById('low').textContent = Math.min(...closes).toFixed(2);
  } else {
    document.getElementById('average').textContent = '0';
    document.getElementById('high').textContent = '0';
    document.getElementById('low').textContent = '0';
  }
  const vol = computeVolatility(closes);
  document.getElementById('volatility').textContent = vol.toFixed(4);
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

let currentHistory = [];

function drawChart(history) {
  currentHistory = history;
  const container = d3.select('#companyChart');
  if (container.empty()) return;
  container.selectAll('*').remove();
  if (history.length === 0) return;
  const width = container.node().clientWidth;
  const height = width * 350 / 600;
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };
  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height);
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  const weeks = history.map((_, i) => i + 1);
  const x = d3.scaleLinear()
    .domain(d3.extent(weeks))
    .range([0, chartWidth]);
  const y = d3.scaleLinear()
    .domain([d3.min(history), d3.max(history)])
    .nice()
    .range([chartHeight, 0]);
  const line = d3.line()
    .x((d, i) => x(weeks[i]))
    .y(d => y(d))
    .curve(d3.curveMonotoneX);

  svg.style('touch-action', 'none');

  const clipId = 'clip-companyChart';
  svg.append('defs').append('clipPath')
    .attr('id', clipId)
    .append('rect')
    .attr('width', chartWidth)
    .attr('height', chartHeight);

  const plot = g.append('g')
    .attr('clip-path', `url(#${clipId})`);

  const pricePath = plot.append('path')
    .datum(history)
    .attr('fill', 'none')
    .attr('stroke', '#39ff14')
    .attr('stroke-width', 2)
    .attr('d', line);

  const xAxis = g.append('g')
    .attr('transform', `translate(0,${chartHeight})`)
    .call(d3.axisBottom(x).ticks(10));
  g.append('g')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => {
      return Math.abs(d) >= 1000 ? Math.round(d / 1000) + 'k' : d;
    }));
  g.append('text')
    .attr('x', chartWidth / 2)
    .attr('y', chartHeight + margin.bottom - 5)
    .attr('text-anchor', 'middle')
    .attr('fill', '#33ff33')
    .text('Week');

  const zoom = d3.zoom()
    .scaleExtent([1, 10])
    .translateExtent([[0, 0], [chartWidth, chartHeight]])
    .extent([[0, 0], [chartWidth, chartHeight]])
    .on('zoom', event => {
      const newX = event.transform.rescaleX(x);
      xAxis.call(d3.axisBottom(newX).ticks(10));
      pricePath.attr('d', d3.line()
        .x((d, i) => newX(weeks[i]))
        .y(d => y(d))
        .curve(d3.curveMonotoneX)
      );
    });

  svg.call(zoom);
}

document.addEventListener('DOMContentLoaded', () => {
  init();
  const back = document.getElementById('backBtn');
  if (back) back.addEventListener('click', () => {
    const dest = sessionStorage.getItem('backTo') || 'play.html';
    window.location.href = dest;
  });
});

window.addEventListener('resize', () => {
  if (currentHistory.length > 0) drawChart(currentHistory);
});
