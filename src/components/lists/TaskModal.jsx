import { useState, useEffect } from 'react';
import { CheckIcon, CloseIcon } from '../layout/icons';
import { RECURRENCE_OPTIONS } from '../../constants/recurrence';
import useGroupMembers from '../../hooks/useGroupMembers';
import AttachmentUploader from './AttachmentUploader';
import {
  combineDateAndTime, getTaskDay, isTaskTimed, toDateInputValue, toTimeInputValue,
} from '../../utils/tasks';

function TaskModal({
  lists, defaultListId, defaultSchedule, task, onClose, onSave, onDelete,
}) {
  const isEdit = Boolean(task);
  // When creating from a calendar slot click/drop, defaultSchedule seeds the date/time
  // fields the same way an existing task would — it just isn't a real task yet.
  const seed = task ?? defaultSchedule ?? null;
  const writableLists = lists.filter((l) => !l.isSystem);

  const [listId, setListId] = useState(task?.listId ?? defaultListId ?? writableLists[0]?.id ?? '');
  const list = writableLists.find((l) => l.id === listId);
  const members = useGroupMembers(list?.groupId);

  // Lists may still be loading when the modal opens, so adopt the first one once it arrives.
  const firstListId = writableLists[0]?.id;
  useEffect(() => {
    if (!listId && firstListId) setListId(firstListId);
  }, [listId, firstListId]);

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [done, setDone] = useState(task?.status === 'done');
  const [dueDate, setDueDate] = useState(toDateInputValue(seed ? getTaskDay(seed) : null));
  const [recurrence, setRecurrence] = useState(task?.recurrenceRule?.frequency ?? '');
  const [timed, setTimed] = useState(seed ? isTaskTimed(seed) : false);
  const [startTime, setStartTime] = useState(seed?.scheduledStart ? toTimeInputValue(seed.scheduledStart) : '09:00');
  const [endTime, setEndTime] = useState(seed?.scheduledEnd ? toTimeInputValue(seed.scheduledEnd) : '10:00');
  const [assignedToId, setAssignedToId] = useState(task?.assignedToId ?? '');
  const [subtasks, setSubtasks] = useState(task?.subtasks ?? []);
  const [newSubtask, setNewSubtask] = useState('');
  const [attachments, setAttachments] = useState(task?.attachments ?? []);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // The assignee must belong to the new list's group, so a move that orphans them clears it.
  function handleListChange(newListId) {
    setListId(newListId);
    const newGroupId = writableLists.find((l) => l.id === newListId)?.groupId ?? null;
    if (newGroupId !== list?.groupId) setAssignedToId('');
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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !listId) return;
    if (timed && !dueDate) {
      setError('Pick a date before setting a time');
      return;
    }

    const payload = {
      listId,
      title: title.trim(),
      description: description.trim(),
      // The checkbox only models done/not-done, so an in-progress task keeps that status.
      status: done ? 'done' : (task?.status === 'in-progress' ? 'in-progress' : 'todo'),
      assignedToId: assignedToId || null,
      subtasks,
      attachments,
      recurrenceRule: dueDate && recurrence ? { frequency: recurrence, interval: 1 } : null,
    };

    if (timed && dueDate) {
      payload.scheduledStart = combineDateAndTime(dueDate, startTime);
      payload.scheduledEnd = combineDateAndTime(dueDate, endTime);
      payload.dueDate = null;
      if (payload.scheduledEnd < payload.scheduledStart) {
        setError('End time must be after start time');
        return;
      }
    } else {
      payload.scheduledStart = null;
      payload.scheduledEnd = null;
      payload.dueDate = dueDate ? combineDateAndTime(dueDate, '00:00') : null;
    }

    setError(null);
    setSaving(true);
    try {
      await onSave(payload);
    } catch (err) {
      setError(err.message || 'Could not save task');
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit}>
          {error && <p className="auth-card__error">{error}</p>}

          <label className="modal__field">
            <span className="modal__label">List</span>
            <select
              className="modal__input"
              value={listId}
              onChange={(e) => handleListChange(e.target.value)}
              required
            >
              {writableLists.length === 0 && <option value="">Create a list first</option>}
              {writableLists.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </label>

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

          <label className="modal__field">
            <span className="modal__label">Complete by</span>
            <input
              type="date"
              className="modal__input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>

          {dueDate && (
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

          <label className="modal__toggle">
            <input
              type="checkbox"
              checked={timed}
              onChange={(e) => setTimed(e.target.checked)}
            />
            <span>Add a specific time</span>
          </label>

          {timed && (
            <div className="modal__time-row">
              <label className="modal__field">
                <span className="modal__label">Start</span>
                <input
                  type="time"
                  className="modal__input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required={timed}
                />
              </label>
              <label className="modal__field">
                <span className="modal__label">End</span>
                <input
                  type="time"
                  className="modal__input"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required={timed}
                />
              </label>
            </div>
          )}

          {list?.groupId && (
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

          <div className="modal__footer">
            {isEdit && (
              <button
                type="button"
                className="button button--danger"
                onClick={async () => {
                  try {
                    await onDelete(task.id);
                  } catch (err) {
                    setError(err.message || 'Could not delete task');
                  }
                }}
              >
                Delete
              </button>
            )}
            <div className="modal__footer-spacer" />
            <button type="button" className="button button--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button button--primary" disabled={saving || !listId}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskModal;
