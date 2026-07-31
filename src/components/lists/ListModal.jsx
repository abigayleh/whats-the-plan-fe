import { useState } from 'react';
import { CloseIcon } from '../layout/icons';
import Modal from '../common/Modal';
import IconOptions from '../common/IconOptions';
import PillPicker from '../common/PillPicker';
import { scopeOptions } from '../../utils/scope';
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
  const [hideUnscheduled, setHideUnscheduled] = useState(
    !(list?.showUnscheduledOnCalendar ?? true),
  );
  const [isDefault, setIsDefault] = useState(list?.isDefault ?? false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setSaving(true);
    try {
      await onSave({
        name: name.trim(), groupId, icon, color, showUnscheduledOnCalendar: !hideUnscheduled, isDefault,
      });
    } catch (err) {
      setError(err.message || `Could not ${isEdit ? 'save' : 'create'} list`);
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? 'Edit List' : 'New List'} onClose={onClose} variant="full">
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
            <PillPicker
              options={scopeOptions(personalSpace, groups)}
              value={groupId}
              onChange={setGroupId}
              disabled={isEdit}
              ariaLabel="Scope"
            />
            {isEdit && <p className="modal__hint">A list stays in the space it was created in.</p>}
          </div>

          <div className="modal__field">
            <span className="modal__label">Icon</span>
            <IconOptions icon={icon} onSelect={setIcon} />
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
              checked={hideUnscheduled}
              onChange={(e) => setHideUnscheduled(e.target.checked)}
            />
            <span>Hide unscheduled to-dos</span>
          </label>

          <label className="modal__toggle">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
            <span>Default list for new to-dos</span>
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
    </Modal>
  );
}

export default ListModal;
