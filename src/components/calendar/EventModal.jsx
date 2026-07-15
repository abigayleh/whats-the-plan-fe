import { useState } from 'react';
import { CloseIcon } from '../layout/icons';
import { RECURRENCE_OPTIONS } from '../../constants/recurrence';
import useAppData from '../../hooks/useAppData';
import {
  combineDateAndTime, toDateInputValue, toTimeInputValue,
} from '../../utils/tasks';

// Create/edit a calendar event. Scope (group) is immutable on edit.
function EventModal({
  event, defaultStart, defaultEnd, onClose, onSubmit, onDelete,
}) {
  const { groups, personalSpace } = useAppData();
  const isEdit = Boolean(event);
  const seedStart = event?.scheduledStart ?? defaultStart ?? null;
  const seedEnd = event?.scheduledEnd ?? defaultEnd ?? null;

  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [groupId, setGroupId] = useState(event?.groupId ?? '');
  const [date, setDate] = useState(toDateInputValue(seedStart));
  const [startTime, setStartTime] = useState(seedStart ? toTimeInputValue(seedStart) : '09:00');
  const [endTime, setEndTime] = useState(seedEnd ? toTimeInputValue(seedEnd) : '10:00');
  const [recurrence, setRecurrence] = useState(event?.rule?.frequency ?? '');
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    const startAt = combineDateAndTime(date, startTime);
    const endAt = combineDateAndTime(date, endTime);
    if (endAt < startAt) {
      setError('End time must be after start time');
      return;
    }
    const payload = {
      title: title.trim(),
      description: description.trim(),
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      recurrenceRule: recurrence ? { frequency: recurrence, interval: 1 } : null,
    };
    if (!isEdit) payload.groupId = groupId || null; // scope immutable on edit
    setError(null);
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err.message || 'Could not save event');
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{isEdit ? 'Edit Event' : 'New Event'}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit}>
          {error && <p className="auth-card__error">{error}</p>}

          <label className="modal__field">
            <span className="modal__label">Title</span>
            <input
              type="text"
              className="modal__input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </label>

          <label className="modal__field">
            <span className="modal__label">Description</span>
            <textarea
              className="modal__input modal__input--textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </label>

          <label className="modal__field">
            <span className="modal__label">Calendar</span>
            <select
              className="modal__input"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              disabled={isEdit}
            >
              <option value="">{personalSpace.name}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </label>

          <label className="modal__field">
            <span className="modal__label">Date</span>
            <input
              type="date"
              className="modal__input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>

          <div className="modal__time-row">
            <label className="modal__field">
              <span className="modal__label">Start</span>
              <input type="time" className="modal__input" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            </label>
            <label className="modal__field">
              <span className="modal__label">End</span>
              <input type="time" className="modal__input" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </label>
          </div>

          <label className="modal__field">
            <span className="modal__label">Repeat</span>
            <select className="modal__input" value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
              {RECURRENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          {isEdit && event.isRecurring && (
            <p className="modal__hint">Editing applies to the whole series.</p>
          )}

          <div className="modal__footer">
            {isEdit && (
              <button type="button" className="button button--danger" onClick={() => onDelete(event.eventId)}>
                Delete
              </button>
            )}
            <div className="modal__footer-spacer" />
            <button type="button" className="button button--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button button--primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventModal;
