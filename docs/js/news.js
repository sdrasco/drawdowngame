// Placeholder headlines for demo
const headlinePool = [
  'Economy shows signs of recovery',
  'Tech stocks rally on earnings beat',
  'Oil prices dip amid oversupply fears',
  'Consumer confidence hits record high',
  'Federal Reserve hints at rate cuts',
  'Manufacturing slows in latest report'
];

function renderNews() {
  const container = document.getElementById('news');
  if (!container) return;
  container.innerHTML = '';
  const headlines = headlinePool.sort(() => 0.5 - Math.random()).slice(0, 4);
  headlines.forEach(text => {
    const div = document.createElement('div');
    div.className = 'headline';
    div.textContent = text;
    container.appendChild(div);
  });
}
