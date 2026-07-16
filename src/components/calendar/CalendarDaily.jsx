import { isTaskOnDay } from '../../utils/tasks';
import useNow from '../../hooks/useNow';
import CalendarTimeline, { CalendarHourGutter } from './CalendarTimeline';

function CalendarDaily({
  focusDate, tasks, onToggleTask, onOpenTask, onCreateTask, onMoveTask, onPushToTomorrow,
}) {
  // Day view's timeline shows events only — to-dos live in the day panel instead.
  const events = tasks.filter((task) => task.origin === 'event');
  const hasEvents = events.some((task) => isTaskOnDay(task, focusDate));
  const now = useNow();

  return (
    <div className="calendar-day">
      {!hasEvents && <p className="calendar-day__empty">Nothing scheduled today.</p>}
      <div className="calendar-day__timeline">
        <CalendarHourGutter showAlldayLabel />
        <CalendarTimeline
          day={focusDate}
          tasks={events}
          now={now}
          onToggleTask={onToggleTask}
          onOpenTask={onOpenTask}
          onCreateTask={onCreateTask}
          onMoveTask={onMoveTask}
          onPushToTomorrow={onPushToTomorrow}
        />
      </div>
    </div>
  );
}

export default CalendarDaily;
