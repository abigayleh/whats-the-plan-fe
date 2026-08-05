import TaskRow from '../lists/TaskRow';

// One labeled block of draggable to-do rows — shared by UnscheduledPanel (week/day tray)
// and DayTodoPanel (day view's Today/Unscheduled split) so neither duplicates this markup.
function TaskRowGroup({
  title, tasks, lists, onToggle, onOpen, emptyLabel,
}) {
  return (
    <section className="task-row-group">
      {title && <h3 className="task-row-group__title">{title}</h3>}
      {tasks.length === 0 && <p className="task-row-group__empty">{emptyLabel}</p>}
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          lists={lists}
          day={task.shownDay}
          onToggle={onToggle}
          onClick={onOpen}
          draggable
        />
      ))}
    </section>
  );
}

export default TaskRowGroup;
