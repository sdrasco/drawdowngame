function getUser() {
  let user = localStorage.getItem('drawdownUser');
  if (!user) {
    user = prompt('Enter a username');
    if (user) {
      localStorage.setItem('drawdownUser', user);
    } else {
      user = 'default';
    }
  }
  return user;
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
