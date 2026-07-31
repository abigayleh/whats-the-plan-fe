import { useState } from 'react';
import Modal from '../common/Modal';

function DeleteAccountModal({ email, onCancel, onConfirm }) {
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const canDelete = confirmText.trim() === email;

  async function handleConfirm() {
    if (!canDelete) return;
    setError(null);
    setBusy(true);
    try {
      await onConfirm();
    } catch (err) {
      setError(err.code === 'LAST_ADMIN'
        ? 'You must transfer or resolve admin ownership in your groups before deleting your account.'
        : (err.message || 'Could not delete account'));
      setBusy(false);
    }
  }

  return (
    <Modal title="Delete account?" onClose={onCancel} showClose={false} closeDisabled={busy} variant="full">
      <p className="group-settings__warning-text">
        This permanently deletes your account and all personal data. This cannot be undone.
        Type <strong>{email}</strong> to confirm.
      </p>
      {error && <p className="auth-card__error">{error}</p>}
      <label className="modal__field">
        <span className="modal__label">Email</span>
        <input
          className="modal__input"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          autoComplete="off"
          autoFocus
        />
      </label>
      <div className="modal__footer">
        <div className="modal__footer-spacer" />
        <button type="button" className="button button--ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button
          type="button"
          className="button button--danger"
          disabled={!canDelete || busy}
          onClick={handleConfirm}
        >
          {busy ? 'Deleting…' : 'Delete Account'}
        </button>
      </div>
    </Modal>
  );
}

export default DeleteAccountModal;
