function getUser() {
  return localStorage.getItem('drawdownUser');
}

function promptForUser(callback) {
  const promptEl = document.getElementById('usernamePrompt');
  const inputEl = document.getElementById('usernameInput');
  const submitBtn = document.getElementById('usernameSubmit');

  function submit() {
    let value = inputEl.value.trim();
    if (!value) value = 'default';
    localStorage.setItem('drawdownUser', value);
    promptEl.classList.add('hidden');
    submitBtn.removeEventListener('click', submit);
    inputEl.removeEventListener('keypress', keyHandler);
    callback(value);
  }

  function keyHandler(e) {
    if (e.key === 'Enter') {
      submit();
    }
  }

  submitBtn.addEventListener('click', submit);
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
