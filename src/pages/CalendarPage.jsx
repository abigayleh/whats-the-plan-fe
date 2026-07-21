import { useCallback, useMemo, useState } from 'react';
import { CalendarIcon, ListsIcon, PlusIcon } from '../components/layout/icons';
import CalendarViewSwitcher from '../components/calendar/CalendarViewSwitcher';
import CalendarContentToggle from '../components/calendar/CalendarContentToggle';
import ToggleChips from '../components/calendar/ToggleChips';
import CalendarMonthly from '../components/calendar/CalendarMonthly';
import CalendarWeekly from '../components/calendar/CalendarWeekly';
import CalendarDaily from '../components/calendar/CalendarDaily';
import UnscheduledPanel from '../components/calendar/UnscheduledPanel';
import DayTodoPanel from '../components/calendar/DayTodoPanel';
import WeekTodosView from '../components/calendar/WeekTodosView';
import PlanItemModal from '../components/items/PlanItemModal';
import useAppData from '../hooks/useAppData';
import usePlanItems from '../hooks/usePlanItems';
import useLocalStorageState from '../hooks/useLocalStorageState';
import useLocalStorageDate from '../hooks/useLocalStorageDate';
import useLocalStorageSet from '../hooks/useLocalStorageSet';
import useCalendarItems from '../hooks/useCalendarItems';
import useResizableSplit from '../hooks/useResizableSplit';
import {
  getListColorKey, getTaskColorKey, getTaskIconKey, getTaskDay, isTaskOnDay, isTaskTimed, isTaskOverdue,
} from '../utils/tasks';
import {
  addDays, addMonths, startOfDay, getMonthGrid, getWeekDays,
  formatFullDate, formatMonthYear, formatWeekRange,
} from '../utils/date';

const DAY_MS = 86400000;
// Pre-redefinition stored values ('events'/'tasks') migrate to their closest new meaning:
// 'events' hid all to-dos → closest today is 'calendar' (grid-only); 'tasks' → 'todos' (list-only).
const LEGACY_CONTENT_FILTER = { events: 'calendar', tasks: 'todos' };

