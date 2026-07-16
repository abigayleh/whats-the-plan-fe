import { useState } from 'react';
import { CloseIcon } from '../layout/icons';
import { TASK_ICONS } from '../../constants/taskIcons';
import { ACCENT_KEYS } from '../../constants/colors';
import useAppData from '../../hooks/useAppData';

// Create a list, or edit an existing one. Scope is fixed once a list exists.
function ListModal({ list, groups, onClose, onSave }) {
  const { personalSpace } = useAppData();
  const isEdit = Boolean(list);
  const [name, setName] = useState(list?.name ?? '');
  const [groupId, setGroupId] = useState(list?.groupId ?? null);
  const [icon, setIcon] = useState(list?.icon ?? null);
  const [color, setColor] = useState(list?.color ?? null);
  const [showUnscheduledOnCalendar, setShowUnscheduledOnCalendar] = useState(
    list?.showUnscheduledOnCalendar ?? true,
  );
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setSaving(true);
    try {
      await onSave({
        name: name.trim(), groupId, icon, color, showUnscheduledOnCalendar,
      });
    } catch (err) {
      setError(err.message || `Could not ${isEdit ? 'save' : 'create'} list`);
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{isEdit ? 'Edit List' : 'New List'}</h2>
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

          <div className="modal__field">
            <span className="modal__label">Scope</span>
            <div className="scope-picker">
              <button
                type="button"
                className={`scope-picker__option${groupId === null ? ' scope-picker__option--active' : ''}`}
                onClick={() => setGroupId(null)}
                disabled={isEdit}
              >
                {personalSpace.name}
              </button>
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  className={`scope-picker__option${groupId === group.id ? ' scope-picker__option--active' : ''}`}
                  onClick={() => setGroupId(group.id)}
                  disabled={isEdit}
                >
                  {group.name}
                </button>
              ))}
            </div>
            {isEdit && <p className="modal__hint">A list stays in the space it was created in.</p>}
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

          <div className="modal__field">
            <span className="modal__label">Color</span>
            <div className="color-picker">
              <button
                type="button"
                className={`color-picker__swatch color-picker__swatch--none${color === null ? ' color-picker__swatch--active' : ''}`}
                onClick={() => setColor(null)}
                aria-label="No color"
                aria-pressed={color === null}
              >
                <CloseIcon width={14} height={14} />
              </button>
              {ACCENT_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`color-picker__swatch color-picker__swatch--${key}${color === key ? ' color-picker__swatch--active' : ''}`}
                  onClick={() => setColor(key)}
                  aria-label={key}
                  aria-pressed={color === key}
                />
              ))}
            </div>
          </div>

          <label className="modal__toggle">
            <input
              type="checkbox"
              checked={showUnscheduledOnCalendar}
              onChange={(e) => setShowUnscheduledOnCalendar(e.target.checked)}
            />
            <span>Show unscheduled items in calendar</span>
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

export default ListModal;
