import TaskRowGroup from './TaskRowGroup';

// Draggable tray of to-dos with no date at all — dragging a row onto CalendarTimeline
// schedules it (see usePlanItems.moveItem). Used by the week-view toggle tray; the day-view
// panel builds its own "Today"/"Unscheduled" split from the shared TaskRowGroup instead.
function UnscheduledPanel({ tasks, lists, onToggle, onOpen }) {
  return (
    <div className="unscheduled-panel">
      <TaskRowGroup
        title="Unscheduled to-dos"
        tasks={tasks}
        lists={lists}
        onToggle={onToggle}
        onOpen={onOpen}
        emptyLabel="Nothing unscheduled."
      />
    </div>
  );
}

export default UnscheduledPanel;
