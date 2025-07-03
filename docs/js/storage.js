function getUser() {
  return localStorage.getItem('drawdownUser');
}

function promptForUser(callback) {
  const promptEl = document.getElementById('usernamePrompt');
  const inputEl = document.getElementById('usernameInput');
  const submitBtn = document.getElementById('usernameSubmit');
  const randomBtn = document.getElementById('usernameRandom');
  let nameList = null;

  function finish(value) {
    localStorage.setItem('drawdownUser', value);
    promptEl.classList.add('hidden');
    submitBtn.removeEventListener('click', submit);
    randomBtn.removeEventListener('click', pickRandom);
    inputEl.removeEventListener('keypress', keyHandler);
    callback(value);
  }

  function submit() {
    let value = inputEl.value.trim();
    if (!value) value = 'default';
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
  promptEl.classList.remove('hidden');
  inputEl.focus();
}

function ensureUser(callback) {
  const user = getUser();
  if (user) {
    callback(user);
  } else {
    promptForUser(callback);
  }
}

function getStorageKey() {
  return 'drawdownSave_' + getUser();
}

function loadState() {
  const saved = localStorage.getItem(getStorageKey());
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
  localStorage.setItem(getStorageKey(), JSON.stringify(state));
}

function hasSeenGreeting() {
  return localStorage.getItem('drawdownGreeting_' + getUser()) === '1';
}

function setGreetingSeen() {
  localStorage.setItem('drawdownGreeting_' + getUser(), '1');
}

function hasSeenApprentice() {
  return localStorage.getItem('drawdownApprentice_' + getUser()) === '1';
}

function setApprenticeSeen() {
  localStorage.setItem('drawdownApprentice_' + getUser(), '1');
}
