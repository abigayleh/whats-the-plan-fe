import { DAY_HOURS, formatHourLabel } from '../../utils/date';
import { isTaskOnDay, isTaskTimed } from '../../utils/tasks';
import TaskChip from './TaskChip';

function CalendarDaily({
  focusDate, tasks, lists, onToggleTask, onOpenTask, onCreateTask,
}) {
  const timedTasks = tasks
    .filter((task) => isTaskTimed(task) && isTaskOnDay(task, focusDate))
    .sort((a, b) => a.scheduledStart - b.scheduledStart);

  const alldayTasks = tasks.filter((task) => !isTaskTimed(task) && isTaskOnDay(task, focusDate));

  function tasksForHour(hour) {
    return timedTasks.filter((task) => task.scheduledStart.getHours() === hour);
  }

  return (
    <div className="calendar-day">
      {alldayTasks.length > 0 && (
        <div className="calendar-day__allday">
          <p className="calendar-day__allday-label">To-do today</p>
          {alldayTasks.map((task) => (
            <TaskChip
              key={task.id}
              task={task}
              lists={lists}
              onToggle={onToggleTask}
              onOpen={onOpenTask}
              showActions
            />
          ))}
        </div>
      )}

      {timedTasks.length === 0 && alldayTasks.length === 0 && (
        <p className="calendar-day__empty">Nothing scheduled today.</p>
      )}

      <div className="calendar-day__timeline">
        {DAY_HOURS.map((hour) => {
          const hourTasks = tasksForHour(hour);
          return (
            <div key={hour} className="calendar-day__slot">
              <span className="calendar-day__hour">{formatHourLabel(hour)}</span>
              <div
                className="calendar-day__slot-events"
                onClick={() => onCreateTask?.(focusDate, hour)}
              >
                {hourTasks.map((task) => (
                  <TaskChip
                    key={task.id}
                    task={task}
                    lists={lists}
                    onToggle={onToggleTask}
                    onOpen={onOpenTask}
                    showActions
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CalendarDaily;
