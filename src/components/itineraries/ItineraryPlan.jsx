import { useEffect, useMemo, useState } from 'react';
import CalendarWeekly from '../calendar/CalendarWeekly';
import CalendarDaily from '../calendar/CalendarDaily';
import DayTodoPanel from '../calendar/DayTodoPanel';
import PlanItemModal from '../items/PlanItemModal';
import ItineraryDayMap from './ItineraryDayMap';
import useAppData from '../../hooks/useAppData';
import useItineraryItems from '../../hooks/useItineraryItems';
import useItineraryTasks from '../../hooks/useItineraryTasks';
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

  const range = useMemo(() => {
    const days = view === 'week' ? getWeekDays(focusDate) : [focusDate];
    const start = startOfDay(days[0]);
    const end = new Date(startOfDay(days[days.length - 1]).getTime() + DAY_MS);
    return { startISO: start.toISOString(), endISO: end.toISOString() };
  }, [view, focusDate]);

  // Trip bounds (day granularity) drive week-view disabling and nav clamping.
  const tripStart = useMemo(() => (itinerary.startDate ? startOfDay(itinerary.startDate) : null), [itinerary.startDate]);
  const tripEnd = useMemo(() => (itinerary.endDate ? startOfDay(itinerary.endDate) : null), [itinerary.endDate]);
  const isDayDisabled = useMemo(() => {
    if (!tripStart || !tripEnd) return undefined;
    return (day) => { const d = startOfDay(day); return d < tripStart || d > tripEnd; };
  }, [tripStart, tripEnd]);
  const clampToTrip = (date) => {
    if (!tripStart || !tripEnd) return date;
    const d = startOfDay(date);
    if (d < tripStart) return itinerary.startDate;
    if (d > tripEnd) return itinerary.endDate;
    return date;
  };

  // If the trip's dates change (edited in the header), pull the focus back in range so
  // the view never sits on a now-excluded day.
  useEffect(() => {
    if (!tripStart || !tripEnd) return;
    setFocusDate((d) => {
      const day = startOfDay(d);
      if (day < tripStart) return itinerary.startDate;
      if (day > tripEnd) return itinerary.endDate;
      return d;
    });
  }, [tripStart, tripEnd, itinerary.startDate, itinerary.endDate]);

  const { items, refetch } = useItineraryItems(itinerary.id, range.startISO, range.endISO);
  const {
    listTasks, saveItem, deleteItem, skipOccurrence, toggleStatus, moveItem,
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

  // Map pins for the day: located timed to-dos numbered in time order, located untimed
  // same-day ones as open (un-numbered) pins. To-dos without a location aren't pinned.
  const mapPins = useMemo(() => {
    const toPin = (it, order) => ({
      id: it.id, title: it.title, lat: it.location.lat, lng: it.location.lng, order,
    });
    const numbered = baseVisibleItems
      .filter((it) => it.origin === 'task' && isTaskOnDay(it, focusDate) && isTaskTimed(it) && it.location)
      .sort((a, b) => a.scheduledStart - b.scheduledStart)
      .map((it, i) => toPin(it, i + 1));
    const open = todayTasks.filter((it) => it.location).map((it) => toPin(it, null));
    return [...numbered, ...open];
  }, [baseVisibleItems, todayTasks, focusDate]);

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

  async function handleSkipOccurrence(item, day) {
    await skipOccurrence(item, day);
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
    setFocusDate(clampToTrip(day));
    setView('day');
  }
  // Switching to the day view lands on a date inside the trip, never an out-of-range week day.
  function switchView(key) {
    if (key === 'day') setFocusDate((d) => clampToTrip(d));
    setView(key);
  }

  // Nav is bounded to the trip: prev/next stop at the first/last day (day view) or the
  // first/last week that still holds an in-range day (week view).
  const navPrevDisabled = useMemo(() => {
    if (!tripStart) return false;
    const edge = view === 'day' ? startOfDay(focusDate) : startOfDay(getWeekDays(focusDate)[0]);
    return edge <= tripStart;
  }, [view, focusDate, tripStart]);
  const navNextDisabled = useMemo(() => {
    if (!tripEnd) return false;
    const days = getWeekDays(focusDate);
    const edge = view === 'day' ? startOfDay(focusDate) : startOfDay(days[days.length - 1]);
    return edge >= tripEnd;
  }, [view, focusDate, tripEnd]);

  function handlePrev() { if (!navPrevDisabled) setFocusDate((d) => addDays(d, view === 'week' ? -7 : -1)); }
  function handleNext() { if (!navNextDisabled) setFocusDate((d) => addDays(d, view === 'week' ? 7 : 1)); }
  function openNewTodo() { setPlanItemModal({ mode: 'new', seed: { dueDate: focusDate } }); }

  const label = view === 'week' ? formatWeekRange(getWeekDays(focusDate)) : formatFullDate(focusDate);

  return (
    <div className="itinerary-plan">
      <div className="calendar-toolbar">
        <button type="button" className="calendar-toolbar__nav" onClick={handlePrev} disabled={navPrevDisabled} aria-label="Previous">‹</button>
        <div className="calendar-toolbar__label-group">
          <span className="calendar-toolbar__label">{label}</span>
          <button type="button" className="calendar-toolbar__today" onClick={() => setFocusDate(itinerary.startDate || new Date())}>
            {itinerary.startDate ? 'Trip start' : 'Today'}
          </button>
        </div>
        <button type="button" className="calendar-toolbar__nav" onClick={handleNext} disabled={navNextDisabled} aria-label="Next">›</button>
      </div>

      <div className="calendar-filters">
        <div className="view-switcher">
          {VIEWS.map(({ key, label: viewLabel }) => (
            <button
              key={key}
              type="button"
              className={`view-switcher__option${view === key ? ' view-switcher__option--active' : ''}`}
              onClick={() => switchView(key)}
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
            isDayDisabled={isDayDisabled}
            onSelectDay={handleSelectDay}
            onToggleTask={toggleItemStatus}
            onOpenTask={openItem}
            onCreateTask={createTaskAt}
            onMoveTask={handleMoveItem}
            onPushToTomorrow={handleChipPushToTomorrow}
          />
        )}
        {view === 'day' && (
          <div className="itinerary-day">
            <div className="itinerary-day__main">
              <CalendarDaily
                focusDate={focusDate}
                tasks={baseVisibleItems}
                onToggleTask={toggleItemStatus}
                onOpenTask={openItem}
                onCreateTask={createTaskAt}
                onMoveTask={handleMoveItem}
                onPushToTomorrow={handleChipPushToTomorrow}
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
            <div className="itinerary-day__map">
              <ItineraryDayMap pins={mapPins} />
            </div>
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
          onSkipOccurrence={handleSkipOccurrence}
        />
      )}
    </div>
  );
}

export default ItineraryPlan;
