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

function drawChart(history) {
  const canvas = document.getElementById('companyChart');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (history.length === 0) return;
  const paddingLeft = 60;
  const paddingRight = 10;
  const paddingTop = 10;
  const paddingBottom = 40;
  const chartWidth = canvas.width - paddingLeft - paddingRight;
  const chartHeight = canvas.height - paddingTop - paddingBottom;
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;
  ctx.strokeStyle = '#39ff14';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(paddingLeft, paddingTop);
  ctx.lineTo(paddingLeft, paddingTop + chartHeight);
  ctx.lineTo(paddingLeft + chartWidth, paddingTop + chartHeight);
  ctx.stroke();
  ctx.font = '12px Courier New';
  ctx.fillStyle = '#33ff33';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const yTicks = 4;
  for (let i = 0; i <= yTicks; i++) {
    const y = paddingTop + chartHeight - (i / yTicks) * chartHeight;
    const raw = min + (i / yTicks) * range;
    let label = raw.toFixed(0);
    if (Math.abs(raw) >= 1000) {
      label = `${Math.round(raw / 1000)}k`;
    }
    ctx.beginPath();
    ctx.moveTo(paddingLeft - 5, y);
    ctx.lineTo(paddingLeft, y);
    ctx.stroke();
    ctx.fillText(label, paddingLeft - 8, y);
  }
  ctx.save();
  ctx.translate(15, paddingTop + chartHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('Price ($)', 0, 0);
  ctx.restore();
  const xStep = chartWidth / Math.max(1, history.length - 1);
  const points = history.map((val, idx) => {
    return { x: paddingLeft + idx * xStep, y: paddingTop + chartHeight - ((val - min) / range) * chartHeight };
  });
  ctx.shadowColor = '#39ff14';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  if (points.length > 0) {
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const midX = (points[i].x + points[i + 1].x) / 2;
      const midY = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  }
  ctx.stroke();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  const labelStep = Math.ceil(history.length / 10);
  history.forEach((_, idx) => {
    const x = paddingLeft + idx * xStep;
    ctx.beginPath();
    ctx.moveTo(x, paddingTop + chartHeight);
    ctx.lineTo(x, paddingTop + chartHeight + 5);
    ctx.stroke();
    if (idx % labelStep === 0 || idx === history.length - 1) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(idx + 1, x, paddingTop + chartHeight + 8);
    }
  });
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Week', paddingLeft + chartWidth / 2, canvas.height - 10);
}

document.addEventListener('DOMContentLoaded', init);
