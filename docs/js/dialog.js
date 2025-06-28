export function showMessage(message, buttonText = 'OK') {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'username-prompt';

    const form = document.createElement('form');
    const p = document.createElement('p');
    p.textContent = message;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = buttonText;

    function close() {
      btn.removeEventListener('click', close);
      document.removeEventListener('keydown', keyHandler);
      overlay.remove();
      resolve();
    }

    function keyHandler(e) {
      if (e.key === 'Enter' || e.key === 'Escape') {
        close();
      }
    }

    btn.addEventListener('click', close);
    document.addEventListener('keydown', keyHandler);

    form.appendChild(p);
    form.appendChild(btn);
    overlay.appendChild(form);
    document.body.appendChild(overlay);
    btn.focus();
  });
}

if (typeof window !== 'undefined') {
  window.showMessage = showMessage;
}
