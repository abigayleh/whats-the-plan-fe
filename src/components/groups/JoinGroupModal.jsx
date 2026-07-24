import { useState } from 'react';
import Modal from '../common/Modal';

function JoinGroupModal({ onClose, onJoin }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setError(null);
    setBusy(true);
    try {
      await onJoin(code.trim());
      onClose();
    } catch (err) {
      setError(err.message || 'Could not join group');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Join a Group" onClose={onClose}>
      <form className="modal__form" onSubmit={handleSubmit}>
          {error && <p className="auth-card__error">{error}</p>}
          <label className="modal__field">
            <span className="modal__label">Invite code</span>
            <input
              type="text"
              className="modal__input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
              required
            />
          </label>

          <div className="modal__footer">
            <div className="modal__footer-spacer" />
            <button type="button" className="button button--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button button--primary" disabled={busy}>
              {busy ? 'Joining…' : 'Join'}
            </button>
          </div>
        </form>
    </Modal>
  );
}

export default JoinGroupModal;
