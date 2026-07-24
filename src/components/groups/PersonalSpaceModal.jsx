import { useState } from 'react';
import Modal from '../common/Modal';
import { ACCENT_KEYS } from '../../constants/colors';

function PersonalSpaceModal({ personalSpace, onClose, onSave }) {
  const [name, setName] = useState(personalSpace.name);
  const [colorKey, setColorKey] = useState(personalSpace.colorKey);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), colorKey });
    onClose();
  }

  return (
    <Modal title="Personal Space" onClose={onClose}>
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
            <span className="modal__label">Color</span>
            <div className="color-picker">
              {ACCENT_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`color-picker__swatch color-picker__swatch--${key}${colorKey === key ? ' color-picker__swatch--active' : ''}`}
                  onClick={() => setColorKey(key)}
                  aria-label={key}
                  aria-pressed={colorKey === key}
                />
              ))}
            </div>
          </div>

          <div className="modal__footer">
            <div className="modal__footer-spacer" />
            <button type="button" className="button button--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button button--primary">
              Save
            </button>
          </div>
        </form>
    </Modal>
  );
}

export default PersonalSpaceModal;
