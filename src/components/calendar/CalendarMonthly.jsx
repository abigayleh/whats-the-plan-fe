import { WEEKDAY_LABELS, getMonthGrid, isToday } from '../../utils/date';
import { isTaskOnDay, isTaskTimed } from '../../utils/tasks';

function CalendarMonthly({
  focusDate, tasks, onSelectDay,
}) {
  const days = getMonthGrid(focusDate);
  const month = focusDate.getMonth();

  function itemsForDay(day) {
    return tasks
      .filter((task) => isTaskOnDay(task, day))
      .map((task) => ({ id: task.id, colorKey: task.colorKey, timed: isTaskTimed(task) }));
  }

  return (
    <div className="calendar-month">
      <div className="calendar-month__weekdays">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="calendar-month__grid">
        {days.map((day) => {
          const dayItems = itemsForDay(day);
          const outside = day.getMonth() !== month;
          return (
            <button
              key={day.toISOString()}
              type="button"
              className={`calendar-month__day${outside ? ' calendar-month__day--outside' : ''}${isToday(day) ? ' calendar-month__day--today' : ''}`}
              onClick={() => onSelectDay(day)}
            >
              <span className="calendar-month__day-number">{day.getDate()}</span>
              <span className="calendar-month__dots">
                {dayItems.slice(0, 3).map((item) => (
                  <span
                    key={item.id}
                    className={`calendar-month__dot calendar-month__dot--${item.colorKey}${item.timed ? '' : ' calendar-month__dot--task'}`}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CalendarMonthly;
