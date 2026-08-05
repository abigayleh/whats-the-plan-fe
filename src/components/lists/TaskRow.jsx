import { useEffect, useState } from 'react';
import { CheckIcon, RepeatIcon } from '../layout/icons';
import { formatDateShort, formatTime } from '../../utils/date';
import {
  getTaskDay, isTaskOverdue, isTaskTimed, isTaskDoneOnDay,
} from '../../utils/tasks';
import TaskActionButtons from '../tasks/TaskActionButtons';
import Linkify from '../common/Linkify';
import EntityIcon from '../common/EntityIcon';

function TaskRow({
  task, lists, onToggle, onClick, draggable = false, plain = false, day = null,
}) {
  // A whole recurring series (list view) has a live recurrenceRule; a single calendar
  // occurrence does not. `day` names the day this row stands for — an Overdue row, or a
  // day on the calendar — which is what makes a series row tickable for that day alone.
  const seriesRow = Boolean(task.recurrenceRule) && !day;

  // Optimistic check: show the tick the instant it's clicked, then let the server-confirmed
  // status take over (and the row re-sort/disappear) once the refetch lands.
  const [pendingDone, setPendingDone] = useState(null);
  useEffect(() => { setPendingDone(null); }, [task.status, task.completedDates]);
  // A series is done per day, never as a whole — its own `status` says nothing about this row,
  // so a series that was ticked off before it started repeating can't show through as done.
  const done = pendingDone
    ?? (task.recurrenceRule ? Boolean(day && isTaskDoneOnDay(task, day)) : task.status === 'done');

  function handleToggle() {
    setPendingDone(!done);
    if (day) onToggle(task.id, day);
    else onToggle(task.id);
  }
  const overdue = isTaskOverdue(task);
  const shownDay = getTaskDay(task);
  const timed = isTaskTimed(task);
  const subtaskCount = task.subtasks?.length ?? 0;
  const subtaskDone = task.subtasks?.filter((s) => s.done).length ?? 0;

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
        title={seriesRow ? 'Repeating to-dos are completed a day at a time' : undefined}
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
          <EntityIcon icon={task.icon} className="task-row__icon" />
          <Linkify text={task.title} />
          {task.recurrenceRule && <RepeatIcon className="task-row__repeat-icon" />}
        </span>
        {!plain && (shownDay || task.assignedTo || subtaskCount > 0) && (
          <span className="task-row__meta">
            {shownDay && (
              <span className={`task-row__due${overdue ? ' task-row__due--overdue' : ''}`}>
                {formatDateShort(shownDay)}
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
      {!plain && <TaskActionButtons task={task} lists={lists} />}
    </div>
  );
}

export default TaskRow;
