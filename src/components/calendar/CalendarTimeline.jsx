import {
  DAY_HOURS, formatHourLabel, getTimeFromTimelinePosition, getTimelinePosition,
} from '../../utils/date';
import { getTaskDay, isTaskOnDay, isTaskTimed } from '../../utils/tasks';
import { computeOverlapLayout } from '../../utils/overlap';
import TaskChip from './TaskChip';

const MAX_ALLDAY_VISIBLE = 3;
export const ROW_HEIGHT_REM = 3;
export const TIMELINE_HEIGHT_REM = DAY_HOURS.length * ROW_HEIGHT_REM;

// Hour-label gutter shared by week (once) and day (once) views — kept here so the
// hour range/row-height constants it depends on only live in one place. Height is
// left to natural flow (allday-label + hour rows) so it matches CalendarTimeline's
// total height, which is driven by the same $timeline-allday-height SCSS variable.
export function CalendarHourGutter({ showAlldayLabel = false }) {
  return (
    <div className="calendar-hours">
      <div className="calendar-hours__allday-label">{showAlldayLabel ? 'To-dos' : null}</div>
      {DAY_HOURS.map((hour) => (
        <div key={hour} className="calendar-hours__label" style={{ height: `${ROW_HEIGHT_REM}rem` }}>
          {formatHourLabel(hour)}
        </div>
      ))}
    </div>
  );
}

// Renders one day's worth of the calendar: an all-day drop strip on top, and an
// absolute-positioned hour timeline below. Used by CalendarWeekly (7 columns) and
// CalendarDaily (1 wide column) so both views share click-to-create + drag/drop.
function CalendarTimeline({
  day, tasks, onToggleTask, onOpenTask, onCreateTask, onMoveTask,
}) {
  const timedTasks = tasks.filter((task) => isTaskTimed(task) && isTaskOnDay(task, day));
  const alldayTasks = tasks.filter((task) => !isTaskTimed(task) && getTaskDay(task) && isTaskOnDay(task, day));
  const overlapLayout = computeOverlapLayout(timedTasks);

  function handleColumnClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = (e.clientY - rect.top) / rect.height;
    const { hour, minute } = getTimeFromTimelinePosition(fraction);
    onCreateTask?.(day, hour, minute);
  }

  function handleColumnDrop(e) {
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

  function handleAlldayDrop(e) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    onMoveTask?.(taskId, { day, timed: false });
  }

  return (
    <div className="calendar-timeline">
      <div
        className="calendar-timeline__allday"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleAlldayDrop}
      >
        {alldayTasks.slice(0, MAX_ALLDAY_VISIBLE).map((task) => (
          <TaskChip key={task.id} task={task} onToggle={onToggleTask} onOpen={onOpenTask} draggable />
        ))}
        {alldayTasks.length > MAX_ALLDAY_VISIBLE && (
          <span className="calendar-timeline__more">+{alldayTasks.length - MAX_ALLDAY_VISIBLE}</span>
        )}
      </div>

      <div
        className="calendar-timeline__col"
        style={{ height: `${TIMELINE_HEIGHT_REM}rem` }}
        onClick={handleColumnClick}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleColumnDrop}
      >
        {/* Seam for Part 2: a now-line element can be absolutely positioned here via getTimelinePosition(new Date()). */}
        {timedTasks.map((task) => {
          const top = getTimelinePosition(task.scheduledStart) * 100;
          const bottom = getTimelinePosition(task.scheduledEnd) * 100;
          const height = Math.max(bottom - top, 3);
          const durationMinutes = (task.scheduledEnd - task.scheduledStart) / 60000;
          const compact = durationMinutes < 30;
          const { left, width } = overlapLayout.get(task.id) ?? { left: 0, width: 1 };

          return (
            <div
              key={task.id}
              className="calendar-timeline__block"
              style={{
                top: `${top}%`,
                height: `${height}%`,
                left: `calc(${left * 100}% + 0.125rem)`,
                width: `calc(${width * 100}% - 0.25rem)`,
              }}
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
    </div>
  );
}

export default CalendarTimeline;
