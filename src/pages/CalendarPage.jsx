import { useMemo, useState } from 'react';
import { CalendarIcon, ListsIcon, PlusIcon } from '../components/layout/icons';
import CalendarViewSwitcher from '../components/calendar/CalendarViewSwitcher';
import CalendarContentToggle from '../components/calendar/CalendarContentToggle';
import ToggleChips from '../components/calendar/ToggleChips';
import CalendarMonthly from '../components/calendar/CalendarMonthly';
import CalendarWeekly from '../components/calendar/CalendarWeekly';
import CalendarDaily from '../components/calendar/CalendarDaily';
import UnscheduledPanel from '../components/calendar/UnscheduledPanel';
import PlanItemModal from '../components/items/PlanItemModal';
import useAppData from '../hooks/useAppData';
import usePlanItems from '../hooks/usePlanItems';
import useLocalStorageState from '../hooks/useLocalStorageState';
import useLocalStorageDate from '../hooks/useLocalStorageDate';
import useLocalStorageSet from '../hooks/useLocalStorageSet';
import useCalendarItems from '../hooks/useCalendarItems';
import {
  getGroupColorKey, getListColorKey, getTaskColorKey, getTaskIconKey, getTaskDay, isTaskTimed,
} from '../utils/tasks';
import {
  addDays, addMonths, startOfDay, getMonthGrid, getWeekDays,
  formatFullDate, formatMonthYear, formatWeekRange,
} from '../utils/date';

const DAY_MS = 86400000;

function CalendarPage() {
  const {
    groups, lists, tasks, currentUser, personalSpace,
  } = useAppData();
  const { saveItem, deleteItem, moveItem, toggleStatus } = usePlanItems();
  const [view, setView] = useLocalStorageState('calendar-view', 'month');
  const [contentFilter, setContentFilter] = useLocalStorageState('calendar-content-filter', 'all');
  const [onlyMine, setOnlyMine] = useLocalStorageState('calendar-only-mine', false);
  const [showCompleted, setShowCompleted] = useLocalStorageState('calendar-show-completed', true);
  const [showUnscheduledTray, setShowUnscheduledTray] = useLocalStorageState('calendar-show-unscheduled', false);
  const [focusDate, setFocusDate] = useLocalStorageDate('calendar-focus-date', new Date());
  const [hiddenGroupIds, setHiddenGroupIds] = useLocalStorageSet('calendar-hidden-groups');
  const [hiddenListIds, setHiddenListIds] = useLocalStorageSet('calendar-hidden-lists');
  // null | { mode:'new', seed, defaultOrigin } | { mode:'edit', item }
  const [planItemModal, setPlanItemModal] = useState(null);

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

  const listOptions = useMemo(() => lists
    .filter((l) => !l.isSystem)
    .map((l) => ({ ...l, colorKey: getListColorKey(l, groups, personalSpace) })),
  [lists, groups, personalSpace]);
  const activeListIds = useMemo(
    () => new Set(listOptions.filter((l) => !hiddenListIds.has(l.id)).map((l) => l.id)),
    [listOptions, hiddenListIds],
  );

  const filteredItems = useMemo(() => items
    .filter((item) => {
      // 'Events' = calendar-only items (origin 'event', no list); 'To-Dos' = list-backed items.
      if (contentFilter === 'events' && item.origin !== 'event') return false;
      if (contentFilter === 'tasks' && item.origin === 'event') return false;
      // Filter on what's explicitly hidden: items load independently of groups/lists,
      // so anything not yet known must stay visible rather than blink out.
      if (hiddenGroupIds.has(item.groupId ?? null)) return false;
      if (item.listId && hiddenListIds.has(item.listId)) return false;
      if (!showCompleted && item.status === 'done') return false;
      if (onlyMine && item.assignedToId && item.assignedToId !== currentUser.id) return false;
      return true;
    })
    .map((item) => ({ ...item, colorKey: getGroupColorKey(item.groupId, groups, personalSpace) })),
  [items, groups, personalSpace, hiddenGroupIds, hiddenListIds, contentFilter, onlyMine, showCompleted, currentUser]);

  // To-dos with no date at all never appear in `items` (the calendar only fetches within a
  // date range), so they're read straight from useAppData and filtered the same way as above.
  const unscheduledTasks = useMemo(() => tasks
    .filter((task) => getTaskDay(task) == null)
    .filter((task) => {
      if (hiddenGroupIds.has(task.groupId ?? null)) return false;
      if (task.listId && hiddenListIds.has(task.listId)) return false;
      if (onlyMine && task.assignedToId && task.assignedToId !== currentUser.id) return false;
      return true;
    })
    .map((task) => ({
      ...task,
      colorKey: getTaskColorKey(task, lists, groups, personalSpace),
      icon: getTaskIconKey(task, lists),
    })),
  [tasks, lists, groups, personalSpace, hiddenGroupIds, hiddenListIds, onlyMine, currentUser]);

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

  function openNewTodo() {
    setPlanItemModal({ mode: 'new', defaultOrigin: 'task', seed: { dueDate: focusDate } });
  }

  const label = view === 'month'
    ? formatMonthYear(focusDate)
    : view === 'week'
      ? formatWeekRange(getWeekDays(focusDate))
      : formatFullDate(focusDate);

  // Day + "Both" gets its own split layout (#9); the toggle tray (#11) covers the rest —
  // week view, and day view when the split isn't already showing the panel. Neither applies
  // to month view or when to-dos are filtered out entirely.
  const showUnscheduledSplit = view === 'day' && contentFilter === 'all';
  const showUnscheduledTrayPanel = showUnscheduledTray && contentFilter !== 'events'
    && view !== 'month' && !showUnscheduledSplit;

  const dailyView = (
    <CalendarDaily
      focusDate={focusDate}
      tasks={filteredItems}
      onToggleTask={toggleItemStatus}
      onOpenTask={openItem}
      onCreateTask={createEventAt}
      onMoveTask={handleMoveItem}
    />
  );
  const unscheduledPanel = (
    <UnscheduledPanel
      tasks={unscheduledTasks}
      lists={lists}
      onToggle={toggleItemStatus}
      onOpen={(task) => openItem({ origin: 'task', sourceId: task.id })}
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

      {contentFilter !== 'events' && listOptions.length > 0 && (
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
        <CalendarContentToggle value={contentFilter} onChange={setContentFilter} />
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
          disabled={contentFilter === 'events'}
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
          <CalendarMonthly focusDate={focusDate} tasks={filteredItems} onSelectDay={handleSelectDay} />
        )}
        {view === 'week' && (
          <>
            <CalendarWeekly
              focusDate={focusDate}
              tasks={filteredItems}
              onSelectDay={handleSelectDay}
              onToggleTask={toggleItemStatus}
              onOpenTask={openItem}
              onCreateTask={createEventAt}
              onMoveTask={handleMoveItem}
            />
            {showUnscheduledTrayPanel && unscheduledPanel}
          </>
        )}
        {view === 'day' && showUnscheduledSplit && (
          <div className="calendar-day-split">
            {dailyView}
            {unscheduledPanel}
          </div>
        )}
        {view === 'day' && !showUnscheduledSplit && (
          <>
            {dailyView}
            {showUnscheduledTrayPanel && unscheduledPanel}
          </>
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
          onPushToTomorrow={planItemModal.mode === 'edit' ? handlePushToTomorrow : undefined}
        />
      )}
    </section>
  );
}

export default CalendarPage;
