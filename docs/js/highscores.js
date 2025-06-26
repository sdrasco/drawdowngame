// highscores.js
// — Firebase + Firestore high-score board with initial fake seeding

// 1. Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 2. Your Firebase config (from console)
const firebaseConfig = {
  apiKey: "AIzaSyARFwJOMSm3h_nyf4EbS4vPtHhJfiDAVjc",
  authDomain: "drawdowngame-high-scores.firebaseapp.com",
  projectId: "drawdowngame-high-scores",
  storageBucket: "drawdowngame-high-scores.firebasestorage.app",
  messagingSenderId: "740833941473",
  appId: "1:740833941473:web:61e4436f417c4f8535e4a0"
};

// 3. Init Firebase & Firestore refs
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const scoresRef = collection(db, "scores");
const MAX_SCORES = 10;

// 4. Seed initial fake scores if the collection is empty
export async function initScores() {
  // check how many scores exist
  const existingSnap = await getDocs(scoresRef);
  const existingCount = existingSnap.size;
  if (existingCount >= MAX_SCORES) return; // already seeded

  const seedCount = MAX_SCORES - existingCount;

  // load random names
  const resp = await fetch('data/random_names.json');
  const names = await resp.json();

  // build & write seedCount fake entries
  const writes = [];
  for (let i = 0; i < seedCount; i++) {
    const player = names[Math.floor(Math.random() * names.length)];
    const score  = Math.floor(Math.random() * 500000 + 5000);
    writes.push(
      addDoc(scoresRef, { player, score, ts: Date.now() })
    );
  }
  await Promise.all(writes);
}

// 5. Submit a new real score
export async function submitScore(player, score) {
  await addDoc(scoresRef, { player, score, ts: Date.now() });
}

// 6. Load top-10 once
export async function loadBoard() {
  const q = query(scoresRef, orderBy("score", "desc"), limit(MAX_SCORES));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}

// 7. Live-update listener
export function watchBoard(callback) {
  const q = query(scoresRef, orderBy("score", "desc"), limit(MAX_SCORES));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => d.data()));
  });
}

// Prompt the player for a leaderboard name using the retro style overlay
function promptForScoreName(defaultName) {
  return new Promise(resolve => {
    const promptEl = document.getElementById('scorePrompt');
    const inputEl = document.getElementById('scoreInput');
    const submitBtn = document.getElementById('scoreSubmit');
    const randomBtn = document.getElementById('scoreRandom');
    let nameList = null;

    function finish(value) {
      promptEl.classList.add('hidden');
      submitBtn.removeEventListener('click', submit);
      randomBtn.removeEventListener('click', pickRandom);
      inputEl.removeEventListener('keypress', keyHandler);
      resolve(value);
    }

    function submit() {
      let value = inputEl.value.trim();
      if (!value) value = defaultName || 'default';
      finish(value);
    }

    function pickRandom() {
      const choose = () => {
        const value = nameList[Math.floor(Math.random() * nameList.length)];
        finish(value);
      };
      if (nameList) {
        choose();
      } else {
        fetch('data/random_names.json')
          .then(r => r.json())
          .then(d => { nameList = d; choose(); });
      }
    }

    function keyHandler(e) {
      if (e.key === 'Enter') {
        submit();
      }
    }

    submitBtn.addEventListener('click', submit);
    randomBtn.addEventListener('click', pickRandom);
    inputEl.addEventListener('keypress', keyHandler);
    inputEl.value = defaultName || '';
    promptEl.classList.remove('hidden');
    inputEl.focus();
  });
}

// 8. Determine if a score qualifies and submit if so
export async function check(score, cb) {
  const board = await loadBoard();
  const needsSave = board.length < MAX_SCORES ||
    (board.length && score > board[board.length - 1].score);
  if (needsSave) {
    alert('Congratulations! You made the high score board!');
    const name = await promptForScoreName(window.getUser());
    await submitScore(name, score);
  }
  if (typeof cb === 'function') cb();
}

// expose to callers when loaded as a classic script
if (typeof window !== 'undefined') {
  window.drawdownHighScores = { check };
}
