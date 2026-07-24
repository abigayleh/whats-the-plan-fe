// Shared inline URL input, reused by the /image slash command and the Cmd+K link shortcut.
// Mounts a tiny field near the current selection; onSubmit fires on Enter (value may be empty),
// while Escape or an outside click just closes without submitting.
export function promptUrl({ editor, initial = '', onSubmit }) {
  const wrap = document.createElement('div');
  wrap.className = 'suggestion-popup';
  const input = document.createElement('input');
  input.className = 'page-doc__url-input';
  input.type = 'text';
  input.value = initial;
  input.placeholder = 'Paste a link…';
  wrap.appendChild(input);
  document.body.appendChild(wrap);

  const rect = editor.view.coordsAtPos(editor.state.selection.from);
  wrap.style.left = `${rect.left}px`;
  wrap.style.top = `${rect.bottom + 4}px`;

  let done = false;
  const close = () => {
    if (done) return;
    done = true;
    document.removeEventListener('mousedown', onOutside, true);
    wrap.remove();
  };
  function onOutside(e) { if (!wrap.contains(e.target)) close(); }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); const v = input.value.trim(); close(); onSubmit(v); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
  });
  document.addEventListener('mousedown', onOutside, true);
  requestAnimationFrame(() => input.focus());
}

// Prepend https:// to a bare URL that carries no scheme of its own.
export function normalizeUrl(url) {
  return /^[a-z][\w+.-]*:/i.test(url) ? url : `https://${url}`;
}
