import { useState } from 'react';
import { CheckIcon, CloseIcon } from '../layout/icons';
import { RECURRENCE_OPTIONS } from '../../constants/recurrence';
import useAppData from '../../hooks/useAppData';
import AttachmentUploader from './AttachmentUploader';
import {
  combineDateAndTime, getTaskDay, isTaskTimed, toDateInputValue, toTimeInputValue,
} from '../../utils/tasks';

function TaskModal({
  lists, defaultListId, defaultSchedule, task, onClose, onSave, onDelete,
}) {
  const { groups, personalSpace } = useAppData();
  const isEdit = Boolean(task);
  // When creating from a calendar slot click/drop, defaultSchedule seeds the date/time
  // fields the same way an existing task would — it just isn't a real task yet.
  const seed = task ?? defaultSchedule ?? null;
  const writableLists = lists.filter((l) => !l.isSystem);
  const initialListId = task?.listId ?? defaultListId ?? '';
  const initialList = writableLists.find((l) => l.id === initialListId);

  const [listId, setListId] = useState(initialListId);
  const [groupId, setGroupId] = useState(task?.groupId ?? initialList?.groupId ?? '');
  const list = writableLists.find((l) => l.id === listId);
  const effectiveGroupId = list ? (list.groupId ?? '') : groupId;
  const effectiveGroup = effectiveGroupId ? groups.find((g) => g.id === effectiveGroupId) : null;
  const groupMembers = effectiveGroup ? effectiveGroup.members.map((member) => member.name) : [];

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [done, setDone] = useState(task?.status === 'done');
  const [dueDate, setDueDate] = useState(toDateInputValue(seed ? getTaskDay(seed) : null));
  const [recurrence, setRecurrence] = useState(task?.recurrenceRule?.frequency ?? '');
  const [timed, setTimed] = useState(seed ? isTaskTimed(seed) : false);
  const [startTime, setStartTime] = useState(seed?.scheduledStart ? toTimeInputValue(seed.scheduledStart) : '09:00');
  const [endTime, setEndTime] = useState(seed?.scheduledEnd ? toTimeInputValue(seed.scheduledEnd) : '10:00');
  const [assignedTo, setAssignedTo] = useState(task?.assignedTo ?? '');
  const [subtasks, setSubtasks] = useState(task?.subtasks ?? []);
  const [newSubtask, setNewSubtask] = useState('');
  const [attachments, setAttachments] = useState(task?.attachments ?? []);

  function handleListChange(newListId) {
    setListId(newListId);
    const newList = writableLists.find((l) => l.id === newListId);
    if (newList) setGroupId(newList.groupId ?? '');
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

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      listId: listId || null,
      groupId: effectiveGroupId || null,
      title: title.trim(),
      description: description.trim(),
      status: done ? 'done' : 'todo',
      assignedTo: assignedTo || null,
      subtasks,
      attachments,
      recurrenceRule: dueDate && recurrence ? { frequency: recurrence, interval: 1 } : null,
    };

    if (timed && dueDate) {
      payload.scheduledStart = combineDateAndTime(dueDate, startTime);
      payload.scheduledEnd = combineDateAndTime(dueDate, endTime);
      payload.dueDate = null;
    } else {
      payload.scheduledStart = null;
      payload.scheduledEnd = null;
      payload.dueDate = dueDate ? combineDateAndTime(dueDate, '00:00') : null;
    }

    onSave(payload);
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
          <label className="modal__field">
            <span className="modal__label">List</span>
            <select
              className="modal__input"
              value={listId}
              onChange={(e) => handleListChange(e.target.value)}
            >
              <option value="">No list</option>
              {writableLists.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </label>

          {!list && (
            <label className="modal__field">
              <span className="modal__label">Group</span>
              <select
                className="modal__input"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
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
            <AttachmentUploader attachments={attachments} onChange={setAttachments} max={5} />
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

          {effectiveGroup && (
            <label className="modal__field">
              <span className="modal__label">Assigned to</span>
              <select
                className="modal__input"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                <option value="">Unassigned</option>
                {groupMembers.map((member) => (
                  <option key={member} value={member}>{member}</option>
                ))}
              </select>
            </label>
          )}

          <div className="modal__footer">
            {isEdit && (
              <button
                type="button"
                className="button button--danger"
                onClick={() => onDelete(task.id)}
              >
                Delete
              </button>
            )}
            <div className="modal__footer-spacer" />
            <button type="button" className="button button--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button button--primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskModal;
