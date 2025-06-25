
// Simple placeholder market history
const marketHistory = [100];

function renderMarketChart() {
  const canvas = document.getElementById('marketChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const min = Math.min(...marketHistory);
  const max = Math.max(...marketHistory);
  const range = max - min || 1;

  ctx.strokeStyle = '#33ff33';
  ctx.beginPath();
  marketHistory.forEach((val, idx) => {
    const x = (idx / (marketHistory.length - 1)) * (canvas.width - 1);
    const y = canvas.height - ((val - min) / range) * canvas.height;
    if (idx === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
}

function updateMarket() {
  const last = marketHistory[marketHistory.length - 1];
  const change = Math.random() * 4 - 2; // random walk
  marketHistory.push(last + change);
  if (marketHistory.length > 30) {
    marketHistory.shift();
  }
  renderMarketChart();
}
