
// History of the market index closing price for each week
const marketHistory = [];

function initMarketHistory() {
  marketHistory.length = 0;
  if (!gameState || !gameState.prices || !gameState.prices[INDEX_SYMBOL]) return;
  gameState.prices[INDEX_SYMBOL].forEach(week => {
    marketHistory.push(week[week.length - 1]);
  });
}

function renderMarketChart() {
  const canvas = document.getElementById('marketChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (marketHistory.length === 0) return;

  const paddingLeft = 40;
  const paddingRight = 10;
  const paddingTop = 10;
  const paddingBottom = 30;

  const chartWidth = canvas.width - paddingLeft - paddingRight;
  const chartHeight = canvas.height - paddingTop - paddingBottom;

  const min = Math.min(...marketHistory);
  const max = Math.max(...marketHistory);
  const range = max - min || 1;

  ctx.strokeStyle = '#39ff14';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#39ff14';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.moveTo(paddingLeft, paddingTop);
  ctx.lineTo(paddingLeft, paddingTop + chartHeight);
  ctx.lineTo(paddingLeft + chartWidth, paddingTop + chartHeight);
  ctx.stroke();

  ctx.font = '12px Courier New';
  ctx.fillStyle = '#33ff33';

  const yTicks = 4;
  for (let i = 0; i <= yTicks; i++) {
    const y = paddingTop + chartHeight - (i / yTicks) * chartHeight;
    const value = (min + (i / yTicks) * range).toFixed(0);
    ctx.beginPath();
    ctx.moveTo(paddingLeft - 5, y);
    ctx.lineTo(paddingLeft, y);
    ctx.stroke();
    ctx.fillText(value, 2, y + 4);
  }

  ctx.save();
  ctx.translate(10, paddingTop + chartHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Price', 0, 0);
  ctx.restore();

  const xStep = chartWidth / Math.max(1, marketHistory.length - 1);

  // draw price line (smoothed)
  const points = marketHistory.map((val, idx) => {
    return {
      x: paddingLeft + idx * xStep,
      y: paddingTop + chartHeight - ((val - min) / range) * chartHeight
    };
  });
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

  // draw x-axis ticks
  marketHistory.forEach((_, idx) => {
    const x = paddingLeft + idx * xStep;
    ctx.beginPath();
    ctx.moveTo(x, paddingTop + chartHeight);
    ctx.lineTo(x, paddingTop + chartHeight + 5);
    ctx.stroke();
  });

  ctx.fillText('Week', paddingLeft + chartWidth / 2 - 15, canvas.height - 5);
}

function updateMarket() {
  if (!gameState || !gameState.prices || !gameState.prices[INDEX_SYMBOL]) return;
  const indexWeeks = gameState.prices[INDEX_SYMBOL];
  const lastWeek = indexWeeks[indexWeeks.length - 1];
  marketHistory.push(lastWeek[lastWeek.length - 1]);
  if (marketHistory.length > 52) {
    marketHistory.shift();
  }
  renderMarketChart();
}
