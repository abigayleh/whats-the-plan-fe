import { useMemo, useState } from 'react';
import { CalendarIcon, PlusIcon } from '../components/layout/icons';
import CalendarViewSwitcher from '../components/calendar/CalendarViewSwitcher';
import CalendarContentToggle from '../components/calendar/CalendarContentToggle';
import ToggleChips from '../components/calendar/ToggleChips';
import CalendarMonthly from '../components/calendar/CalendarMonthly';
import CalendarWeekly from '../components/calendar/CalendarWeekly';
import CalendarDaily from '../components/calendar/CalendarDaily';
import TaskModal from '../components/lists/TaskModal';
import useAppData from '../hooks/useAppData';
import useLocalStorageState from '../hooks/useLocalStorageState';
import {
  getListColorKey, getTaskColorKey, getTaskDay, getTaskIconKey, isTaskTimed,
} from '../utils/tasks';
import {
  addDays,
  addMonths,
  formatFullDate,
  formatMonthYear,
  formatWeekRange,
  getWeekDays,
} from '../utils/date';

const NO_LIST_OPTION = { id: null, name: 'No list', colorKey: 'primary' };

function CalendarPage() {
  const {
    groups, lists, tasks, currentUser, personalSpace, toggleTaskStatus, addTask, updateTask, deleteTask,
  } = useAppData();
  const groupOptions = useMemo(() => [{ id: null, ...personalSpace }, ...groups], [groups, personalSpace]);
  const [view, setView] = useLocalStorageState('calendar-view', 'month');
  const [contentFilter, setContentFilter] = useLocalStorageState('calendar-content-filter', 'all');
  const [onlyMine, setOnlyMine] = useLocalStorageState('calendar-only-mine', false);
  const [showCompleted, setShowCompleted] = useLocalStorageState('calendar-show-completed', true);
  const [focusDate, setFocusDate] = useState(new Date());
  const [activeGroupIds, setActiveGroupIds] = useState(
    () => new Set(groupOptions.map((group) => group.id)),
  );
  const [activeListIds, setActiveListIds] = useState(
    () => new Set([...lists.map((list) => list.id), null]),
  );
  const [taskModalState, setTaskModalState] = useState(null); // null | 'new' | task object
  const [newTaskSchedule, setNewTaskSchedule] = useState(null); // prefill for a slot-click 'new' task

  const listOptions = useMemo(
    () => [
      NO_LIST_OPTION,
      ...lists
        .filter((list) => activeGroupIds.has(list.groupId ?? null))
        .map((list) => ({ ...list, colorKey: getListColorKey(list, groups, personalSpace) })),
    ],
    [lists, groups, personalSpace, activeGroupIds],
  );

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    if (!getTaskDay(task)) return false;
    if (contentFilter === 'events' && !isTaskTimed(task)) return false;
    if (contentFilter === 'tasks' && isTaskTimed(task)) return false;
    if (!activeGroupIds.has(task.groupId ?? null)) return false;
    if (!activeListIds.has(task.listId ?? null)) return false;
    if (!showCompleted && task.status === 'done') return false;
    if (onlyMine && task.assignedTo && task.assignedTo !== currentUser.name) return false;
    return true;
  }).map((task) => ({
    ...task,
    colorKey: getTaskColorKey(task, lists, groups, personalSpace),
    icon: getTaskIconKey(task, lists),
  })),
  [tasks, lists, groups, personalSpace, activeGroupIds, activeListIds, contentFilter, onlyMine, showCompleted,
    currentUser]);

  function toggleGroup(groupId) {
    setActiveGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  function toggleList(listId) {
    setActiveListIds((prev) => {
      const next = new Set(prev);
      if (next.has(listId)) next.delete(listId);
      else next.add(listId);
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

  function handleCreateTaskAt(day, hour, minute = 0) {
    const scheduledStart = new Date(day);
    scheduledStart.setHours(hour, minute, 0, 0);
    const scheduledEnd = new Date(scheduledStart.getTime() + 60 * 60000);
    setNewTaskSchedule({ scheduledStart, scheduledEnd });
    setTaskModalState('new');
  }

  function handleMoveTask(taskId, { day, hour, minute = 0, timed }) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (!timed) {
      const dueDate = new Date(day);
      dueDate.setHours(0, 0, 0, 0);
      updateTask(taskId, { dueDate, scheduledStart: null, scheduledEnd: null });
      return;
    }

    const durationMinutes = isTaskTimed(task) ? (task.scheduledEnd - task.scheduledStart) / 60000 : 60;
    const scheduledStart = new Date(day);
    scheduledStart.setHours(hour, minute, 0, 0);
    const scheduledEnd = new Date(scheduledStart.getTime() + durationMinutes * 60000);
    updateTask(taskId, { scheduledStart, scheduledEnd, dueDate: null });
  }

  const label =
    view === 'month'
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
      <ToggleChips items={listOptions} activeIds={activeListIds} onToggle={toggleList} />

      <div className="calendar-toolbar">
        <button type="button" className="calendar-toolbar__nav" onClick={handlePrev} aria-label="Previous">
          ‹
        </button>
        <div className="calendar-toolbar__label-group">
          <span className="calendar-toolbar__label">{label}</span>
          <button type="button" className="calendar-toolbar__today" onClick={() => setFocusDate(new Date())}>
            Today
          </button>
        </div>
        <button type="button" className="calendar-toolbar__nav" onClick={handleNext} aria-label="Next">
          ›
        </button>
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
          <CalendarMonthly
            focusDate={focusDate}
            tasks={filteredTasks}
            onSelectDay={handleSelectDay}
          />
        )}
        {view === 'week' && (
          <CalendarWeekly
            focusDate={focusDate}
            tasks={filteredTasks}
            onSelectDay={handleSelectDay}
            onToggleTask={toggleTaskStatus}
            onOpenTask={setTaskModalState}
            onCreateTask={handleCreateTaskAt}
            onMoveTask={handleMoveTask}
          />
        )}
        {view === 'day' && (
          <CalendarDaily
            focusDate={focusDate}
            tasks={filteredTasks}
            lists={lists}
            onToggleTask={toggleTaskStatus}
            onOpenTask={setTaskModalState}
            onCreateTask={handleCreateTaskAt}
          />
        )}
      </div>

      <button
        type="button"
        className="floating-action-button"
        onClick={() => {
          setNewTaskSchedule(null);
          setTaskModalState('new');
        }}
        aria-label="Add task"
      >
        <PlusIcon />
      </button>

      {taskModalState && (
        <TaskModal
          lists={lists}
          defaultSchedule={taskModalState === 'new' ? newTaskSchedule : null}
          task={taskModalState === 'new' ? null : taskModalState}
          onClose={() => setTaskModalState(null)}
          onSave={(payload) => {
            if (taskModalState === 'new') addTask(payload);
            else updateTask(taskModalState.id, payload);
            setTaskModalState(null);
          }}
          onDelete={(taskId) => {
            deleteTask(taskId);
            setTaskModalState(null);
          }}
        />
      )}
    </section>
  );
}

export default CalendarPage;
