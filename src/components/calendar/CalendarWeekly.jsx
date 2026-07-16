import { getWeekDays, isToday } from '../../utils/date';
import useNow from '../../hooks/useNow';
import CalendarTimeline, { CalendarHourGutter } from './CalendarTimeline';

function CalendarWeekly({
  focusDate, tasks, onSelectDay, onToggleTask, onOpenTask, onCreateTask, onMoveTask, onPushToTomorrow,
}) {
  const days = getWeekDays(focusDate);
  const now = useNow();

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

      <div className="calendar-week__timeline">
        <CalendarHourGutter showAlldayLabel />
        {days.map((day) => (
          <CalendarTimeline
            key={day.toISOString()}
            day={day}
            tasks={tasks}
            now={now}
            onToggleTask={onToggleTask}
            onOpenTask={onOpenTask}
            onCreateTask={onCreateTask}
            onMoveTask={onMoveTask}
            onPushToTomorrow={onPushToTomorrow}
          />
        ))}
      </div>
    </div>
  );
}

export default CalendarWeekly;
