import { useState, useRef, useEffect } from 'react';
import {
  ChevronIcon, EditIcon, GripIcon, PlusIcon, TrashIcon,
} from '../layout/icons';
import TaskRow from './TaskRow';
import usePlanItems from '../../hooks/usePlanItems';
import useLocalStorageState from '../../hooks/useLocalStorageState';
import { getTaskDay } from '../../utils/tasks';
import EntityIcon from '../common/EntityIcon';

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const dayA = getTaskDay(a);
    const dayB = getTaskDay(b);
    if (dayA && dayB) return dayA - dayB;
    if (dayA) return -1;
    if (dayB) return 1;
    return a.title.localeCompare(b.title);
  });
}

function ListSection({
  list, tasks, allLists, showCompleted, hideScheduled,
  onToggleTask, onEditTask, onAddTask, onEditList, onDeleteList, sortable,
}) {
  // Collapsed state is remembered per list (localStorage), so it survives reloads.
  const [collapsed, setCollapsed] = useLocalStorageState(`list-collapsed-${list.id}`, false);
  const [draft, setDraft] = useState('');
  const sorted = sortTasks(tasks);
  // "Hide scheduled" drops any to-do that has a due date (timed or date-only).
  const visible = hideScheduled ? sorted.filter((task) => getTaskDay(task) == null) : sorted;
  const todoTasks = visible.filter((task) => task.status !== 'done');
  const doneTasks = visible.filter((task) => task.status === 'done');
  const hasIcon = Boolean(list.icon);

  const { saveItem } = usePlanItems();
  // Blur can fire as a side effect of the input unmounting (e.g. navigating away) — a
  // ref (rather than state) tracks the live draft so the commit always reads the latest
  // text, and a mounted flag stops that unmount-triggered blur from saving anything.
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function commitDraft() {
    if (!mountedRef.current) return;
    const title = draftRef.current.trim();
    if (!title) return;
    draftRef.current = '';
    setDraft('');
    try {
      await saveItem(null, { origin: 'task', listId: list.id, title });
    } catch {
      // eslint-disable-next-line no-alert
      window.alert(`Couldn't add "${title}" — please try again.`);
    }
  }

  function handleDraftKeyDown(e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    commitDraft();
  }

  return (
    <div
      ref={sortable?.setNodeRef}
      style={sortable?.style}
      className={`list-section list-section--${list.colorKey}${sortable?.isDragging ? ' list-section--dragging' : ''}`}
    >
      <div className="list-section__header">
        <button
          type="button"
          className="list-section__header-button"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-expanded={!collapsed}
        >
          <span className={`list-section__collapse-icon${collapsed ? ' list-section__collapse-icon--collapsed' : ''}`}>
            <ChevronIcon />
          </span>
          {!hasIcon && <span className="list-section__color-dot" />}
          <span className="list-section__list-name">
            <EntityIcon icon={list.icon} className="list-section__list-icon" />
            {list.name}
          </span>
          <span className="list-section__task-count">
            {todoTasks.length}
            {list.isSystem ? '' : `/${showCompleted ? visible.length : todoTasks.length}`}
          </span>
        </button>
        {!list.isSystem && (
          <button type="button" className="list-section__add-task-button" onClick={() => onAddTask(list.id)}>
            <PlusIcon width={14} height={14} />
            Add task
          </button>
        )}
        {onEditList && (
          <button
            type="button"
            className="task-actions__button"
            onClick={() => onEditList(list)}
            aria-label={`Edit ${list.name}`}
            data-tooltip="Edit list"
          >
            <EditIcon width={15} height={15} />
          </button>
        )}
        {onDeleteList && (
          <button
            type="button"
            className="task-actions__button task-actions__button--danger"
            onClick={() => onDeleteList(list)}
            aria-label={`Delete ${list.name}`}
            data-tooltip="Delete list"
          >
            <TrashIcon width={15} height={15} />
          </button>
        )}
        {sortable && (
          <button
            type="button"
            className="list-section__drag-handle"
            aria-label={`Reorder ${list.name}`}
            data-tooltip="Drag to reorder"
            {...sortable.attributes}
            {...sortable.listeners}
          >
            <GripIcon />
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="list-section__task-list">
          {sorted.length === 0 && <p className="page__placeholder">No tasks yet.</p>}
          {todoTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              lists={allLists}
              day={task.shownDay}
              onToggle={onToggleTask}
              onClick={onEditTask}
            />
          ))}
          {showCompleted && doneTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              lists={allLists}
              day={task.shownDay}
              onToggle={onToggleTask}
              onClick={onEditTask}
            />
          ))}
          {!list.isSystem && (
            <div className="list-section__quick-add">
              <input
                type="text"
                className="list-section__quick-add-input"
                placeholder="Add a to-do…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitDraft}
                onKeyDown={handleDraftKeyDown}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ListSection;
