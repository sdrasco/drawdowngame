let state = {
  week: 1,
  netWorth: 10000
};

function updateDisplay() {
  document.getElementById("week").textContent = state.week;
  document.getElementById("netWorth").textContent = state.netWorth.toLocaleString();
}

function nextWeek() {
  state.week += 1;
  state.netWorth += Math.floor(Math.random() * 2000 - 1000); // simulate win/loss
  updateDisplay();
}

function saveGame() {
  localStorage.setItem("drawdownSave", JSON.stringify(state));
  alert("Game saved.");
}

function loadGame() {
  const saved = localStorage.getItem("drawdownSave");
  if (saved) {
    state = JSON.parse(saved);
    updateDisplay();
    alert("Game loaded.");
  } else {
    alert("No save found.");
  }
}

function resetGame() {
  state = { week: 1, netWorth: 10000 };
  updateDisplay();
  alert("Game reset.");
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
      alert("Save loaded from file.");
    } catch {
      alert("Invalid save file.");
    }
  };
  reader.readAsText(file);
});

updateDisplay();