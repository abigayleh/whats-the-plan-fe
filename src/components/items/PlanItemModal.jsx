import { useState, useEffect } from 'react';
import { CheckIcon, CloseIcon } from '../layout/icons';
import { RECURRENCE_OPTIONS } from '../../constants/recurrence';
import useGroupMembers from '../../hooks/useGroupMembers';
import AttachmentUploader from '../lists/AttachmentUploader';
import {
  combineDateAndTime, getTaskDay, isTaskTimed, toDateInputValue, toTimeInputValue,
} from '../../utils/tasks';

// Create/edit a PlanItem: a to-do (scoped by its list) or a bare calendar event (scoped by
// a group picked directly). Which one this is is decided by whether a list is selected —
// `defaultOrigin: 'event'` seeds a new item with no list, so it starts as an event.
// Scope (list, or group for a bare event) is immutable on edit, same as before the merge.
function PlanItemModal({
  lists, groups, personalSpace, defaultListId, defaultOrigin = 'task', defaultSchedule,
  item, onClose, onSave, onDelete, onPushToTomorrow,
}) {
  const isEdit = Boolean(item);
  const writableLists = lists.filter((l) => !l.isSystem);
  // A recurring item's `item` may be a raw list-task (recurrenceRule) or a calendar occurrence
  // (rule/isRecurring, recurrenceRule nulled — see api/adapters.js) — check all three shapes.
  const isRecurringItem = Boolean(item?.recurrenceRule || item?.rule || item?.isRecurring);
  const [pushingTomorrow, setPushingTomorrow] = useState(false);

  const [listId, setListId] = useState(() => {
    if (isEdit) return item.origin === 'event' ? '' : (item.listId ?? '');
    return defaultOrigin === 'event' ? '' : (defaultListId ?? writableLists[0]?.id ?? '');
  });

  // A bare calendar item has no list — everything to-do-only (status, subtasks, attachments,
  // assignee) is hidden for it, and scope comes from the group select instead.
  const isCalendarItem = isEdit ? item.origin === 'event' : !listId;
  const list = writableLists.find((l) => l.id === listId);
  const members = useGroupMembers(list?.groupId);

  // Lists may still be loading when the modal opens, so adopt the first one once it arrives —
  // but never override an explicit "no list" (bare calendar) choice.
  const firstListId = writableLists[0]?.id;
  useEffect(() => {
    if (!isEdit && defaultOrigin !== 'event' && !listId && firstListId) setListId(firstListId);
  }, [isEdit, defaultOrigin, listId, firstListId]);

  const seed = item ?? defaultSchedule ?? null;

  const [title, setTitle] = useState(item?.title ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [done, setDone] = useState(item?.status === 'done');
  const [groupId, setGroupId] = useState(item?.groupId ?? '');
  const [date, setDate] = useState(toDateInputValue(seed ? getTaskDay(seed) : null));
  const [recurrence, setRecurrence] = useState((item?.recurrenceRule ?? item?.rule)?.frequency ?? '');
  const [timed, setTimed] = useState(seed ? isTaskTimed(seed) : false);
  const [startTime, setStartTime] = useState(seed?.scheduledStart ? toTimeInputValue(seed.scheduledStart) : '09:00');
  const [endTime, setEndTime] = useState(seed?.scheduledEnd ? toTimeInputValue(seed.scheduledEnd) : '10:00');
  const [assignedToId, setAssignedToId] = useState(item?.assignedToId ?? '');
  const [subtasks, setSubtasks] = useState(item?.subtasks ?? []);
  const [newSubtask, setNewSubtask] = useState('');
  const [attachments, setAttachments] = useState(item?.attachments ?? []);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // A calendar item always occupies a time slot — there's no "add a specific time" toggle for it.
  const effectiveTimed = isCalendarItem || timed;

  // The assignee must belong to the new list's group, so a move that orphans them clears it.
  function handleListChange(newListId) {
    setListId(newListId);
    const newGroupId = newListId ? (writableLists.find((l) => l.id === newListId)?.groupId ?? null) : null;
    if (newGroupId !== (list?.groupId ?? null)) setAssignedToId('');
  }

  function handleAddSubtask() {
    const value = newSubtask.trim();
    if (!value) return;
    setSubtasks((prev) => [...prev, { id: crypto.randomUUID(), title: value, done: false }]);
    setNewSubtask('');
  }

  function toggleSubtask(subtaskId) {
    setSubtasks((prev) => prev.map((s) => (s.id === subtaskId ? { ...s, done: !s.done } : s)));
  }

  function removeSubtask(subtaskId) {
    setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
  }

  async function submit(payload) {
    setError(null);
    setSaving(true);
    try {
      await onSave(payload);
    } catch (err) {
      setError(err.message || `Could not save ${isCalendarItem ? 'event' : 'task'}`);
      setSaving(false);
    }
  }

  async function handlePushToTomorrow() {
    setError(null);
    setPushingTomorrow(true);
    try {
      await onPushToTomorrow(item);
    } catch (err) {
      setError(err.message || 'Could not push to tomorrow');
      setPushingTomorrow(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;

    if (isCalendarItem) {
      if (!date) return;
      const startAt = combineDateAndTime(date, startTime);
      const endAt = combineDateAndTime(date, endTime);
      if (endAt < startAt) {
        setError('End time must be after start time');
        return;
      }
      const payload = {
        origin: 'event',
        title: title.trim(),
        description: description.trim(),
        scheduledStart: startAt,
        scheduledEnd: endAt,
        recurrenceRule: recurrence ? { frequency: recurrence, interval: 1 } : null,
      };
      if (!isEdit) payload.groupId = groupId || null; // scope immutable on edit
      submit(payload);
      return;
    }

    if (!listId) return;
    if (timed && !date) {
      setError('Pick a date before setting a time');
      return;
    }

    const payload = {
      origin: 'task',
      listId,
      title: title.trim(),
      description: description.trim(),
      // The checkbox only models done/not-done, so an in-progress task keeps that status.
      status: done ? 'done' : (item?.status === 'in-progress' ? 'in-progress' : 'todo'),
      assignedToId: assignedToId || null,
      subtasks,
      attachments,
      recurrenceRule: date && recurrence ? { frequency: recurrence, interval: 1 } : null,
    };

    if (timed && date) {
      payload.scheduledStart = combineDateAndTime(date, startTime);
      payload.scheduledEnd = combineDateAndTime(date, endTime);
      payload.dueDate = null;
      if (payload.scheduledEnd < payload.scheduledStart) {
        setError('End time must be after start time');
        return;
      }
    } else {
      payload.scheduledStart = null;
      payload.scheduledEnd = null;
      payload.dueDate = date ? combineDateAndTime(date, '00:00') : null;
    }

    submit(payload);
  }

  const modalTitle = isCalendarItem
    ? (isEdit ? 'Edit Event' : 'New Event')
    : (isEdit ? 'Edit Task' : 'New Task');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{modalTitle}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit}>
          {error && <p className="auth-card__error">{error}</p>}

          {(!isEdit || !isCalendarItem) && (
            <label className="modal__field">
              <span className="modal__label">List</span>
              <select
                className="modal__input"
                value={listId}
                onChange={(e) => handleListChange(e.target.value)}
                required={!isCalendarItem}
              >
                {!isEdit && !defaultListId && <option value="">No list (calendar event)</option>}
                {writableLists.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </label>
          )}

          {isCalendarItem && (
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
          )}

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

          {!isCalendarItem && (
            <>
              <label className="modal__toggle">
                <input
                  type="checkbox"
                  checked={done}
                  onChange={(e) => setDone(e.target.checked)}
                />
                <span>Mark as complete</span>
              </label>

              <div className="modal__field">
                <span className="modal__label">Sub-to-dos</span>
                <div className="subtask-editor">
                  {subtasks.map((subtask) => (
                    <div key={subtask.id} className="subtask-editor__item">
                      <button
                        type="button"
                        className={`subtask-editor__item-checkbox${subtask.done ? ' subtask-editor__item-checkbox--done' : ''}`}
                        onClick={() => toggleSubtask(subtask.id)}
                        aria-label={subtask.done ? 'Mark as not done' : 'Mark as done'}
                        aria-pressed={subtask.done}
                      >
                        {subtask.done && <CheckIcon />}
                      </button>
                      <span className={`subtask-editor__item-title${subtask.done ? ' subtask-editor__item-title--done' : ''}`}>
                        {subtask.title}
                      </span>
                      <button
                        type="button"
                        className="subtask-editor__remove-button"
                        onClick={() => removeSubtask(subtask.id)}
                        aria-label="Remove sub-to-do"
                      >
                        <CloseIcon width={12} height={12} />
                      </button>
                    </div>
                  ))}
                  <div className="subtask-editor__add-row">
                    <input
                      type="text"
                      className="modal__input"
                      placeholder="Add a sub-to-do"
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubtask();
                        }
                      }}
                    />
                    <button type="button" className="button button--ghost" onClick={handleAddSubtask}>
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal__field">
                <span className="modal__label">Attachments</span>
                <AttachmentUploader attachments={attachments} onChange={setAttachments} />
                {!isEdit && attachments.length > 0 && (
                  <p className="modal__hint">Files upload once the task is created.</p>
                )}
              </div>
            </>
          )}

          <label className="modal__field">
            <span className="modal__label">{isCalendarItem ? 'Date' : 'Complete by'}</span>
            <input
              type="date"
              className="modal__input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required={isCalendarItem}
            />
          </label>

          {date && (
            <label className="modal__field">
              <span className="modal__label">Repeat</span>
              <select
                className="modal__input"
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
              >
                {RECURRENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          )}

          {!isCalendarItem && (
            <label className="modal__toggle">
              <input
                type="checkbox"
                checked={timed}
                onChange={(e) => setTimed(e.target.checked)}
              />
              <span>Add a specific time</span>
            </label>
          )}

          {effectiveTimed && (
            <div className="modal__time-row">
              <label className="modal__field">
                <span className="modal__label">Start</span>
                <input
                  type="time"
                  className="modal__input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required={effectiveTimed}
                />
              </label>
              <label className="modal__field">
                <span className="modal__label">End</span>
                <input
                  type="time"
                  className="modal__input"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required={effectiveTimed}
                />
              </label>
            </div>
          )}

          {!isCalendarItem && list?.groupId && (
            <label className="modal__field">
              <span className="modal__label">Assigned to</span>
              <select
                className="modal__input"
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>{member.name || member.email}</option>
                ))}
              </select>
            </label>
          )}

          {isCalendarItem && isEdit && item.isRecurring && (
            <p className="modal__hint">Editing applies to the whole series.</p>
          )}

          <div className="modal__footer">
            {isEdit && (
              <button
                type="button"
                className="button button--danger"
                onClick={async () => {
                  try {
                    await onDelete(item);
                  } catch (err) {
                    setError(err.message || `Could not delete ${isCalendarItem ? 'event' : 'task'}`);
                  }
                }}
              >
                Delete
              </button>
            )}
            {isEdit && onPushToTomorrow && (
              <button
                type="button"
                className="button button--ghost"
                onClick={handlePushToTomorrow}
                disabled={isRecurringItem || pushingTomorrow}
                title={isRecurringItem ? "Recurring items can't be pushed individually" : 'Move to tomorrow'}
              >
                Push to tomorrow
              </button>
            )}
            <div className="modal__footer-spacer" />
            <button type="button" className="button button--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button button--primary" disabled={saving || (!isCalendarItem && !listId)}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PlanItemModal;
