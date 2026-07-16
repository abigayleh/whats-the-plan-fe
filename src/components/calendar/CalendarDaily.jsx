import { isTaskOnDay } from '../../utils/tasks';
import useNow from '../../hooks/useNow';
import CalendarTimeline, { CalendarHourGutter } from './CalendarTimeline';

function CalendarDaily({
  focusDate, tasks, onToggleTask, onOpenTask, onCreateTask, onMoveTask,
}) {
  const hasTasks = tasks.some((task) => isTaskOnDay(task, focusDate));
  const now = useNow();

  return (
    <div className="calendar-day">
      {!hasTasks && <p className="calendar-day__empty">Nothing scheduled today.</p>}
      <div className="calendar-day__timeline">
        <CalendarHourGutter showAlldayLabel />
        <CalendarTimeline
          day={focusDate}
          tasks={tasks}
          now={now}
          onToggleTask={onToggleTask}
          onOpenTask={onOpenTask}
          onCreateTask={onCreateTask}
          onMoveTask={onMoveTask}
        />
      </div>
    </div>
  );
}

export default CalendarDaily;
