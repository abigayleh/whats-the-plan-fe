import { useMemo, useState } from 'react';
import CalendarWeekly from '../calendar/CalendarWeekly';
import CalendarDaily from '../calendar/CalendarDaily';
import DayTodoPanel from '../calendar/DayTodoPanel';
import PlanItemModal from '../items/PlanItemModal';
import useAppData from '../../hooks/useAppData';
import useItineraryItems from '../../hooks/useItineraryItems';
import useItineraryTasks from '../../hooks/useItineraryTasks';
import useResizableSplit from '../../hooks/useResizableSplit';
import {
  getTaskDay, isTaskOnDay, isTaskTimed, isTaskOverdue,
} from '../../utils/tasks';
import {
  addDays, startOfDay, getWeekDays, formatWeekRange, formatFullDate,
} from '../../utils/date';

const DAY_MS = 86400000;
const VIEWS = [{ key: 'week', label: 'Week' }, { key: 'day', label: 'Day' }];

// The itinerary's Plan tab: week + day views (no month) reusing the calendar components,
// scoped to the itinerary's own list of to-dos. The day view grows a map in Phase 4.
function ItineraryPlan({ itinerary }) {
  const { groups, personalSpace } = useAppData();
  const [view, setView] = useState('week');
  const [focusDate, setFocusDate] = useState(() => itinerary.startDate || new Date());
  const [planItemModal, setPlanItemModal] = useState(null);
  const dayPanel = useResizableSplit('itinerary-day-panel-width', 320);

  const range = useMemo(() => {
    const days = view === 'week' ? getWeekDays(focusDate) : [focusDate];
    const start = startOfDay(days[0]);
    const end = new Date(startOfDay(days[days.length - 1]).getTime() + DAY_MS);
    return { startISO: start.toISOString(), endISO: end.toISOString() };
  }, [view, focusDate]);

  const { items, refetch } = useItineraryItems(itinerary.id, range.startISO, range.endISO);
  const {
    listTasks, saveItem, deleteItem, toggleStatus, moveItem,
  } = useItineraryTasks(itinerary.listId);

  const colorKey = itinerary.colorLabel || 'primary';
  const decorate = useMemo(() => (t) => ({ ...t, colorKey }), [colorKey]);

  const baseVisibleItems = useMemo(() => items.map(decorate), [items, decorate]);
  // Date-only to-dos due on the focus day; timed ones render on the timeline instead.
  const todayTasks = useMemo(
    () => baseVisibleItems.filter((it) => it.origin === 'task' && isTaskOnDay(it, focusDate) && !isTaskTimed(it)),
    [baseVisibleItems, focusDate],
  );
  // No-date and overdue to-dos come straight from the raw list (never in the ranged occurrences).
  const unscheduledTasks = useMemo(
    () => listTasks.filter((t) => getTaskDay(t) == null).map(decorate),
    [listTasks, decorate],
  );
  const overdueTasks = useMemo(
    () => listTasks.filter((t) => isTaskOverdue(t)).map(decorate),
    [listTasks, decorate],
  );

  // A single-list array so PlanItemModal lands new to-dos in the itinerary's own list.
  const itineraryList = useMemo(() => ({
    id: itinerary.listId, name: itinerary.title, groupId: itinerary.groupId, isSystem: false, isDefault: false,
  }), [itinerary.listId, itinerary.title, itinerary.groupId]);

  function itemById(id) {
    const found = items.find((it) => it.id === id);
    if (found) return found;
    const task = listTasks.find((t) => t.id === id);
    return task ? { origin: 'task', id: task.id, sourceId: task.id } : null;
  }
  const taskOf = (item) => listTasks.find((t) => t.id === item.sourceId);

  function openItem(item) {
    const task = taskOf(item);
    if (task) setPlanItemModal({ mode: 'edit', item: task });
  }
  const openTaskById = (task) => openItem({ origin: 'task', sourceId: task.id });

  async function toggleItemStatus(id) {
    const item = itemById(id);
    if (!item) return;
    try { await toggleStatus(item); refetch(); } catch { /* ignore */ }
  }

  function createTaskAt(day, hour, minute = 0) {
    const start = new Date(day);
    start.setHours(hour, minute, 0, 0);
    setPlanItemModal({ mode: 'new', seed: { scheduledStart: start, scheduledEnd: new Date(start.getTime() + DAY_MS / 24) } });
  }

  async function handleMoveItem(id, opts) {
    const item = itemById(id);
    if (!item) return;
    try { await moveItem(item, opts); refetch(); } catch { /* ignore */ }
  }

  async function handleItemSubmit(payload, currentItem) {
    const result = await saveItem(currentItem, payload);
    // eslint-disable-next-line no-alert
    if (result.attachmentError) window.alert(`To-do saved, but its files didn't upload: ${result.attachmentError}`);
    refetch();
    return result;
  }

  async function handleItemDelete(item) {
    await deleteItem(item);
    setPlanItemModal(null);
    refetch();
  }

  async function handlePushToTomorrow(item) {
    const task = taskOf(item) ?? item;
    if (isTaskTimed(task)) {
      await moveItem(item, {
        day: addDays(task.scheduledStart, 1),
        hour: task.scheduledStart.getHours(),
        minute: task.scheduledStart.getMinutes(),
        timed: true,
      });
    } else {
      await saveItem(task, { dueDate: addDays(getTaskDay(task) ?? new Date(), 1) });
    }
    setPlanItemModal(null);
    refetch();
  }
  async function handleChipPushToTomorrow(id) {
    const item = itemById(id);
    if (item) await handlePushToTomorrow(item);
  }

  function handleSelectDay(day) {
    setFocusDate(day);
    setView('day');
  }
  function handlePrev() { setFocusDate((d) => addDays(d, view === 'week' ? -7 : -1)); }
  function handleNext() { setFocusDate((d) => addDays(d, view === 'week' ? 7 : 1)); }
  function openNewTodo() { setPlanItemModal({ mode: 'new', seed: { dueDate: focusDate } }); }

  const label = view === 'week' ? formatWeekRange(getWeekDays(focusDate)) : formatFullDate(focusDate);

  return (
    <div className="itinerary-plan">
      <div className="calendar-toolbar">
        <button type="button" className="calendar-toolbar__nav" onClick={handlePrev} aria-label="Previous">‹</button>
        <div className="calendar-toolbar__label-group">
          <span className="calendar-toolbar__label">{label}</span>
          <button type="button" className="calendar-toolbar__today" onClick={() => setFocusDate(itinerary.startDate || new Date())}>
            Trip start
          </button>
        </div>
        <button type="button" className="calendar-toolbar__nav" onClick={handleNext} aria-label="Next">›</button>
      </div>

      <div className="calendar-filters">
        <div className="view-switcher">
          {VIEWS.map(({ key, label: viewLabel }) => (
            <button
              key={key}
              type="button"
              className={`view-switcher__option${view === key ? ' view-switcher__option--active' : ''}`}
              onClick={() => setView(key)}
            >
              {viewLabel}
            </button>
          ))}
        </div>
        <button type="button" className="filter-toggle calendar-view__add-todo" onClick={openNewTodo}>
          + Add to-do
        </button>
      </div>

      <div className="calendar-view">
        {view === 'week' && (
          <CalendarWeekly
            focusDate={focusDate}
            tasks={baseVisibleItems}
            onSelectDay={handleSelectDay}
            onToggleTask={toggleItemStatus}
            onOpenTask={openItem}
            onCreateTask={createTaskAt}
            onMoveTask={handleMoveItem}
            onPushToTomorrow={handleChipPushToTomorrow}
          />
        )}
        {view === 'day' && (
          <div
            className="calendar-day-split"
            ref={dayPanel.containerRef}
            style={{ '--day-panel-width': `${dayPanel.width}px` }}
          >
            <CalendarDaily
              focusDate={focusDate}
              tasks={baseVisibleItems}
              onToggleTask={toggleItemStatus}
              onOpenTask={openItem}
              onCreateTask={createTaskAt}
              onMoveTask={handleMoveItem}
              onPushToTomorrow={handleChipPushToTomorrow}
            />
            <button
              type="button"
              className="calendar-day-split__resizer"
              onMouseDown={dayPanel.startResize}
              aria-label="Resize to-do panel"
            />
            <DayTodoPanel
              overdueTasks={overdueTasks}
              todayTasks={todayTasks}
              unscheduledTasks={unscheduledTasks}
              lists={[itineraryList]}
              onToggle={toggleItemStatus}
              onOpenOverdue={openTaskById}
              onOpenToday={openItem}
              onOpenUnscheduled={openTaskById}
              showUnscheduled
            />
          </div>
        )}
      </div>

      {planItemModal && (
        <PlanItemModal
          lists={[itineraryList]}
          groups={groups}
          personalSpace={personalSpace}
          defaultListId={itinerary.listId}
          defaultOrigin="task"
          defaultSchedule={planItemModal.mode === 'new' ? planItemModal.seed : null}
          item={planItemModal.mode === 'edit' ? planItemModal.item : null}
          onClose={() => setPlanItemModal(null)}
          onSave={handleItemSubmit}
          onDelete={handleItemDelete}
        />
      )}
    </div>
  );
}

export default ItineraryPlan;