import { useEffect, useState } from 'react';
import { CheckIcon, RepeatIcon } from '../layout/icons';
import { formatDateShort, formatTime } from '../../utils/date';
import { getTaskDay, isTaskOverdue, isTaskTimed } from '../../utils/tasks';
import { getTaskIcon } from '../../constants/taskIcons';
import TaskActionButtons from '../tasks/TaskActionButtons';
import Linkify from '../common/Linkify';

function TaskRow({
  task, lists, onToggle, onClick, draggable = false, plain = false,
}) {
  // Optimistic check: show the tick the instant it's clicked, then let the server-confirmed
  // status take over (and the row re-sort/disappear) once the refetch lands.
  const [pendingDone, setPendingDone] = useState(null);
  useEffect(() => { setPendingDone(null); }, [task.status]);
  const done = pendingDone ?? (task.status === 'done');

  function handleToggle() {
    setPendingDone(!done);
    onToggle(task.id);
  }
  const overdue = isTaskOverdue(task);
  const day = getTaskDay(task);
  const timed = isTaskTimed(task);
  const subtaskCount = task.subtasks?.length ?? 0;
  const subtaskDone = task.subtasks?.filter((s) => s.done).length ?? 0;
  const categoryIcon = getTaskIcon(task.icon);
  const CategoryIcon = categoryIcon?.Icon;
  // A whole recurring series (list view) has a live recurrenceRule; a single calendar occurrence
  // does not. The series can't be checked done as a whole — completion is per day on the calendar.
  const seriesRow = Boolean(task.recurrenceRule);

  return (
    <div
      className={`task-row task-row--${task.colorKey}${done ? ' task-row--done' : ''}`}
      onClick={() => onClick(task)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(task);
        }
      }}
      role="button"
      tabIndex={0}
      draggable={draggable}
      onDragStart={draggable ? (e) => e.dataTransfer.setData('text/plain', task.id) : undefined}
    >
      <span
        className={`task-row__check${seriesRow ? ' task-row__check--disabled' : ''}`}
        role="checkbox"
        aria-checked={done}
        aria-disabled={seriesRow || undefined}
        tabIndex={seriesRow ? -1 : 0}
        title={seriesRow ? 'Recurring to-dos are completed per day on the calendar' : undefined}
        onClick={seriesRow ? undefined : (e) => {
          e.stopPropagation();
          handleToggle();
        }}
        onKeyDown={seriesRow ? undefined : (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            handleToggle();
          }
        }}
      >
        {done && <CheckIcon />}
      </span>
      <span className="task-row__body">
        <span className="task-row__title">
          {CategoryIcon && <CategoryIcon className="task-row__icon" />}
          <Linkify text={task.title} />
          {task.recurrenceRule && <RepeatIcon className="task-row__repeat-icon" />}
        </span>
        {!plain && (day || task.assignedTo || subtaskCount > 0) && (
          <span className="task-row__meta">
            {day && (
              <span className={`task-row__due${overdue ? ' task-row__due--overdue' : ''}`}>
                {formatDateShort(day)}
                {timed && ` · ${formatTime(task.scheduledStart)}`}
              </span>
            )}
            {subtaskCount > 0 && (
              <span className="task-row__subtasks">{subtaskDone}/{subtaskCount}</span>
            )}
            {task.assignedTo && <span className="task-row__assignee">{task.assignedTo}</span>}
          </span>
        )}
      </span>
      <TaskActionButtons task={task} lists={lists} />
    </div>
  );
}

export default TaskRow;
