import { useState } from 'react';
import { CloseIcon } from '../layout/icons';
import Modal from '../common/Modal';
import { TASK_ICONS } from '../../constants/taskIcons';

const todayInput = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Create an itinerary. Scope (personal or a group) is chosen here and is fixed once it exists.
function NewItineraryModal({
  groups, personalSpace, onClose, onCreate,
}) {
  const [title, setTitle] = useState('');
  const [groupId, setGroupId] = useState(null);
  const [icon, setIcon] = useState(null);
  const [startDate, setStartDate] = useState(todayInput());
  const [endDate, setEndDate] = useState(todayInput());
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (endDate < startDate) {
      setError('End date must be on or after the start date');
      return;
    }
    setSaving(true);
    try {
      await onCreate({
        title: title.trim() || 'Untitled trip', groupId, icon, startDate, endDate,
      });
    } catch (err) {
      setError(err.message || 'Could not create itinerary');
      setSaving(false);
    }
  }

  return (
    <Modal title="New Itinerary" onClose={onClose}>
      <form className="modal__form" onSubmit={handleSubmit}>
          {error && <p className="auth-card__error">{error}</p>}

          <label className="modal__field">
            <span className="modal__label">Title</span>
            <input
              type="text"
              className="modal__input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Barcelona Trip"
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

          <div className="modal__field">
            <span className="modal__label">Icon</span>
            <div className="icon-picker">
              <button
                type="button"
                className={`icon-picker__option${icon === null ? ' icon-picker__option--active' : ''}`}
                onClick={() => setIcon(null)}
                aria-label="No icon"
                aria-pressed={icon === null}
              >
                <CloseIcon width={14} height={14} />
              </button>
              {TASK_ICONS.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  className={`icon-picker__option${icon === key ? ' icon-picker__option--active' : ''}`}
                  onClick={() => setIcon(key)}
                  aria-label={label}
                  aria-pressed={icon === key}
                >
                  <Icon />
                </button>
              ))}
            </div>
          </div>

          <div className="modal__field modal__field--row">
            <label className="modal__field">
              <span className="modal__label">Start date</span>
              <input
                type="date"
                className="modal__input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label className="modal__field">
              <span className="modal__label">End date</span>
              <input
                type="date"
                className="modal__input"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>
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

export default NewItineraryModal;
