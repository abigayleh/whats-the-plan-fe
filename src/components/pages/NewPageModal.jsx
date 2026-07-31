import { useState } from 'react';
import Modal from '../common/Modal';
import IconOptions from '../common/IconOptions';
import PillPicker from '../common/PillPicker';
import { scopeOptions } from '../../utils/scope';

// Create a top-level page. Scope is chosen here and is fixed once the page exists.
function NewPageModal({
  groups, personalSpace, onClose, onCreate,
}) {
  const [title, setTitle] = useState('');
  const [groupId, setGroupId] = useState(null);
  const [icon, setIcon] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onCreate({ title: title.trim() || 'Untitled', groupId, icon });
    } catch (err) {
      setError(err.message || 'Could not create page');
      setSaving(false);
    }
  }

  return (
    <Modal title="New Page" onClose={onClose} variant="full">
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
          <PillPicker
            options={scopeOptions(personalSpace, groups)}
            value={groupId}
            onChange={setGroupId}
            ariaLabel="Scope"
          />
        </div>

        <div className="modal__field">
          <span className="modal__label">Icon</span>
          <IconOptions icon={icon} onSelect={setIcon} />
        </div>

        <div className="modal__footer">
          <div className="modal__footer-spacer" />
          <button type="button" className="button button--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="button button--primary" disabled={saving}>
            {saving ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default NewPageModal;
