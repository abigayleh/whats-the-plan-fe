import { useState } from 'react';
import { CloseIcon, PlusIcon } from '../layout/icons';

function PollCreateModal({ groups, onClose, onSave }) {
  const [question, setQuestion] = useState('');
  const [groupId, setGroupId] = useState(groups[0]?.id ?? '');
  const [expiresAt, setExpiresAt] = useState('');
  const [options, setOptions] = useState(['', '']);

  function updateOption(index, value) {
    setOptions((prev) => prev.map((option, i) => (i === index ? value : option)));
  }

  function addOption() {
    setOptions((prev) => [...prev, '']);
  }

  function removeOption(index) {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const optionTexts = options.map((option) => option.trim()).filter(Boolean);
    if (!question.trim() || !groupId || optionTexts.length < 2) return;

    onSave({
      question: question.trim(),
      groupId,
      expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59`) : null,
      optionTexts,
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">New Poll</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit}>
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
              <button type="button" className="button button--ghost" onClick={addOption}>
                <PlusIcon width={14} height={14} />
                Add option
              </button>
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
            <button type="submit" className="button button--primary">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PollCreateModal;
