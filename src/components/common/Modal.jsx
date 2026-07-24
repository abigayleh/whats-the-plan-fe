import { useEffect, useId, useRef } from 'react';
import { CloseIcon } from '../layout/icons';

// Shared dialog shell: overlay with click-outside/Escape to close, focus restore on unmount,
// and the standard header + a11y roles. Callers supply the body (form, fields, footer) as
// children. `closeDisabled` blocks close during async work — overlay click and Escape both
// no-op — and `showClose` hides the header X for confirm-style dialogs.
function Modal({
  title, onClose, children, showClose = true, closeDisabled = false,
}) {
  const titleId = useId();
  const previouslyFocused = useRef(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement;
    return () => previouslyFocused.current?.focus?.();
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === 'Escape' && !closeDisabled) onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, closeDisabled]);

  return (
    <div className="modal-overlay" onClick={closeDisabled ? undefined : onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 className="modal__title" id={titleId}>{title}</h2>
          {showClose && (
            <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
              <CloseIcon />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

export default Modal;
