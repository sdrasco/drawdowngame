
// History arrays for the market index and player's portfolio
const marketHistory = [];
const portfolioHistory = [];

function initMarketHistory() {
  marketHistory.length = 0;
  portfolioHistory.length = 0;
  if (!gameState || !gameState.prices || !gameState.prices[INDEX_SYMBOL]) return;
  const indexWeeks = gameState.prices[INDEX_SYMBOL];
  const netHist = gameState.netWorthHistory || [];
  const startIdx = Math.max(indexWeeks.length - netHist.length, indexWeeks.length - 52);
  for (let i = startIdx; i < indexWeeks.length; i++) {
    const week = indexWeeks[i];
    marketHistory.push(week[week.length - 1]);
  }
  if (gameState && gameState.netWorthHistory) {
    const worthStart = Math.max(0, gameState.netWorthHistory.length - 52);
    for (let i = worthStart; i < gameState.netWorthHistory.length; i++) {
      portfolioHistory.push(gameState.netWorthHistory[i]);
    }
  }
}

function renderMarketChart() {
  const weeks = [];
  const historyLen = Math.max(marketHistory.length, portfolioHistory.length);
  const startWeek = gameState.week - historyLen + 1;
  for (let i = 0; i < historyLen; i++) weeks.push(startWeek + i);

  const startIndex = marketHistory[0];
  const startWorth = portfolioHistory[0] || gameState.netWorth;
  const indexPct = marketHistory.map(v => ((v - startIndex) / startIndex) * 100);
  const worthPct = portfolioHistory.map(v => ((v - startWorth) / startWorth) * 100);

  function drawChart(id) {
    const container = d3.select('#' + id);
    if (container.empty()) return;
    container.selectAll('*').remove();
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
    const x = d3.scaleLinear()
      .domain(d3.extent(weeks))
      .range([0, chartWidth]);
    const y = d3.scaleLinear()
      .domain([d3.min(indexPct.concat(worthPct)), d3.max(indexPct.concat(worthPct))])
      .nice()
      .range([chartHeight, 0]);
    const line = d3.line()
      .x((d, i) => x(weeks[i]))
      .y(d => y(d))
      .curve(d3.curveMonotoneX);

    svg.style('touch-action', 'none');

    const clipId = `clip-${id}`;
    svg.append('defs').append('clipPath')
      .attr('id', clipId)
      .append('rect')
      .attr('width', chartWidth)
      .attr('height', chartHeight);

    const plot = g.append('g')
      .attr('clip-path', `url(#${clipId})`);

    const indexPath = plot.append('path')
      .datum(indexPct)
      .attr('fill', 'none')
      .attr('stroke', '#39ff14')
      .attr('stroke-width', 2)
      .attr('d', line);

    const portfolioPath = plot.append('path')
      .datum(worthPct)
      .attr('fill', 'none')
      .attr('stroke', '#ff8c00')
      .attr('stroke-width', 2)
      .attr('d', line);

    const xAxis = g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x).ticks(10));
    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + '%'));
    g.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight + margin.bottom - 5)
      .attr('text-anchor', 'middle')
      .attr('fill', '#33ff33')
      .text('Week');

    plot.append('line')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', y(0))
      .attr('y2', y(0))
      .attr('stroke', '#777')
      .attr('stroke-dasharray', '3 3');

    const legendWidth = 120;
    const legend = svg.append('g')
      .attr('transform', `translate(${(width - legendWidth) / 2},10)`);
    legend.append('line')
      .attr('x1', 0).attr('y1', 0)
      .attr('x2', 20).attr('y2', 0)
      .attr('stroke', '#39ff14')
      .attr('stroke-width', 2);
    legend.append('text')
      .attr('x', 24).attr('y', 0)
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#33ff33')
      .text('Index');
    legend.append('line')
      .attr('x1', 80).attr('y1', 0)
      .attr('x2', 100).attr('y2', 0)
      .attr('stroke', '#ff8c00')
      .attr('stroke-width', 2);
    legend.append('text')
      .attr('x', 104).attr('y', 0)
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#33ff33')
      .text('Portfolio');

    const zoom = d3.zoom()
      .scaleExtent([1, 10])
      .translateExtent([[0, 0], [chartWidth, chartHeight]])
      .extent([[0, 0], [chartWidth, chartHeight]])
      .on('zoom', event => {
        const newX = event.transform.rescaleX(x);
        xAxis.call(d3.axisBottom(newX).ticks(10));
        indexPath.attr('d', d3.line()
          .x((d, i) => newX(weeks[i]))
          .y(d => y(d))
          .curve(d3.curveMonotoneX)
        );
        portfolioPath.attr('d', d3.line()
          .x((d, i) => newX(weeks[i]))
          .y(d => y(d))
          .curve(d3.curveMonotoneX)
        );
      });

    svg.call(zoom);
  }

  drawChart('marketChart');
  drawChart('marketChartMobile');
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

window.addEventListener('resize', renderMarketChart);
