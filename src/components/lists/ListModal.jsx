import { useState } from 'react';
import { CloseIcon } from '../layout/icons';
import { TASK_ICONS } from '../../constants/taskIcons';
import useAppData from '../../hooks/useAppData';

function ListModal({ groups, onClose, onSave }) {
  const { personalSpace } = useAppData();
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState(null);
  const [icon, setIcon] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), groupId, icon });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">New List</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit}>
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

          <div className="modal__footer">
            <div className="modal__footer-spacer" />
            <button type="button" className="button button--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button button--primary">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ListModal;
