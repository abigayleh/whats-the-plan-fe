import TaskRowGroup from './TaskRowGroup';

// Todos-mode's full-width list: every to-do the user can see, grouped Overdue / Scheduled /
// Unscheduled. Unlike DayTodoPanel it isn't scoped to "today" or the currently browsed range —
// all three buckets are read straight off the full task list (see CalendarPage).
function TodosListPanel({
  overdueTasks, scheduledTasks, unscheduledTasks, lists, onToggle, onOpen,
}) {
  return (
    <div className="day-todo-panel todos-list-panel">
      {overdueTasks.length > 0 && (
        <TaskRowGroup
          title="Overdue"
          tasks={overdueTasks}
          lists={lists}
          onToggle={onToggle}
          onOpen={onOpen}
          emptyLabel="Nothing overdue."
        />
      )}
      <TaskRowGroup
        title="Scheduled"
        tasks={scheduledTasks}
        lists={lists}
        onToggle={onToggle}
        onOpen={onOpen}
        emptyLabel="Nothing scheduled."
      />
      <TaskRowGroup
        title="Unscheduled"
        tasks={unscheduledTasks}
        lists={lists}
        onToggle={onToggle}
        onOpen={onOpen}
        emptyLabel="Nothing unscheduled."
      />
    </div>
  );
}

export default TodosListPanel;
