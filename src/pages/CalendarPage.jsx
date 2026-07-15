import { useMemo, useState } from 'react';
import { CalendarIcon, PlusIcon } from '../components/layout/icons';
import CalendarViewSwitcher from '../components/calendar/CalendarViewSwitcher';
import CalendarContentToggle from '../components/calendar/CalendarContentToggle';
import ToggleChips from '../components/calendar/ToggleChips';
import CalendarMonthly from '../components/calendar/CalendarMonthly';
import CalendarWeekly from '../components/calendar/CalendarWeekly';
import CalendarDaily from '../components/calendar/CalendarDaily';
import EventModal from '../components/calendar/EventModal';
import useAppData from '../hooks/useAppData';
import useLocalStorageState from '../hooks/useLocalStorageState';
import useCalendarItems from '../hooks/useCalendarItems';
import * as eventsApi from '../api/events';
import * as tasksApi from '../api/tasks';
import { getGroupColorKey } from '../utils/tasks';
import {
  addDays, addMonths, startOfDay, getMonthGrid, getWeekDays,
  formatFullDate, formatMonthYear, formatWeekRange,
} from '../utils/date';

const DAY_MS = 86400000;

function CalendarPage() {
  const { groups, currentUser, personalSpace } = useAppData();
  const [view, setView] = useLocalStorageState('calendar-view', 'month');
  const [contentFilter, setContentFilter] = useLocalStorageState('calendar-content-filter', 'all');
  const [onlyMine, setOnlyMine] = useLocalStorageState('calendar-only-mine', false);
  const [showCompleted, setShowCompleted] = useLocalStorageState('calendar-show-completed', true);
  const [focusDate, setFocusDate] = useState(new Date());
  const [hiddenGroupIds, setHiddenGroupIds] = useState(() => new Set());
  const [eventModal, setEventModal] = useState(null); // null | { mode:'new', start, end } | { mode:'edit', event }

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

  const filteredItems = useMemo(() => items
    .filter((item) => {
      if (contentFilter === 'events' && !item.isEvent) return false;
      if (contentFilter === 'tasks' && item.isEvent) return false;
      if (!activeGroupIds.has(item.groupId ?? null)) return false;
      if (!showCompleted && item.status === 'done') return false;
      if (onlyMine && item.assignedToId && item.assignedToId !== currentUser.id) return false;
      return true;
    })
    .map((item) => ({ ...item, colorKey: getGroupColorKey(item.groupId, groups, personalSpace) })),
  [items, groups, personalSpace, activeGroupIds, contentFilter, onlyMine, showCompleted, currentUser]);

  const itemById = (id) => items.find((it) => it.id === id);

  function toggleGroup(id) {
    setHiddenGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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
    if (!item || item.isEvent) return;
    try {
      await tasksApi.patchTask(item.listId, item.taskId, { status: item.status === 'done' ? 'TODO' : 'DONE' });
      refetch();
    } catch { /* ignore */ }
  }

  function openItem(item) {
    if (item.isEvent) setEventModal({ mode: 'edit', event: item });
  }

  function createEventAt(day, hour, minute = 0) {
    const start = new Date(day);
    start.setHours(hour, minute, 0, 0);
    setEventModal({ mode: 'new', start, end: new Date(start.getTime() + 60 * 60000) });
  }

  async function moveItem(id, {
    day, hour, minute = 0, timed,
  }) {
    const item = itemById(id);
    if (!item) return;
    try {
      if (item.isEvent && timed) {
        const duration = item.scheduledEnd - item.scheduledStart;
        const start = new Date(day);
        start.setHours(hour, minute, 0, 0);
        await eventsApi.update(item.eventId, {
          startAt: start.toISOString(),
          endAt: new Date(start.getTime() + duration).toISOString(),
        });
        refetch();
      } else if (!item.isEvent && !timed) {
        await tasksApi.patchTask(item.listId, item.taskId, { dueDate: startOfDay(day).toISOString() });
        refetch();
      }
    } catch { /* ignore */ }
  }

  async function handleEventSubmit(payload) {
    if (eventModal.mode === 'edit') await eventsApi.update(eventModal.event.eventId, payload);
    else await eventsApi.create(payload);
    setEventModal(null);
    refetch();
  }

  async function handleEventDelete(eventId) {
    try {
      await eventsApi.remove(eventId);
    } catch { /* ignore */ }
    setEventModal(null);
    refetch();
  }

  const label = view === 'month'
    ? formatMonthYear(focusDate)
    : view === 'week'
      ? formatWeekRange(getWeekDays(focusDate))
      : formatFullDate(focusDate);

  return (
    <section className="page">
      <div className="page__header">
        <span className="page__badge page__badge--coral">
          <CalendarIcon />
        </span>
        <h1 className="page__title">Calendar</h1>
      </div>

      <ToggleChips items={groupOptions} activeIds={activeGroupIds} onToggle={toggleGroup} />

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
      </div>

      <div className="calendar-view">
        {view === 'month' && (
          <CalendarMonthly focusDate={focusDate} tasks={filteredItems} onSelectDay={handleSelectDay} />
        )}
        {view === 'week' && (
          <CalendarWeekly
            focusDate={focusDate}
            tasks={filteredItems}
            onSelectDay={handleSelectDay}
            onToggleTask={toggleItemStatus}
            onOpenTask={openItem}
            onCreateTask={createEventAt}
            onMoveTask={moveItem}
          />
        )}
        {view === 'day' && (
          <CalendarDaily
            focusDate={focusDate}
            tasks={filteredItems}
            onToggleTask={toggleItemStatus}
            onOpenTask={openItem}
            onCreateTask={createEventAt}
          />
        )}
      </div>

      <button
        type="button"
        className="floating-action-button"
        onClick={() => {
          const start = new Date(focusDate);
          start.setHours(9, 0, 0, 0);
          setEventModal({ mode: 'new', start, end: new Date(start.getTime() + 60 * 60000) });
        }}
        aria-label="Add event"
      >
        <PlusIcon />
      </button>

      {eventModal && (
        <EventModal
          event={eventModal.mode === 'edit' ? eventModal.event : null}
          defaultStart={eventModal.mode === 'new' ? eventModal.start : null}
          defaultEnd={eventModal.mode === 'new' ? eventModal.end : null}
          onClose={() => setEventModal(null)}
          onSubmit={handleEventSubmit}
          onDelete={handleEventDelete}
        />
      )}
    </section>
  );
}

export default CalendarPage;
