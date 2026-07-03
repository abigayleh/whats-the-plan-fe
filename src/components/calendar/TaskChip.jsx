import { CheckIcon, RepeatIcon } from '../layout/icons';
import { formatTime } from '../../utils/date';
import { isTaskTimed } from '../../utils/tasks';
import { getTaskIcon } from '../../constants/taskIcons';
import TaskActionButtons from '../tasks/TaskActionButtons';

function TaskChip({
  task, lists, onToggle, onOpen, compact = false, showActions = false, hideTime = false, draggable = false,
}) {
  const done = task.status === 'done';
  const timed = isTaskTimed(task);
  const categoryIcon = getTaskIcon(task.icon);
  const CategoryIcon = categoryIcon?.Icon;

  return (
    <div
      className={`task-chip task-chip--${task.colorKey}${done ? ' task-chip--done' : ''}${compact ? ' task-chip--compact' : ''}${timed ? ' task-chip--timed' : ''}`}
      title={task.title}
      draggable={draggable}
      onDragStart={draggable ? (e) => e.dataTransfer.setData('text/plain', task.id) : undefined}
      onClick={(e) => {
        e.stopPropagation();
        onOpen?.(task);
      }}
      onKeyDown={(e) => {
        if (onOpen && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onOpen(task);
        }
      }}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
    >
      {!timed && (
        <button
          type="button"
          className="task-chip__check"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task.id);
          }}
          aria-label={done ? 'Mark as not done' : 'Mark as done'}
          aria-pressed={done}
        >
          {done && <CheckIcon />}
        </button>
      )}
      {!compact && (
        <div className="task-chip__body">
          <p className="task-chip__title">
            {CategoryIcon && <CategoryIcon className="task-chip__icon" />}
            {task.title}
            {task.recurrenceRule && <RepeatIcon className="task-chip__repeat-icon" />}
          </p>
          {timed && !hideTime && (
            <p className="task-chip__time">
              {formatTime(task.scheduledStart)} – {formatTime(task.scheduledEnd)}
            </p>
          )}
        </div>
      )}
      {showActions && !compact && <TaskActionButtons task={task} lists={lists} />}
    </div>
  );
}

export default TaskChip;
