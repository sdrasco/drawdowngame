(function() {
  const STORAGE_KEY = 'drawdownHighScores';
  const MAX_SCORES = 10;

  function loadScores() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  function saveScores(scores) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  }

  function initScores() {
    let scores = loadScores();
    if (scores) return scores;
    scores = [];
    fetch('data/random_names.json')
      .then(r => r.json())
      .then(names => {
        for (let i = 0; i < MAX_SCORES; i++) {
          const name = names[Math.floor(Math.random() * names.length)];
          const score = Math.floor(Math.random() * 500000 + 5000);
          scores.push({ name, score });
        }
        scores.sort((a,b) => b.score - a.score);
        saveScores(scores);
        render(scores);
      });
    return scores;
  }

  function render(scores) {
    const tbl = document.getElementById('scoresTable');
    if (!tbl) return;
    tbl.innerHTML = '';
    const header = document.createElement('tr');
    header.innerHTML = '<th>Rank</th><th>Name</th><th>Net Worth</th>';
    tbl.appendChild(header);
    scores.forEach((s, idx) => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${idx + 1}</td><td>${s.name}</td><td>$${s.score.toLocaleString()}</td>`;
      tbl.appendChild(row);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const scores = loadScores();
    if (scores) {
      render(scores);
    } else {
      initScores();
    }
  });

  window.drawdownHighScores = {
    check(score, callback) {
      let scores = loadScores() || initScores();
      const lowest = scores[scores.length - 1].score;
      if (scores.length < MAX_SCORES || score > lowest) {
        const name = prompt('High score! Enter your name:', localStorage.getItem('drawdownUser') || '');
        if (name !== null) {
          if (name.trim()) {
            localStorage.setItem('drawdownUser', name.trim());
          }
          scores.push({ name: localStorage.getItem('drawdownUser'), score });
          scores.sort((a,b) => b.score - a.score);
          scores = scores.slice(0, MAX_SCORES);
          saveScores(scores);
          if (callback) callback();
        }
      } else {
        if (callback) callback();
      }
    }
  };
})();
