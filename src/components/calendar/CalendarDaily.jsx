import { isTaskOnDay, isTaskTimed } from '../../utils/tasks';
import useNow from '../../hooks/useNow';
import CalendarTimeline, { CalendarHourGutter } from './CalendarTimeline';

function CalendarDaily({
  focusDate, tasks, onToggleTask, onOpenTask, onCreateTask, onMoveTask, onPushToTomorrow,
}) {
  // Day view's timeline shows events plus timed to-dos; date-only to-dos live in the day panel.
  const timelineItems = tasks.filter((task) => task.origin === 'event' || isTaskTimed(task));
  const hasTimelineItems = timelineItems.some((task) => isTaskOnDay(task, focusDate));
  const now = useNow();

  return (
    <div className="calendar-day">
      {!hasTimelineItems && <p className="calendar-day__empty">Nothing scheduled today.</p>}
      <div className="calendar-day__timeline">
        <CalendarHourGutter showAlldayLabel />
        <CalendarTimeline
          day={focusDate}
          tasks={timelineItems}
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
