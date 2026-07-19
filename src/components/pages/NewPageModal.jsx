import { useState } from 'react';
import { CloseIcon } from '../layout/icons';

// Create a top-level page. Scope is chosen here and is fixed once the page exists.
function NewPageModal({
  groups, personalSpace, onClose, onCreate,
}) {
  const [title, setTitle] = useState('');
  const [groupId, setGroupId] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onCreate({ title: title.trim() || 'Untitled', groupId });
    } catch (err) {
      setError(err.message || 'Could not create page');
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">New Page</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit}>
          {error && <p className="auth-card__error">{error}</p>}

          <label className="modal__field">
            <span className="modal__label">Title</span>
            <input
              type="text"
              className="modal__input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
              autoFocus
            />
          </label>

          <div className="modal__field">
            <span className="modal__label">Scope</span>
            <div className="scope-picker">
              <button
                type="button"
                className={`scope-picker__option${groupId === null ? ' scope-picker__option--active' : ''}`}
                onClick={() => setGroupId(null)}
              >
                {personalSpace.name}
              </button>
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  className={`scope-picker__option${groupId === group.id ? ' scope-picker__option--active' : ''}`}
                  onClick={() => setGroupId(group.id)}
                >
                  {group.name}
                </button>
              ))}
            </div>
          </div>

          <div className="modal__footer">
            <div className="modal__footer-spacer" />
            <button type="button" className="button button--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="button button--primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewPageModal;
