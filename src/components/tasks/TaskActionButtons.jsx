import { useState } from 'react';
import {
  ClockIcon, FolderIcon, SkipForwardIcon, TrashIcon,
} from '../layout/icons';
import useAppData from '../../hooks/useAppData';
import { addDays } from '../../utils/date';
import {
  combineDateAndTime, getTaskDay, isTaskTimed, toDateInputValue, toTimeInputValue,
} from '../../utils/tasks';

function TaskActionButtons({ task, lists }) {
  const { updateTask, deleteTask } = useAppData();
  const [openPopover, setOpenPopover] = useState(null); // null | 'reschedule' | 'move'
  const timed = isTaskTimed(task);
  const writableLists = lists.filter((list) => !list.isSystem);
  // On the calendar these rows are occurrences whose `id` is synthetic — always act on the
  // real DB id so update/delete resolve (on list rows sourceId equals id anyway).
  const taskId = task.sourceId ?? task.id;

  const [date, setDate] = useState(toDateInputValue(getTaskDay(task)));
  const [startTime, setStartTime] = useState(toTimeInputValue(task.scheduledStart) || '09:00');
  const [endTime, setEndTime] = useState(toTimeInputValue(task.scheduledEnd) || '10:00');

  function toggle(popover) {
    setOpenPopover((prev) => (prev === popover ? null : popover));
  }

  function handleReschedule(e) {
    e.preventDefault();
    if (!date) return;
    if (timed) {
      updateTask(taskId, {
        scheduledStart: combineDateAndTime(date, startTime),
        scheduledEnd: combineDateAndTime(date, endTime),
      });
    } else {
      updateTask(taskId, { dueDate: combineDateAndTime(date, '00:00') });
    }
    setOpenPopover(null);
  }

  function handlePushToTomorrow() {
    const tomorrow = addDays(new Date(), 1);
    const tomorrowStr = toDateInputValue(tomorrow);
    if (timed) {
      updateTask(taskId, {
        scheduledStart: combineDateAndTime(tomorrowStr, toTimeInputValue(task.scheduledStart)),
        scheduledEnd: combineDateAndTime(tomorrowStr, toTimeInputValue(task.scheduledEnd)),
      });
    } else {
      updateTask(taskId, { dueDate: combineDateAndTime(tomorrowStr, '00:00') });
    }
  }

  // The API re-scopes the task and drops an assignee who isn't in the target group.
  function handleMove(newListId) {
    if (newListId && newListId !== task.listId) updateTask(taskId, { listId: newListId });
    setOpenPopover(null);
  }

  return (
    <div className="task-actions" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="task-actions__button"
        onClick={() => toggle('reschedule')}
        aria-label="Reschedule"
        data-tooltip="Reschedule"
      >
        <ClockIcon width={15} height={15} />
      </button>
      <button
        type="button"
        className="task-actions__button"
        onClick={handlePushToTomorrow}
        aria-label="Push to tomorrow"
        data-tooltip="Push to tomorrow"
      >
        <SkipForwardIcon width={15} height={15} />
      </button>
      <button
        type="button"
        className="task-actions__button"
        onClick={() => toggle('move')}
        aria-label="Move to another list"
        data-tooltip="Move to another list"
      >
        <FolderIcon width={15} height={15} />
      </button>
      <button
        type="button"
        className="task-actions__button task-actions__button--danger"
        onClick={() => deleteTask(taskId)}
        aria-label="Delete"
        data-tooltip="Delete"
      >
        <TrashIcon width={15} height={15} />
      </button>

      {openPopover === 'reschedule' && (
        <form className="task-actions__popover" onSubmit={handleReschedule}>
          <input
            type="date"
            className="modal__input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          {timed && (
            <div className="modal__time-row">
              <input
                type="time"
                className="modal__input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
              <input
                type="time"
                className="modal__input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          )}
          <button type="submit" className="button button--primary">Save</button>
        </form>
      )}

      {openPopover === 'move' && (
        <div className="task-actions__popover">
          <select
            className="modal__input"
            value={task.listId ?? ''}
            onChange={(e) => handleMove(e.target.value)}
          >
            {writableLists.map((list) => (
              <option key={list.id} value={list.id}>{list.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export default TaskActionButtons;
