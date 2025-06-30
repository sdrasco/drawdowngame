let state = {
  week: 1,
  netWorth: 10000
};

function updateDisplay() {
  document.getElementById("week").textContent = state.week;
  document.getElementById("netWorth").textContent = Math.round(state.netWorth).toLocaleString();
}

function nextWeek() {
  state.week += 1;
  state.netWorth += Math.floor(Math.random() * 2000 - 1000); // simulate win/loss\n  renderChart();
  updateDisplay();
}

function saveGame() {
  localStorage.setItem("drawdownSave", JSON.stringify(state));
  if (typeof showMessage === 'function') {
    showMessage("Game saved.");
  }
}

function loadGame() {
  const saved = localStorage.getItem("drawdownSave");
  if (saved) {
    state = JSON.parse(saved);
    updateDisplay();
    if (typeof showMessage === 'function') {
      showMessage("Game loaded.");
    }
  } else {
    if (typeof showMessage === 'function') {
      showMessage("No save found.");
    }
  }
}

function resetGame() {
  state = { week: 1, netWorth: 10000 };
  updateDisplay();
  if (typeof showMessage === 'function') {
    showMessage("Game reset.");
  }
}

function exportSave() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "drawdown_save.json";
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById("fileInput").addEventListener("change", function(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      state = JSON.parse(e.target.result);
      updateDisplay();
      if (typeof showMessage === 'function') {
        showMessage("Save loaded from file.");
      }
    } catch {
      if (typeof showMessage === 'function') {
        showMessage("Invalid save file.");
      }
    }
  };
  reader.readAsText(file);
});

updateDisplay();


const chartWidth = 40;
const chartHeight = 10;
let history = [];

function renderChart() {
  const chartEl = document.getElementById("asciiChart");
  history.push(state.netWorth);

  // Determine min and max for Y axis
  let min = Math.min(...history);
  let max = Math.max(...history);
  const range = max - min || 1; // prevent division by zero

  // Normalize values to chart height
  const scaled = history.map(val => {
    const relative = (val - min) / range;
    return chartHeight - 1 - Math.round(relative * (chartHeight - 1));
  });

  // Build chart grid
  let grid = Array.from({ length: chartHeight }, () =>
    Array.from({ length: chartWidth }, () => " ")
  );

  const start = Math.max(0, scaled.length - chartWidth);
  for (let x = 0; x < Math.min(chartWidth, scaled.length); x++) {
    const y = scaled[start + x];
    grid[y][x] = "*";
  }

  // Add axis labels
  const topLabel = ` $${max.toFixed(0).padStart(6)} `;
  const bottomLabel = ` $${min.toFixed(0).padStart(6)} `;
  const chartLines = grid.map(row => row.join("")).join("\n");

  chartEl.textContent = `${topLabel}\n${chartLines}\n${bottomLabel}`;
}
