function loadState() {
  const saved = localStorage.getItem('drawdownSave');
  if (!saved) {
    return null;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function saveState(state) {
  localStorage.setItem('drawdownSave', JSON.stringify(state));
}
