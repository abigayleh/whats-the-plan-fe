import { useState } from 'react';
import Modal from './Modal';

// A yes/no dialog on top of Modal. `onConfirm` may be async: while it runs both buttons
// disable, the confirm button shows a busy label, and close is blocked until it settles.
// `message` may be a string (rendered as a paragraph) or a node.
function ConfirmModal({
  title, message, confirmLabel = 'Delete', cancelLabel = 'Cancel', danger = true,
  onConfirm, onCancel,
}) {
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
    } catch {
      setBusy(false);
    }
  }

  return (
    <Modal title={title} onClose={onCancel} showClose={false} closeDisabled={busy}>
      {typeof message === 'string'
        ? <p className="group-settings__warning-text">{message}</p>
        : message}
      <div className="modal__footer">
        <div className="modal__footer-spacer" />
        <button type="button" className="button button--ghost" onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`button ${danger ? 'button--danger' : 'button--primary'}`}
          onClick={handleConfirm}
          disabled={busy}
        >
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmModal;
