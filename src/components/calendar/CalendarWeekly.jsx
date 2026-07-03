import {
  DAY_HOURS, formatHourLabel, getTimeFromTimelinePosition, getTimelinePosition, getWeekDays, isToday,
} from '../../utils/date';
import { getTaskDay, isTaskOnDay, isTaskTimed } from '../../utils/tasks';
import TaskChip from './TaskChip';

const MAX_ALLDAY_VISIBLE = 3;
const ROW_HEIGHT_REM = 3;
const TIMELINE_HEIGHT_REM = DAY_HOURS.length * ROW_HEIGHT_REM;

function CalendarWeekly({
  focusDate, tasks, onSelectDay, onToggleTask, onOpenTask, onCreateTask, onMoveTask,
}) {
  const days = getWeekDays(focusDate);

  function timedTasksForDay(day) {
    return tasks.filter((task) => isTaskTimed(task) && isTaskOnDay(task, day));
  }

  function alldayTasksForDay(day) {
    return tasks.filter((task) => !isTaskTimed(task) && getTaskDay(task) && isTaskOnDay(task, day));
  }

  function handleColumnClick(e, day) {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = (e.clientY - rect.top) / rect.height;
    const { hour, minute } = getTimeFromTimelinePosition(fraction);
    onCreateTask?.(day, hour, minute);
  }

  function handleColumnDrop(e, day) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = (e.clientY - rect.top) / rect.height;
    const { hour, minute } = getTimeFromTimelinePosition(fraction);
    onMoveTask?.(taskId, {
      day, hour, minute, timed: true,
    });
  }

  function handleAlldayDrop(e, day) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    onMoveTask?.(taskId, { day, timed: false });
  }

  return (
    <div className="calendar-week">
      <div className="calendar-week__header">
        <div className="calendar-week__gutter" />
        {days.map((day) => (
          <button
            key={day.toISOString()}
            type="button"
            className={`calendar-week__headcell${isToday(day) ? ' calendar-week__headcell--today' : ''}`}
            onClick={() => onSelectDay(day)}
          >
            <span className="calendar-week__weekday">
              {day.toLocaleDateString(undefined, { weekday: 'short' })}
            </span>
            <span className="calendar-week__daynum">{day.getDate()}</span>
          </button>
        ))}
      </div>

      <div className="calendar-week__allday">
        <div className="calendar-week__gutter calendar-week__gutter--label">To-dos</div>
        {days.map((day) => {
          const dayTasks = alldayTasksForDay(day);
          return (
            <div
              key={day.toISOString()}
              className="calendar-week__allday-col"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleAlldayDrop(e, day)}
            >
              {dayTasks.slice(0, MAX_ALLDAY_VISIBLE).map((task) => (
                <TaskChip key={task.id} task={task} onToggle={onToggleTask} onOpen={onOpenTask} draggable />
              ))}
              {dayTasks.length > MAX_ALLDAY_VISIBLE && (
                <span className="calendar-week__more">+{dayTasks.length - MAX_ALLDAY_VISIBLE}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="calendar-week__timeline">
        <div className="calendar-week__hours" style={{ height: `${TIMELINE_HEIGHT_REM}rem` }}>
          {DAY_HOURS.map((hour) => (
            <div key={hour} className="calendar-week__hour-label" style={{ height: `${ROW_HEIGHT_REM}rem` }}>
              {formatHourLabel(hour)}
            </div>
          ))}
        </div>
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className="calendar-week__col"
            style={{ height: `${TIMELINE_HEIGHT_REM}rem` }}
            onClick={(e) => handleColumnClick(e, day)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleColumnDrop(e, day)}
          >
            {timedTasksForDay(day).map((task) => {
              const top = getTimelinePosition(task.scheduledStart) * 100;
              const bottom = getTimelinePosition(task.scheduledEnd) * 100;
              const height = Math.max(bottom - top, 3);
              const durationMinutes = (task.scheduledEnd - task.scheduledStart) / 60000;
              const compact = durationMinutes < 30;

              return (
                <div
                  key={task.id}
                  className="calendar-week__block"
                  style={{ top: `${top}%`, height: `${height}%` }}
                >
                  <TaskChip
                    task={task}
                    onToggle={onToggleTask}
                    onOpen={onOpenTask}
                    compact={compact}
                    hideTime
                    draggable
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CalendarWeekly;
