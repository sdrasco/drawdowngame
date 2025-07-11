// highscores.js
// Local-storage-based high score board for Drawdown

const BOARD_KEY = 'drawdown_high_scores';
export const MAX_SCORES = 10;

function saveBoard(board) {
  localStorage.setItem(BOARD_KEY, JSON.stringify(board.slice(0, MAX_SCORES)));
}

export function loadBoard() {
  const raw = localStorage.getItem(BOARD_KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.sort((a, b) => b.score - a.score) : [];
  } catch {
    return [];
  }
}

export async function initScores() {
  if (loadBoard().length) return;
  const resp = await fetch('data/random_names.json');
  const names = await resp.json();
  const board = [];
  for (let i = 0; i < MAX_SCORES; i++) {
    const player = names[Math.floor(Math.random() * names.length)];
    const score = Math.floor(Math.random() * 500000 + 5000);
    board.push({ player, score });
  }
  saveBoard(board);
}

export function submitScore(player, score) {
  const board = loadBoard();
  board.push({ player, score });
  board.sort((a, b) => b.score - a.score);
  saveBoard(board);
}

export function watchBoard(callback) {
  const handler = (e) => {
    if (e.key === BOARD_KEY) callback(loadBoard());
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
