import TaskRow from '../lists/TaskRow';

// Draggable tray of to-dos with no date at all — dragging a row onto CalendarTimeline
// schedules it (see usePlanItems.moveItem). Shared by the day+Both split panel and the
// week/day toggle tray so the two never duplicate this markup.
function UnscheduledPanel({ tasks, lists, onToggle, onOpen }) {
  return (
    <div className="unscheduled-panel">
      <h2 className="unscheduled-panel__title">Unscheduled to-dos</h2>
      {tasks.length === 0 && <p className="unscheduled-panel__empty">Nothing unscheduled.</p>}
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} lists={lists} onToggle={onToggle} onClick={onOpen} draggable />
      ))}
    </div>
  );
}

export default UnscheduledPanel;
