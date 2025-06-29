
// History arrays for the market index and player's portfolio
const marketHistory = [];
const portfolioHistory = [];

function initMarketHistory() {
  marketHistory.length = 0;
  portfolioHistory.length = 0;
  if (!gameState || !gameState.prices || !gameState.prices[INDEX_SYMBOL]) return;
  gameState.prices[INDEX_SYMBOL].forEach(week => {
    marketHistory.push(week[week.length - 1]);
  });
  if (gameState && gameState.netWorthHistory) {
    gameState.netWorthHistory.forEach(w => {
      portfolioHistory.push(w);
    });
  }
}

function renderMarketChart() {
  const canvas = document.getElementById('marketChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (marketHistory.length === 0) return;

  const historyLen = Math.max(marketHistory.length, portfolioHistory.length);

  const paddingLeft = 60;
  const paddingRight = 10;
  const paddingTop = 10;
  const paddingBottom = 40;

  const chartWidth = canvas.width - paddingLeft - paddingRight;
  const chartHeight = canvas.height - paddingTop - paddingBottom;

  const startIndex = marketHistory[0];
  const startWorth = portfolioHistory[0] || gameState.netWorth;
  const indexPct = marketHistory.map(v => ((v - startIndex) / startIndex) * 100);
  const worthPct = portfolioHistory.map(v => ((v - startWorth) / startWorth) * 100);

  const min = Math.min(...indexPct, ...worthPct);
  const max = Math.max(...indexPct, ...worthPct);
  const range = max - min || 1;

  ctx.strokeStyle = '#39ff14';
  ctx.lineWidth = 2;
  // draw axes without glow
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
    const label = `${raw.toFixed(0)}%`;
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
  ctx.fillText('Change (%)', 0, 0);
  ctx.restore();

  const xStep = chartWidth / Math.max(1, historyLen - 1);

  // draw price line (smoothed)
  const points = indexPct.map((val, idx) => {
    return {
      x: paddingLeft + idx * xStep,
      y: paddingTop + chartHeight - ((val - min) / range) * chartHeight
    };
  });
  // enable glow for the index line
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

  // draw portfolio line
  const portPoints = worthPct.map((val, idx) => {
    return {
      x: paddingLeft + idx * xStep,
      y: paddingTop + chartHeight - ((val - min) / range) * chartHeight
    };
  });
  ctx.strokeStyle = '#ff8c00';
  ctx.shadowColor = '#ff8c00';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  if (portPoints.length > 0) {
    ctx.moveTo(portPoints[0].x, portPoints[0].y);
    for (let i = 0; i < portPoints.length - 1; i++) {
      const midX = (portPoints[i].x + portPoints[i + 1].x) / 2;
      const midY = (portPoints[i].y + portPoints[i + 1].y) / 2;
      ctx.quadraticCurveTo(portPoints[i].x, portPoints[i].y, midX, midY);
    }
    ctx.lineTo(portPoints[portPoints.length - 1].x, portPoints[portPoints.length - 1].y);
  }
  ctx.stroke();

  // disable glow for remaining elements
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // legend
  const legendX = paddingLeft + 5;
  const legendY = paddingTop + 10;
  ctx.fillStyle = '#39ff14';
  ctx.fillRect(legendX, legendY - 4, 10, 2);
  ctx.fillStyle = '#33ff33';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Index', legendX + 14, legendY);
  ctx.fillStyle = '#ff8c00';
  ctx.fillRect(legendX, legendY + 12 - 4, 10, 2);
  ctx.fillStyle = '#33ff33';
  ctx.fillText('Portfolio', legendX + 14, legendY + 12);

  // draw x-axis ticks and labels
  const startWeek = gameState.week - historyLen + 1;
  const labelStep = Math.ceil(historyLen / 10);
  for (let idx = 0; idx < historyLen; idx++) {
    const x = paddingLeft + idx * xStep;
    ctx.beginPath();
    ctx.moveTo(x, paddingTop + chartHeight);
    ctx.lineTo(x, paddingTop + chartHeight + 5);
    ctx.stroke();
    if (idx % labelStep === 0 || idx === historyLen - 1) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(startWeek + idx, x, paddingTop + chartHeight + 8);
    }
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Week', paddingLeft + chartWidth / 2, canvas.height - 10);
}

function updateMarket() {
  if (!gameState || !gameState.prices || !gameState.prices[INDEX_SYMBOL]) return;
  const indexWeeks = gameState.prices[INDEX_SYMBOL];
  const lastWeek = indexWeeks[indexWeeks.length - 1];
  marketHistory.push(lastWeek[lastWeek.length - 1]);
  if (gameState.netWorth !== undefined) {
    portfolioHistory.push(gameState.netWorth);
  }
  if (marketHistory.length > 52) {
    marketHistory.shift();
  }
  if (portfolioHistory.length > 52) {
    portfolioHistory.shift();
  }
  renderMarketChart();
}
