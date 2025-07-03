const demoData = [
  { name: 'Tech', value: 40 },
  { name: 'Finance', value: 25 },
  { name: 'Healthcare', value: 20 },
  { name: 'Energy', value: 10 },
  { name: 'Cash', value: 5 }
];

document.addEventListener('DOMContentLoaded', () => {
  drawStackedBar('#stackedBarChart', demoData);
  drawBubble('#bubbleChart', demoData);
  drawTreemap('#treemapChart', demoData);
});

function applyPatterns(svg, prefix, count) {
  const defs = svg.append('defs');
  const patternTypes = ['diag1', 'diag2', 'grid', 'dots'];
  for (let i = 0; i < count; i++) {
    const type = patternTypes[i % patternTypes.length];
    const pat = defs.append('pattern')
      .attr('id', `${prefix}${i}`)
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
  }
}

function drawStackedBar(sel, data) {
  const container = d3.select(sel);
  if (container.empty()) return;
  container.selectAll('*').remove();
  const width = container.node().clientWidth;
  const height = 60;
  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height);
  applyPatterns(svg, 'sbPat', data.length);
  const total = d3.sum(data, d => d.value);
  let offset = 0;
  svg.selectAll('rect')
    .data(data)
    .enter().append('rect')
    .attr('x', d => {
      const x = offset / total * width;
      offset += d.value;
      return x;
    })
    .attr('y', 0)
    .attr('width', d => d.value / total * width)
    .attr('height', height)
    .attr('fill', (_, i) => `url(#sbPat${i})`)
    .attr('stroke', '#66ff66');
  offset = 0;
  svg.selectAll('text')
    .data(data)
    .enter().append('text')
    .attr('x', d => {
      const x = (offset + d.value / 2) / total * width;
      offset += d.value;
      return x;
    })
    .attr('y', height / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', 'middle')
    .attr('fill', '#ccffcc')
    .attr('font-size', '0.75rem')
    .text(d => d.name);
}

function drawBubble(sel, data) {
  const container = d3.select(sel);
  if (container.empty()) return;
  container.selectAll('*').remove();
  const width = container.node().clientWidth;
  const height = width;
  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height);
  applyPatterns(svg, 'bubblePat', data.length);
  const root = d3.pack()
    .size([width, height])
    .padding(2)(d3.hierarchy({ children: data }).sum(d => d.value));
  const nodes = svg.selectAll('g')
    .data(root.leaves())
    .enter().append('g')
    .attr('transform', d => `translate(${d.x},${d.y})`);
  nodes.append('circle')
    .attr('r', d => d.r)
    .attr('fill', (_, i) => `url(#bubblePat${i})`)
    .attr('stroke', '#66ff66');
  nodes.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('fill', '#ccffcc')
    .attr('font-size', '0.75rem')
    .text(d => d.data.name);
}

function drawTreemap(sel, data) {
  const container = d3.select(sel);
  if (container.empty()) return;
  container.selectAll('*').remove();
  const width = container.node().clientWidth;
  const height = width * 0.6;
  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height);
  applyPatterns(svg, 'treePat', data.length);
  const root = d3.hierarchy({ children: data }).sum(d => d.value);
  d3.treemap().size([width, height]).padding(2)(root);
  const nodes = svg.selectAll('g')
    .data(root.leaves())
    .enter().append('g')
    .attr('transform', d => `translate(${d.x0},${d.y0})`);
  nodes.append('rect')
    .attr('width', d => d.x1 - d.x0)
    .attr('height', d => d.y1 - d.y0)
    .attr('fill', (_, i) => `url(#treePat${i})`)
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
