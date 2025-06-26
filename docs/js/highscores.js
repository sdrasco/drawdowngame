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
  // check if any score exists
  const checkSnap = await getDocs(query(scoresRef, limit(1)));
  if (!checkSnap.empty) return; // already seeded

  // load random names
  const resp = await fetch('data/random_names.json');
  const names = await resp.json();

  // build & write MAX_SCORES fake entries
  const writes = [];
  for (let i = 0; i < MAX_SCORES; i++) {
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
