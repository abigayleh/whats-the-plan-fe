import { useState } from 'react';
import { CloseIcon, PlusIcon } from '../layout/icons';
import Modal from '../common/Modal';

const MAX_OPTIONS = 20; // mirrors the API

function PollCreateModal({ groups, onClose, onSave }) {
  const [question, setQuestion] = useState('');
  const [groupId, setGroupId] = useState(groups[0]?.id ?? '');
  const [expiresAt, setExpiresAt] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  function updateOption(index, value) {
    setOptions((prev) => prev.map((option, i) => (i === index ? value : option)));
  }

  function addOption() {
    setOptions((prev) => [...prev, '']);
  }

  function removeOption(index) {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const optionTexts = options.map((option) => option.trim()).filter(Boolean);
    if (!question.trim() || !groupId) return;
    if (optionTexts.length < 2) {
      setError('Give the poll at least 2 options');
      return;
    }
    // Polls close at end of day, so today is still a valid (future) expiry.
    const expiry = expiresAt ? new Date(`${expiresAt}T23:59:59`) : null;
    if (expiry && expiry <= new Date()) {
      setError('Expiry must be in the future');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await onSave({
        question: question.trim(), groupId, expiresAt: expiry, optionTexts,
      });
    } catch (err) {
      setError(err.message || 'Could not create poll');
      setSaving(false);
    }
  }

  return (
    <Modal title="New Poll" onClose={onClose}>
      <form className="modal__form" onSubmit={handleSubmit}>
          {error && <p className="auth-card__error">{error}</p>}

          <label className="modal__field">
            <span className="modal__label">Group</span>
            <select className="modal__input" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </label>

          <label className="modal__field">
            <span className="modal__label">Question</span>
            <input
              type="text"
              className="modal__input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              autoFocus
              required
            />
          </label>

          <div className="modal__field">
            <span className="modal__label">Options</span>
            <div className="poll-options-editor">
              {options.map((option, index) => (
                <div key={index} className="poll-options-editor__row">
                  <input
                    type="text"
                    className="modal__input"
                    value={option}
                    placeholder={`Option ${index + 1}`}
                    onChange={(e) => updateOption(index, e.target.value)}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      className="poll-options-editor__remove-button"
                      onClick={() => removeOption(index)}
                      aria-label="Remove option"
                    >
                      <CloseIcon width={12} height={12} />
                    </button>
                  )}
                </div>
              ))}
              {options.length < MAX_OPTIONS && (
                <button type="button" className="button button--ghost" onClick={addOption}>
                  <PlusIcon width={14} height={14} />
                  Add option
                </button>
              )}
            </div>
          </div>

          <label className="modal__field">
            <span className="modal__label">Expires (optional)</span>
            <input
              type="date"
              className="modal__input"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </label>

          <div className="modal__footer">
            <div className="modal__footer-spacer" />
            <button type="button" className="button button--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button button--primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
    </Modal>
  );
}

export default PollCreateModal;