function CalendarPage() {
  const {
    groups, lists, tasks, currentUser, personalSpace,
  } = useAppData();
  const { saveItem, deleteItem, moveItem, toggleStatus } = usePlanItems();
  const [view, setView] = useLocalStorageState('calendar-view', 'month');
  const [contentFilterRaw, setContentFilter] = useLocalStorageState('calendar-content-filter', 'all');
  const contentFilter = LEGACY_CONTENT_FILTER[contentFilterRaw] ?? contentFilterRaw;
  const [onlyMine, setOnlyMine] = useLocalStorageState('calendar-only-mine', false);
  const [showCompleted, setShowCompleted] = useLocalStorageState('calendar-show-completed', true);
  const [showUnscheduledTray, setShowUnscheduledTray] = useLocalStorageState('calendar-show-unscheduled', false);
  const [focusDate, setFocusDate] = useLocalStorageDate('calendar-focus-date', new Date());
  const [hiddenGroupIds, setHiddenGroupIds] = useLocalStorageSet('calendar-hidden-groups');
  const [hiddenListIds, setHiddenListIds] = useLocalStorageSet('calendar-hidden-lists');
  // null | { mode:'new', seed, defaultOrigin } | { mode:'edit', item }
  const [planItemModal, setPlanItemModal] = useState(null);
  const dayPanel = useResizableSplit('calendar-day-panel-width', 384);

  const range = useMemo(() => {
    let days;
    if (view === 'month') days = getMonthGrid(focusDate);
    else if (view === 'week') days = getWeekDays(focusDate);
    else days = [focusDate];
    const start = startOfDay(days[0]);
    const end = new Date(startOfDay(days[days.length - 1]).getTime() + DAY_MS);
    return { startISO: start.toISOString(), endISO: end.toISOString() };
  }, [view, focusDate]);

  const { items, refetch } = useCalendarItems(range.startISO, range.endISO);

  const groupOptions = useMemo(() => [{ id: null, ...personalSpace }, ...groups], [groups, personalSpace]);
  const activeGroupIds = useMemo(
    () => new Set(groupOptions.filter((g) => !hiddenGroupIds.has(g.id)).map((g) => g.id)),
    [groupOptions, hiddenGroupIds],
  );

  // Which lists have at least one scheduled item in the currently-fetched range — computed off
  // the raw `items` (not baseVisibleItems) so a list's own hidden state can't hide it from itself.
  // Scheduled items always show on the calendar, so no per-list opt-out applies here.
  const scheduledListIds = useMemo(() => new Set(items
    .filter((item) => item.listId)
    .map((item) => item.listId)),
  [items]);

  // Which lists have at least one unscheduled to-do that's allowed to surface on the calendar
  // (the list hasn't opted out via `showUnscheduledOnCalendar: false`). Independent of the
  // page-level "Show unscheduled to-dos" toggle — that only controls tray/panel visibility.
  const listsWithShownUnscheduled = useMemo(() => new Set(tasks
    .filter((task) => task.listId && getTaskDay(task) == null)
    .filter((task) => {
      const list = lists.find((l) => l.id === task.listId);
      return !(list && list.showUnscheduledOnCalendar === false);
    })
    .map((task) => task.listId)),
  [tasks, lists]);

  // A list chip appears only if it has something to show in the current view: scheduled items
  // in range, or shown unscheduled to-dos. Not affected by `showUnscheduledTray`.
  const listOptions = useMemo(() => lists
    .filter((l) => !l.isSystem)
    // Hide a list once its owning group is unselected — no point offering to toggle it alone.
    .filter((l) => !hiddenGroupIds.has(l.groupId ?? null))
    .filter((l) => scheduledListIds.has(l.id) || listsWithShownUnscheduled.has(l.id))
    .map((l) => ({ ...l, colorKey: getListColorKey(l, groups, personalSpace) })),
  [lists, groups, personalSpace, hiddenGroupIds, scheduledListIds, listsWithShownUnscheduled]);
  const activeListIds = useMemo(
    () => new Set(listOptions.filter((l) => !hiddenListIds.has(l.id)).map((l) => l.id)),
    [listOptions, hiddenListIds],
  );

  // A to-do's group lives on its list (to-do rows carry no groupId of their own); events
  // carry their own. Used so the group toggle catches list-backed to-dos everywhere.
  const groupIdOf = useCallback((item) => (
    item.origin === 'task' && item.listId
      ? (lists.find((l) => l.id === item.listId)?.groupId ?? null)
      : (item.groupId ?? null)
  ), [lists]);

  // Grid items shared by month/week/day: events + scheduled to-dos together (the split between
  // 'Both' and 'Calendar' modes is only about which side panels render, not what's on the grid).
  const baseVisibleItems = useMemo(() => items
    .filter((item) => {
      // Filter on what's explicitly hidden: items load independently of groups/lists,
      // so anything not yet known must stay visible rather than blink out.
      if (hiddenGroupIds.has(groupIdOf(item))) return false;
      if (item.listId && hiddenListIds.has(item.listId)) return false;
      if (!showCompleted && item.status === 'done') return false;
      if (onlyMine && item.assignedToId && item.assignedToId !== currentUser.id) return false;
      return true;
    })
    // List color wins when the item's list has one set; otherwise falls back to group color
    // (bare events, with no list, always take this path).
    .map((item) => ({ ...item, colorKey: getTaskColorKey(item, lists, groups, personalSpace) })),
  [items, lists, groups, personalSpace, hiddenGroupIds, hiddenListIds, onlyMine, showCompleted, currentUser, groupIdOf]);

  // Today's to-dos for the day-view panel: date-only (no time) to-dos due today. Timed to-dos
  // render on the day timeline instead (see CalendarDaily), so they're excluded here.
  const todayTasks = useMemo(
    () => baseVisibleItems.filter(
      (item) => item.origin === 'task' && isTaskOnDay(item, focusDate) && !isTaskTimed(item),
    ),
    [baseVisibleItems, focusDate],
  );

  // Group/list/assignee visibility shared by every range-independent to-do bucket below
  // (overdue, scheduled, unscheduled) — done-ness and list-level opt-outs differ per bucket.
  const isTaskVisible = useCallback((task) => {
    if (hiddenGroupIds.has(groupIdOf(task))) return false;
    if (task.listId && hiddenListIds.has(task.listId)) return false;
    if (onlyMine && task.assignedToId && task.assignedToId !== currentUser.id) return false;
    return true;
  }, [hiddenGroupIds, hiddenListIds, onlyMine, currentUser, groupIdOf]);

  const decorateTask = useCallback((task) => ({
    ...task,
    colorKey: getTaskColorKey(task, lists, groups, personalSpace),
    icon: getTaskIconKey(task, lists),
  }), [lists, groups, personalSpace]);

  // To-dos with no date at all never appear in `items` (the calendar only fetches within a
  // date range), so they're read straight from useAppData and filtered the same way as above.
  const unscheduledTasks = useMemo(() => tasks
    .filter((task) => getTaskDay(task) == null)
    .filter((task) => {
      if (!showCompleted && task.status === 'done') return false;
      if (!isTaskVisible(task)) return false;
      // A list can hide its unscheduled to-dos from the calendar.
      const list = task.listId ? lists.find((l) => l.id === task.listId) : null;
      if (list && list.showUnscheduledOnCalendar === false) return false;
      return true;
    })
    .map(decorateTask),
  [tasks, lists, isTaskVisible, showCompleted, decorateTask]);

  // Past-due, incomplete to-dos surfaced above Today in the day panel (and above Scheduled in
  // Todos-list mode). Read from all tasks (they may be due before the fetched range).
  const overdueTasks = useMemo(() => tasks
    .filter((task) => isTaskOverdue(task) && isTaskVisible(task))
    .map(decorateTask),
  [tasks, isTaskVisible, decorateTask]);

  // Falls back to a raw (unscheduled) task when dragging it in from UnscheduledPanel, since
  // those rows carry the real task id rather than a calendar occurrence id.
  function itemById(id) {
    const found = items.find((it) => it.id === id);
    if (found) return found;
    const task = tasks.find((t) => t.id === id);
    return task ? { origin: 'task', id: task.id, sourceId: task.id } : null;
  }
  // Calendar occurrences of to-dos are lightweight; the real row carries subtasks/attachments.
  const taskOf = (item) => tasks.find((t) => t.id === item.sourceId);

  const toggleIn = (setHidden) => (id) => setHidden((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  const toggleGroup = toggleIn(setHiddenGroupIds);
  const toggleList = toggleIn(setHiddenListIds);

  function handlePrev() {
    if (view === 'month') setFocusDate((d) => addMonths(d, -1));
    else if (view === 'week') setFocusDate((d) => addDays(d, -7));
    else setFocusDate((d) => addDays(d, -1));
  }

  function handleNext() {
    if (view === 'month') setFocusDate((d) => addMonths(d, 1));
    else if (view === 'week') setFocusDate((d) => addDays(d, 7));
    else setFocusDate((d) => addDays(d, 1));
  }

  function handleSelectDay(day) {
    setFocusDate(day);
    setView('day');
  }

  async function toggleItemStatus(id) {
    const item = itemById(id);
    if (!item) return;
    try {
      await toggleStatus(item);
      refetch();
    } catch { /* ignore */ }
  }

  function openItem(item) {
    if (item.origin === 'event') {
      setPlanItemModal({ mode: 'edit', item });
      return;
    }
    const task = taskOf(item);
    if (task) setPlanItemModal({ mode: 'edit', item: task });
  }

  // Rows sourced straight from `tasks` (overdue/scheduled/unscheduled buckets) carry the real
  // task id rather than a calendar-occurrence id, so wrap it into the shape openItem expects.
  const openTaskById = (task) => openItem({ origin: 'task', sourceId: task.id });

  function createEventAt(day, hour, minute = 0) {
    const start = new Date(day);
    start.setHours(hour, minute, 0, 0);
    setPlanItemModal({
      mode: 'new',
      defaultOrigin: 'event',
      seed: { scheduledStart: start, scheduledEnd: new Date(start.getTime() + 60 * 60000) },
    });
  }

  async function handleMoveItem(id, {
    day, hour, minute = 0, timed,
  }) {
    const item = itemById(id);
    if (!item) return;
    try {
      await moveItem(item, {
        day, hour, minute, timed,
      });
      refetch();
    } catch { /* ignore */ }
  }

  // The modal autosaves per-field and tracks its own created-item state, so it passes back
  // whichever item it's currently backed by (null until first save) rather than us tracking it.
  async function handleItemSubmit(payload, currentItem) {
    const result = await saveItem(currentItem, payload);
    // eslint-disable-next-line no-alert
    if (result.attachmentError) window.alert(`To-do created, but its files didn't upload: ${result.attachmentError}`);
    refetch();
    return result;
  }

  async function handleItemDelete(item) {
    await deleteItem(item);
    setPlanItemModal(null);
    refetch();
  }

  // Shifts a single item forward one day, keeping its clock time (if any). Callers must
  // guard recurring items — a single-occurrence shift would otherwise rewrite the whole series.
  async function handlePushToTomorrow(item) {
    if (isTaskTimed(item)) {
      const nextDay = addDays(item.scheduledStart, 1);
      await moveItem(item, {
        day: nextDay,
        hour: item.scheduledStart.getHours(),
        minute: item.scheduledStart.getMinutes(),
        timed: true,
      });
    } else {
      const currentDay = getTaskDay(item) ?? new Date();
      await saveItem(item, { dueDate: addDays(currentDay, 1) });
    }
    setPlanItemModal(null);
    refetch();
  }

  // Calendar-chip counterpart of handlePushToTomorrow: chips only carry an occurrence id
  // (see itemById), so resolve it first — TaskChip itself disables the button for recurring items.
  async function handleChipPushToTomorrow(id) {
    const item = itemById(id);
    if (!item) return;
    await handlePushToTomorrow(item);
  }

  function openNewTodo() {
    setPlanItemModal({ mode: 'new', defaultOrigin: 'task', seed: { dueDate: focusDate } });
  }

  const label = view === 'month'
    ? formatMonthYear(focusDate)
    : view === 'week'
      ? formatWeekRange(getWeekDays(focusDate))
      : formatFullDate(focusDate);

  // The standalone tray only exists for week view, and only in 'Both' mode: 'Calendar' mode
  // shows no list panels at all, 'Todos' mode replaces the grid with its own full list instead.
  // Day view has its own "Unscheduled" section inside DayTodoPanel (also gated on showUnscheduledTray).
  const showUnscheduledTrayPanel = showUnscheduledTray && contentFilter === 'all' && view === 'week';

  const dailyView = (
    <CalendarDaily
      focusDate={focusDate}
      tasks={baseVisibleItems}
      onToggleTask={toggleItemStatus}
      onOpenTask={openItem}
      onCreateTask={createEventAt}
      onMoveTask={handleMoveItem}
      onPushToTomorrow={handleChipPushToTomorrow}
    />
  );
  const unscheduledPanel = (
    <UnscheduledPanel
      tasks={unscheduledTasks}
      lists={lists}
      onToggle={toggleItemStatus}
      onOpen={openTaskById}
    />
  );
  const weekTodosView = (
    <WeekTodosView
      focusDate={focusDate}
      tasks={baseVisibleItems}
      unscheduledTasks={unscheduledTasks}
      lists={lists}
      onToggle={toggleItemStatus}
      onOpen={openItem}
      onOpenUnscheduled={openTaskById}
    />
  );

  return (
    <section className="page">
      <div className="page__header">
        <span className="page__badge page__badge--coral">
          <CalendarIcon />
        </span>
        <h1 className="page__title">Calendar</h1>
      </div>

      <ToggleChips items={groupOptions} activeIds={activeGroupIds} onToggle={toggleGroup} />

      {listOptions.length > 0 && (
        <ToggleChips items={listOptions} activeIds={activeListIds} onToggle={toggleList} />
      )}

      <div className="calendar-toolbar">
        <button type="button" className="calendar-toolbar__nav" onClick={handlePrev} aria-label="Previous">‹</button>
        <div className="calendar-toolbar__label-group">
          <span className="calendar-toolbar__label">{label}</span>
          <button type="button" className="calendar-toolbar__today" onClick={() => setFocusDate(new Date())}>
            Today
          </button>
        </div>
        <button type="button" className="calendar-toolbar__nav" onClick={handleNext} aria-label="Next">›</button>
      </div>

      <div className="calendar-filters">
        <CalendarViewSwitcher view={view} onChange={setView} />
        {view === 'week' && <CalendarContentToggle value={contentFilter} onChange={setContentFilter} />}
        <button
          type="button"
          className={`filter-toggle${onlyMine ? ' filter-toggle--active' : ''}`}
          onClick={() => setOnlyMine((prev) => !prev)}
          aria-pressed={onlyMine}
        >
          Only my tasks
        </button>
        <button
          type="button"
          className={`filter-toggle${showCompleted ? ' filter-toggle--active' : ''}`}
          onClick={() => setShowCompleted((prev) => !prev)}
          aria-pressed={showCompleted}
        >
          {showCompleted ? 'Hide completed' : 'Show completed'}
        </button>
        <button
          type="button"
          className={`filter-toggle${showUnscheduledTray ? ' filter-toggle--active' : ''}`}
          onClick={() => setShowUnscheduledTray((prev) => !prev)}
          aria-pressed={showUnscheduledTray}
          disabled={view !== 'day' && contentFilter !== 'all'}
        >
          Show unscheduled to-dos
        </button>
      </div>

      <div className="calendar-view">
        {view !== 'month' && (
          <button type="button" className="filter-toggle calendar-view__add-todo" onClick={openNewTodo}>
            + Add to-do
          </button>
        )}
        {view === 'month' && (
          <CalendarMonthly focusDate={focusDate} tasks={baseVisibleItems} onSelectDay={handleSelectDay} />
        )}
        {view === 'week' && (
          contentFilter === 'todos' ? weekTodosView : (
            <>
              <CalendarWeekly
                focusDate={focusDate}
                tasks={baseVisibleItems}
                showAllday={contentFilter === 'all'}
                onSelectDay={handleSelectDay}
                onToggleTask={toggleItemStatus}
                onOpenTask={openItem}
                onCreateTask={createEventAt}
                onMoveTask={handleMoveItem}
                onPushToTomorrow={handleChipPushToTomorrow}
              />
              {showUnscheduledTrayPanel && unscheduledPanel}
            </>
          )
        )}
        {view === 'day' && (
          <div
            className="calendar-day-split"
            ref={dayPanel.containerRef}
            style={{ '--day-panel-width': `${dayPanel.width}px` }}
          >
            {dailyView}
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
              lists={lists}
              onToggle={toggleItemStatus}
              onOpenOverdue={openTaskById}
              onOpenToday={openItem}
              onOpenUnscheduled={openTaskById}
              showUnscheduled={showUnscheduledTray}
            />
          </div>
        )}
      </div>

      <button
        type="button"
        className="floating-action-button floating-action-button--secondary"
        onClick={openNewTodo}
        aria-label="Add to-do"
        data-tooltip="Add to-do"
      >
        <ListsIcon />
      </button>

      <button
        type="button"
        className="floating-action-button"
        onClick={() => {
          const start = new Date(focusDate);
          start.setHours(9, 0, 0, 0);
          setPlanItemModal({
            mode: 'new',
            defaultOrigin: 'event',
            seed: { scheduledStart: start, scheduledEnd: new Date(start.getTime() + 60 * 60000) },
          });
        }}
        aria-label="Add event"
        data-tooltip="Add event"
      >
        <PlusIcon />
      </button>

      {planItemModal && (
        <PlanItemModal
          lists={lists}
          groups={groups}
          personalSpace={personalSpace}
          defaultOrigin={planItemModal.mode === 'new' ? planItemModal.defaultOrigin : undefined}
          defaultSchedule={planItemModal.mode === 'new' ? planItemModal.seed : null}
          item={planItemModal.mode === 'edit' ? planItemModal.item : null}
          onClose={() => setPlanItemModal(null)}
          onSave={handleItemSubmit}
          onDelete={handleItemDelete}
        />
      )}
    </section>
  );
}

export default CalendarPage;
