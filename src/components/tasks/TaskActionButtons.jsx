import { useState } from 'react';
import { ClockIcon, FolderIcon, TrashIcon } from '../layout/icons';
import useAppData from '../../hooks/useAppData';
import {
  combineDateAndTime, getTaskDay, isTaskTimed, toDateInputValue, toTimeInputValue,
} from '../../utils/tasks';

function TaskActionButtons({ task, lists }) {
  const { groups, updateTask, deleteTask } = useAppData();
  const [openPopover, setOpenPopover] = useState(null); // null | 'reschedule' | 'move'
  const timed = isTaskTimed(task);
  const writableLists = lists.filter((list) => !list.isSystem);

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
      updateTask(task.id, {
        scheduledStart: combineDateAndTime(date, startTime),
        scheduledEnd: combineDateAndTime(date, endTime),
      });
    } else {
      updateTask(task.id, { dueDate: combineDateAndTime(date, '00:00') });
    }
    setOpenPopover(null);
  }

  function handleMove(newListId) {
    const newList = newListId ? writableLists.find((list) => list.id === newListId) : null;
    const newGroupId = newList?.groupId ?? null;
    const newGroup = newGroupId ? groups.find((group) => group.id === newGroupId) : null;
    const assigneeStillValid = !task.assignedTo
      || (newGroup && newGroup.members.some((member) => member.name === task.assignedTo));

    updateTask(task.id, {
      listId: newListId || null,
      groupId: newGroupId,
      assignedTo: assigneeStillValid ? task.assignedTo : null,
    });
    setOpenPopover(null);
  }

  return (
    <div className="task-actions" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="task-actions__button"
        onClick={() => toggle('reschedule')}
        aria-label="Reschedule"
      >
        <ClockIcon width={15} height={15} />
      </button>
      <button
        type="button"
        className="task-actions__button"
        onClick={() => toggle('move')}
        aria-label="Move to another list"
      >
        <FolderIcon width={15} height={15} />
      </button>
      <button
        type="button"
        className="task-actions__button task-actions__button--danger"
        onClick={() => deleteTask(task.id)}
        aria-label="Delete"
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
            onChange={(e) => handleMove(e.target.value || null)}
          >
            <option value="">No list</option>
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
