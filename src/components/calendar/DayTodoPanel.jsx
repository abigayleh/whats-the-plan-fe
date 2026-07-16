import TaskRowGroup from './TaskRowGroup';

// Day view's always-on right-hand panel: "Today" (origin-'task' items due/scheduled on this
// day) above "Unscheduled" (no date at all) — both stay draggable onto CalendarTimeline.
// The "Unscheduled" section honors the page's "Show unscheduled to-dos" toggle.
function DayTodoPanel({
  todayTasks, unscheduledTasks, lists, onToggle, onOpenToday, onOpenUnscheduled, showUnscheduled,
}) {
  return (
    <div className="day-todo-panel">
      <TaskRowGroup
        title="Today"
        tasks={todayTasks}
        lists={lists}
        onToggle={onToggle}
        onOpen={onOpenToday}
        emptyLabel="Nothing due today."
      />
      {showUnscheduled && (
        <TaskRowGroup
          title="Unscheduled"
          tasks={unscheduledTasks}
          lists={lists}
          onToggle={onToggle}
          onOpen={onOpenUnscheduled}
          emptyLabel="Nothing unscheduled."
        />
      )}
    </div>
  );
}

export default DayTodoPanel;
