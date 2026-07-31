import TaskRowGroup from './TaskRowGroup';
import { formatFullDate } from '../../utils/date';

// Phone-only companion to the month grid. The grid can only afford coloured dots, so this
// says what those dots actually are for the day you tapped, without leaving the month.
function MonthDayPanel({
  day, tasks, lists, onToggle, onOpen, onOpenDay,
}) {
  return (
    <div className="month-day-panel">
      <div className="month-day-panel__header">
        <h2 className="month-day-panel__title">{formatFullDate(day)}</h2>
        <button type="button" className="button button--ghost button--sm" onClick={onOpenDay}>
          Open day
        </button>
      </div>
      <TaskRowGroup
        title=""
        tasks={tasks}
        lists={lists}
        onToggle={onToggle}
        onOpen={onOpen}
        emptyLabel="Nothing planned."
      />
    </div>
  );
}

export default MonthDayPanel;