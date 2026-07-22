import { useState } from 'react';
import { CloseIcon } from '../layout/icons';

// Create a folder, or rename an existing one. Folders only carry a name.
function FolderModal({ folder, onClose, onSave }) {
  const isEdit = Boolean(folder);
  const [name, setName] = useState(folder?.name ?? '');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setSaving(true);
    try {
      await onSave(name.trim());
    } catch (err) {
      setError(err.message || `Could not ${isEdit ? 'rename' : 'create'} folder`);
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{isEdit ? 'Rename Folder' : 'New Folder'}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit}>
          {error && <p className="auth-card__error">{error}</p>}

          <label className="modal__field">
            <span className="modal__label">Name</span>
            <input
              type="text"
              className="modal__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </label>

          <div className="modal__footer">
            <div className="modal__footer-spacer" />
            <button type="button" className="button button--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button button--primary" disabled={saving}>
              {saving ? 'Saving…' : (isEdit ? 'Save' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FolderModal;
