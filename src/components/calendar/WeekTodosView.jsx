import { getWeekDays, isToday } from '../../utils/date';
import { isTaskOnDay, isTaskTimed } from '../../utils/tasks';
import TaskRow from '../lists/TaskRow';

// Todos-per-day for the week: same day-of-week columns as the grid, but each day's to-dos
// are listed (timed first) rather than laid out on an hourly timeline. Events are omitted.
function todosForDay(tasks, day) {
  return tasks
    .filter((t) => t.origin === 'task' && isTaskOnDay(t, day))
    .sort((a, b) => {
      const at = isTaskTimed(a);
      const bt = isTaskTimed(b);
      if (at && bt) return a.scheduledStart - b.scheduledStart;
      if (at !== bt) return at ? -1 : 1;
      return 0;
    });
}

function TodoColumn({
  label, dayNum, today, todos, lists, onToggle, onOpen,
}) {
  return (
    <div className={`week-todos__col${today ? ' week-todos__col--today' : ''}`}>
      <div className="week-todos__head">
        <span className="week-todos__weekday">{label}</span>
        {dayNum != null && <span className="week-todos__daynum">{dayNum}</span>}
      </div>
      <div className="week-todos__list">
        {todos.length === 0
          ? <p className="week-todos__empty">—</p>
          : todos.map((t) => (
            <TaskRow key={t.id} task={t} lists={lists} onToggle={onToggle} onClick={onOpen} plain />
          ))}
      </div>
    </div>
  );
}

function WeekTodosView({
  focusDate, tasks, unscheduledTasks, lists, onToggle, onOpen, onOpenUnscheduled,
}) {
  const days = getWeekDays(focusDate);
  return (
    <div className="week-todos">
      {days.map((day) => (
        <TodoColumn
          key={day.toISOString()}
          label={day.toLocaleDateString(undefined, { weekday: 'short' })}
          dayNum={day.getDate()}
          today={isToday(day)}
          todos={todosForDay(tasks, day)}
          lists={lists}
          onToggle={onToggle}
          onOpen={onOpen}
        />
      ))}
      {unscheduledTasks.length > 0 && (
        <TodoColumn
          label="No date"
          todos={unscheduledTasks}
          lists={lists}
          onToggle={onToggle}
          onOpen={onOpenUnscheduled}
        />
      )}
    </div>
  );
}

export default WeekTodosView;
