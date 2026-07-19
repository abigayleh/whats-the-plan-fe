import { useEffect, useState } from 'react';
import { CheckIcon, RepeatIcon, SkipForwardIcon } from '../layout/icons';
import { formatTime } from '../../utils/date';
import { isItemRecurring, isTaskTimed } from '../../utils/tasks';
import TaskActionButtons from '../tasks/TaskActionButtons';
import Linkify from '../common/Linkify';

function TaskChip({
  task, lists, onToggle, onOpen, onPushToTomorrow, compact = false, showActions = false, hideTime = false,
  draggable = false, past = false,
}) {
  // Optimistic check — see TaskRow: show the tick immediately, defer to server status on refetch.
  const [pendingDone, setPendingDone] = useState(null);
  useEffect(() => { setPendingDone(null); }, [task.status]);
  const done = pendingDone ?? (task.status === 'done');
  function handleToggle() {
    setPendingDone(!done);
    onToggle(task.id);
  }
  const timed = isTaskTimed(task);
  const isEvent = task.origin === 'event';
  const recurring = isItemRecurring(task);
  // Timed chips render as a solid color block (no room for the always-visible checkbox), so
  // they get their complete-toggle in the hover bar instead; push-to-tomorrow lives there too.
  const showHoverActions = !compact && (onPushToTomorrow || (!isEvent && timed));

  return (
    <div
      className={`task-chip task-chip--${task.colorKey}${done ? ' task-chip--done' : ''}${compact ? ' task-chip--compact' : ''}${timed ? ' task-chip--timed' : ''}${past ? ' task-chip--past' : ''}`}
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
      {!timed && !isEvent && (
        <button
          type="button"
          className="task-chip__check"
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
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
            <Linkify text={task.title} />
            {recurring && <RepeatIcon className="task-chip__repeat-icon" />}
          </p>
          {timed && !hideTime && (
            <p className="task-chip__time">
              {formatTime(task.scheduledStart)} – {formatTime(task.scheduledEnd)}
            </p>
          )}
        </div>
      )}
      {showHoverActions && (
        <div className="task-chip__actions" onClick={(e) => e.stopPropagation()}>
          {!isEvent && timed && (
            <button
              type="button"
              className="task-chip__action-button"
              onClick={() => handleToggle()}
              aria-label={done ? 'Mark as not done' : 'Mark as done'}
              aria-pressed={done}
              data-tooltip={done ? 'Mark as not done' : 'Mark as done'}
            >
              <CheckIcon width={12} height={12} />
            </button>
          )}
          {onPushToTomorrow && (
            <button
              type="button"
              className="task-chip__action-button"
              onClick={() => onPushToTomorrow(task.id)}
              disabled={recurring}
              aria-label="Push to tomorrow"
              data-tooltip={recurring ? "Recurring items can't be pushed individually" : 'Push to tomorrow'}
            >
              <SkipForwardIcon width={12} height={12} />
            </button>
          )}
        </div>
      )}
      {showActions && !compact && <TaskActionButtons task={task} lists={lists} />}
    </div>
  );
}

export default TaskChip;
