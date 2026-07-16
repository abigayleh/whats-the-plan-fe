import { useState, useEffect, useRef } from 'react';
import { CheckIcon, CloseIcon } from '../layout/icons';
import { RECURRENCE_OPTIONS, recurrenceRuleFor, recurrenceValueFor } from '../../constants/recurrence';
import useGroupMembers from '../../hooks/useGroupMembers';
import AttachmentUploader from '../lists/AttachmentUploader';
import {
  combineDateAndTime, getTaskDay, isTaskTimed, toDateInputValue, toTimeInputValue,
} from '../../utils/tasks';

// Create/edit a PlanItem: a to-do (scoped by its list) or a bare calendar event (scoped by
// a group picked directly). Which one this is is decided by whether a list is selected —
// `defaultOrigin: 'event'` seeds a new item with no list, so it starts as an event.
//
// Every field autosaves (checkboxes instantly, everything else on blur/change) via
// `commitChange` below — there's no separate Save step. A brand-new item is created the
// moment it first has a title; `hasSavedItem` flips true then, and `savedItemRef` (not state,
// so it's always current — see commitChange's race note) tracks what to route later saves to.
// `originLocked` extends "scope immutable on edit" to also cover an item just created in this
// session, so the origin (task vs. event) can't be silently flipped out from under a save.
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

  // A bare calendar item has no list — to-do-only fields (status, attachments, assignee) are
  // hidden for it, and scope comes from the group select instead. Subtasks ARE shared with
  // events (below), unlike the rest of this list.
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
  const [recurrence, setRecurrence] = useState(recurrenceValueFor(item?.recurrenceRule ?? item?.rule));
  const [timed, setTimed] = useState(seed ? isTaskTimed(seed) : false);
  const [startTime, setStartTime] = useState(seed?.scheduledStart ? toTimeInputValue(seed.scheduledStart) : '09:00');
  const [endTime, setEndTime] = useState(seed?.scheduledEnd ? toTimeInputValue(seed.scheduledEnd) : '10:00');
  const [assignedToId, setAssignedToId] = useState(item?.assignedToId ?? '');
  const [subtasks, setSubtasks] = useState(item?.subtasks ?? []);
  const [newSubtask, setNewSubtask] = useState('');
  const [attachments, setAttachments] = useState(item?.attachments ?? []);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [hasSavedItem, setHasSavedItem] = useState(isEdit);

  // `item` for an existing item, or the item this session just created — either way, the id
  // saves should target next. A ref (not state) so it's read synchronously inside commitChange,
  // even mid-flight while a previous autosave is still in the air.
  const savedItemRef = useRef(item ?? null);
  // Serializes autosaves: a change committed while an earlier one is still saving waits for it
  // first, so it reads savedItemRef *after* a create resolved — otherwise two near-simultaneous
  // edits on a brand-new item could both see "no item yet" and each create a duplicate.
  const commitQueueRef = useRef(Promise.resolve(true));

  // scope (list/group) is locked once an item exists, whether from a prior edit or a save
  // earlier in this session — same "immutable" rule as before, just no longer keyed on isEdit.
  const originLocked = isEdit || hasSavedItem;

  // A calendar item always occupies a time slot — there's no "add a specific time" toggle for it.
  const effectiveTimed = isCalendarItem || timed;

  // The assignee must belong to the new list's group, so a move that orphans them clears it.
  function handleListChange(newListId) {
    setListId(newListId);
    const newGroupId = newListId ? (writableLists.find((l) => l.id === newListId)?.groupId ?? null) : null;
    const clearAssignee = newGroupId !== (list?.groupId ?? null);
    if (clearAssignee) setAssignedToId('');
    commitChange({ listId: newListId, assignedToId: clearAssignee ? '' : assignedToId });
  }

  function handleAddSubtask() {
    const value = newSubtask.trim();
    if (!value) return;
    const nextSubtasks = [...subtasks, { id: crypto.randomUUID(), title: value, done: false }];
    setSubtasks(nextSubtasks);
    setNewSubtask('');
    commitChange({ subtasks: nextSubtasks });
  }

  function toggleSubtask(subtaskId) {
    const nextSubtasks = subtasks.map((s) => (s.id === subtaskId ? { ...s, done: !s.done } : s));
    setSubtasks(nextSubtasks);
    commitChange({ subtasks: nextSubtasks });
  }

  function removeSubtask(subtaskId) {
    const nextSubtasks = subtasks.filter((s) => s.id !== subtaskId);
    setSubtasks(nextSubtasks);
    commitChange({ subtasks: nextSubtasks });
  }

  // Builds the save payload from current state (plus any override for a value whose setState
  // hasn't flushed yet). Returns null when there's nothing worth saving yet (no title, or — for
  // a new item — no list/date chosen), or `{ error }` for an actual validation problem, or
  // `{ payload }` when it's ready to send.
  function buildPayload(overrides) {
    const state = {
      title, description, done, groupId, date, recurrence, timed, startTime, endTime,
      assignedToId, subtasks, attachments, listId, ...overrides,
    };
    const trimmedTitle = state.title.trim();
    if (!trimmedTitle) return null; // never autosave an untitled new item

    // Mirrors `isCalendarItem`, but off the (possibly overridden) list choice rather than the
    // render's `listId` — an override applied via commitChange hasn't re-rendered yet.
    const calendarItem = isEdit ? isCalendarItem : !state.listId;

    if (calendarItem) {
      if (!state.date) return null;
      const startAt = combineDateAndTime(state.date, state.startTime);
      const endAt = combineDateAndTime(state.date, state.endTime);
      if (endAt < startAt) return { error: 'End time must be after start time' };
      const payload = {
        origin: 'event',
        title: trimmedTitle,
        description: state.description.trim(),
        scheduledStart: startAt,
        scheduledEnd: endAt,
        recurrenceRule: recurrenceRuleFor(state.recurrence),
        subtasks: state.subtasks,
      };
      if (!savedItemRef.current) payload.groupId = state.groupId || null; // scope fixed at creation
      return { payload };
    }

    if (!state.listId) return null;
    if (state.timed && !state.date) return { error: 'Pick a date before setting a time' };

    const payload = {
      origin: 'task',
      listId: state.listId,
      title: trimmedTitle,
      description: state.description.trim(),
      // The checkbox only models done/not-done, so an in-progress task keeps that status.
      status: state.done ? 'done' : (item?.status === 'in-progress' ? 'in-progress' : 'todo'),
      assignedToId: state.assignedToId || null,
      subtasks: state.subtasks,
      attachments: state.attachments,
      recurrenceRule: state.date ? recurrenceRuleFor(state.recurrence) : null,
    };

    if (state.timed && state.date) {
      payload.scheduledStart = combineDateAndTime(state.date, state.startTime);
      payload.scheduledEnd = combineDateAndTime(state.date, state.endTime);
      payload.dueDate = null;
      if (payload.scheduledEnd < payload.scheduledStart) return { error: 'End time must be after start time' };
    } else {
      payload.scheduledStart = null;
      payload.scheduledEnd = null;
      payload.dueDate = state.date ? combineDateAndTime(state.date, '00:00') : null;
    }

    return { payload };
  }

  async function runSave(payload) {
    setError(null);
    setSaving(true);
    try {
      const response = await onSave(payload, savedItemRef.current);
      if (response?.item) {
        savedItemRef.current = response.item;
        setHasSavedItem(true);
      }
      if (response?.attachmentError) setError(`Saved, but files didn't upload: ${response.attachmentError}`);
      return true;
    } catch (err) {
      setError(err.message || `Could not save ${isCalendarItem ? 'event' : 'task'}`);
      return false;
    } finally {
      setSaving(false);
    }
  }

  // Queues an autosave; returns a promise resolving to whether the *last* queued save
  // succeeded, so callers (e.g. Done) can decide whether it's safe to close.
  function commitChange(overrides = {}) {
    const result = buildPayload(overrides);
    if (!result) return commitQueueRef.current;
    if (result.error) {
      setError(result.error);
      return commitQueueRef.current;
    }
    commitQueueRef.current = commitQueueRef.current.then(() => runSave(result.payload));
    return commitQueueRef.current;
  }

  async function handleDone() {
    const ok = await commitChange();
    if (ok) onClose();
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

        <form className="modal__form" onSubmit={(e) => { e.preventDefault(); handleDone(); }}>
          {error && <p className="auth-card__error">{error}</p>}

          {(!originLocked || !isCalendarItem) && (
            <label className="modal__field">
              <span className="modal__label">List</span>
              <select
                className="modal__input"
                value={listId}
                onChange={(e) => handleListChange(e.target.value)}
                required={!isCalendarItem}
              >
                {!originLocked && !defaultListId && <option value="">No list (calendar event)</option>}
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
                onChange={(e) => { setGroupId(e.target.value); commitChange({ groupId: e.target.value }); }}
                disabled={originLocked}
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
              onBlur={() => commitChange()}
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
              onBlur={() => commitChange()}
              rows={2}
            />
          </label>

          {!isCalendarItem && (
            <label className="modal__toggle">
              <input
                type="checkbox"
                checked={done}
                onChange={(e) => { const checked = e.target.checked; setDone(checked); commitChange({ done: checked }); }}
              />
              <span>Mark as complete</span>
            </label>
          )}

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

          {!isCalendarItem && (
            <div className="modal__field">
              <span className="modal__label">Attachments</span>
              <AttachmentUploader
                attachments={attachments}
                onChange={(next) => { setAttachments(next); commitChange({ attachments: next }); }}
              />
              {!hasSavedItem && attachments.length > 0 && (
                <p className="modal__hint">Files upload once the task is created.</p>
              )}
            </div>
          )}

          <label className="modal__field">
            <span className="modal__label">{isCalendarItem ? 'Date' : 'Complete by'}</span>
            <input
              type="date"
              className="modal__input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onBlur={() => commitChange()}
              required={isCalendarItem}
            />
          </label>

          {date && (
            <label className="modal__field">
              <span className="modal__label">Repeat</span>
              <select
                className="modal__input"
                value={recurrence}
                onChange={(e) => { setRecurrence(e.target.value); commitChange({ recurrence: e.target.value }); }}
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
                onChange={(e) => { const checked = e.target.checked; setTimed(checked); commitChange({ timed: checked }); }}
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
                  onBlur={() => commitChange()}
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
                  onBlur={() => commitChange()}
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
                onChange={(e) => { setAssignedToId(e.target.value); commitChange({ assignedToId: e.target.value }); }}
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
            <button type="submit" className="button button--primary" disabled={saving}>
              {saving ? 'Saving…' : 'Done'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PlanItemModal;
