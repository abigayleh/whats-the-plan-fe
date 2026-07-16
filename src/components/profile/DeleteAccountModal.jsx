import { useEffect, useRef, useState } from 'react';

function DeleteAccountModal({ email, onCancel, onConfirm }) {
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement;
    inputRef.current?.focus();
    return () => previouslyFocused.current?.focus?.();
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  const canDelete = confirmText === email;

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
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 className="modal__title" id="delete-account-title">Delete account?</h2>
        </div>
        <p className="group-settings__warning-text">
          This permanently deletes your account and all personal data. This cannot be undone.
          Type <strong>{email}</strong> to confirm.
        </p>
        {error && <p className="auth-card__error">{error}</p>}
        <label className="modal__field">
          <span className="modal__label">Email</span>
          <input
            ref={inputRef}
            className="modal__input"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
          />
        </label>
        <div className="modal__footer">
          <div className="modal__footer-spacer" />
          <button type="button" className="button button--ghost" onClick={onCancel}>
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
      </div>
    </div>
  );
}

export default DeleteAccountModal;
