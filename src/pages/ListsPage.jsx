import { useState } from 'react';
import {
  DndContext, closestCenter, MouseSensor, TouchSensor, KeyboardSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { ListsIcon, PlusIcon } from '../components/layout/icons';
import ListSection from '../components/lists/ListSection';
import SortableListSection from '../components/lists/SortableListSection';
import PlanItemModal from '../components/items/PlanItemModal';
import ListModal from '../components/lists/ListModal';
import { MOUSE_ACTIVATION, TOUCH_ACTIVATION } from '../constants/dragSensors';
import ConfirmModal from '../components/common/ConfirmModal';
import useAppData from '../hooks/useAppData';
import usePlanItems from '../hooks/usePlanItems';
import useLocalStorageState from '../hooks/useLocalStorageState';
import {
  getListColorKey, getOverdueDay, getTaskColorKey, getTaskIconKey,
  isTaskDoneOnDay, isTaskOnDay, isTaskOverdue,
} from '../utils/tasks';
import useDocumentTitle from '../hooks/useDocumentTitle';

function ListsPage() {
  useDocumentTitle('Lists');
  const {
    groups, lists, tasks, currentUser, personalSpace,
    addList, updateList, deleteList, arrangeLists, toggleTask,
  } = useAppData();
  const { saveItem, deleteItem } = usePlanItems();
  const [listModal, setListModal] = useState(null); // null | { mode:'new' } | { mode:'edit', list }
  const [confirmingList, setConfirmingList] = useState(null);
  const [editingTask, setEditingTask] = useState(null); // task object | 'new' | null
  const [newTaskListId, setNewTaskListId] = useState(null);
  const [showCompleted, setShowCompleted] = useLocalStorageState('lists-show-completed', true);
  const [hideScheduled, setHideScheduled] = useLocalStorageState('lists-hide-scheduled', false);

  // Layout: Overdue pinned on top, then the user's reorderable lists, then the other
  // system lists. Only user lists are draggable; system lists stay put.
  const withColor = (list) => ({ ...list, colorKey: getListColorKey(list, groups, personalSpace) });
  // Unplaced lists (never dragged) fall to the end; name breaks ties for a stable order.
  const byPosition = (a, b) => (
    (a.position ?? Infinity) - (b.position ?? Infinity) || a.name.localeCompare(b.name)
  );
  const overdue = lists.find((l) => l.id === 'l-overdue');
  const userLists = lists.filter((l) => !l.isSystem).sort(byPosition).map(withColor);
  const systemLists = lists.filter((l) => l.isSystem && l.id !== 'l-overdue').map(withColor);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: MOUSE_ACTIVATION }),
    useSensor(TouchSensor, { activationConstraint: TOUCH_ACTIVATION }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    const ids = userLists.map((l) => l.id);
    const from = ids.indexOf(active.id);
    const to = ids.indexOf(over.id);
    if (from === -1 || to === -1) return;
    arrangeLists(arrayMove(ids, from, to));
  }

  // Only the list's owner or an admin of its group may remove it (mirrors the API).
  function canManageList(list) {
    if (list.isSystem) return false;
    if (!list.groupId) return true;
    return list.ownerId === currentUser.id || groups.find((g) => g.id === list.groupId)?.role === 'ADMIN';
  }

  // Which day of a recurring series a row in this list is about — the same day ticking it off
  // applies to, so the checkbox and the write can't disagree.
  const dayShownFor = (list, task) => (
    list.id === 'l-overdue' ? getOverdueDay(task) ?? new Date() : new Date()
  );

  function tasksForList(list) {
    let matching;
    if (list.id === 'l-overdue') {
      matching = tasks.filter((task) => isTaskOverdue(task));
    } else if (list.id === 'l-due-today') {
      matching = tasks.filter((task) => isTaskOnDay(task, new Date()));
    } else if (list.isSystem) {
      matching = tasks.filter((task) => task.assignedToId === currentUser.id);
    } else {
      matching = tasks.filter((task) => task.listId === list.id);
    }
    return matching.map((task) => ({
      ...task,
      // A series row's own status never says "done today" — show the day this row stands for
      // (the missed one under Overdue, today everywhere else), matching what ticking it does.
      status: task.recurrenceRule && isTaskDoneOnDay(task, dayShownFor(list, task)) ? 'done' : task.status,
      colorKey: getTaskColorKey(task, lists, groups, personalSpace),
      icon: getTaskIconKey(task, lists),
    }));
  }

  async function handleSaveList(payload) {
    if (listModal.mode === 'edit') await updateList(listModal.list.id, payload);
    else await addList(payload);
    setListModal(null);
  }

  function deleteListMessage(list) {
    const count = tasks.filter((t) => t.listId === list.id).length;
    const warning = count ? ` and its ${count} task${count === 1 ? '' : 's'}` : '';
    return `Delete "${list.name}"${warning}? This can't be undone.`;
  }

  async function confirmDeleteList() {
    await deleteList(confirmingList.id);
    setConfirmingList(null);
  }

  function handleAddTask(listId) {
    setNewTaskListId(listId);
    setEditingTask('new');
  }

  function handleEditTask(task) {
    setNewTaskListId(null);
    setEditingTask(task);
  }

  // The modal autosaves per-field and tracks its own created-item state, so it passes back
  // whichever item it's currently backed by (null until first save) rather than us tracking it.
  // Errors propagate so the modal can show them and stay open.
  async function handleSaveTask(payload, currentItem) {
    const result = await saveItem(currentItem, payload);
    // eslint-disable-next-line no-alert
    if (result.attachmentError) window.alert(`Task created, but its files didn't upload: ${result.attachmentError}`);
    return result;
  }

  async function handleDeleteTask(item) {
    await deleteItem(item);
    setEditingTask(null);
  }

  // An Overdue row stands for the day that was missed, not today — a recurring to-do must tick
  // off that occurrence, or the row it's shown in could never be cleared.
  function toggleOverdueTask(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (task) toggleTask(taskId, getOverdueDay(task));
  }

  // Same props for every list card, whether pinned or draggable (key is set at the call site).
  const sectionProps = (list) => ({
    list,
    tasks: tasksForList(list),
    allLists: lists,
    showCompleted,
    hideScheduled: list.id === 'l-overdue' ? false : hideScheduled,
    onToggleTask: list.id === 'l-overdue' ? toggleOverdueTask : toggleTask,
    onEditTask: handleEditTask,
    onAddTask: handleAddTask,
    onEditList: canManageList(list) ? (l) => setListModal({ mode: 'edit', list: l }) : null,
    onDeleteList: canManageList(list) ? setConfirmingList : null,
  });

  return (
    <section className="page">
      <div className="page__header">
        <span className="page__badge page__badge--teal">
          <ListsIcon />
        </span>
        <h1 className="page__title">Lists</h1>
        <div className="page__header-actions">
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
            className={`filter-toggle${hideScheduled ? ' filter-toggle--active' : ''}`}
            onClick={() => setHideScheduled((prev) => !prev)}
            aria-pressed={hideScheduled}
          >
            Hide scheduled to-dos
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={() => setListModal({ mode: 'new' })}
          >
            <PlusIcon width={16} height={16} />
            New List
          </button>
        </div>
      </div>

      <div className="list-sections">
        {/* Overdue only appears when there's something in it — no empty banner every day. */}
        {overdue && tasksForList(overdue).length > 0 && (
          <ListSection key={overdue.id} {...sectionProps(withColor(overdue))} />
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={userLists.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            {userLists.map((list) => (
              <SortableListSection key={list.id} {...sectionProps(list)} />
            ))}
          </SortableContext>
        </DndContext>

        {systemLists.map((list) => (
          <ListSection key={list.id} {...sectionProps(list)} />
        ))}
      </div>

      {listModal && (
        <ListModal
          list={listModal.mode === 'edit' ? listModal.list : null}
          groups={groups}
          onClose={() => setListModal(null)}
          onSave={handleSaveList}
        />
      )}

      {editingTask && (
        <PlanItemModal
          lists={lists}
          groups={groups}
          personalSpace={personalSpace}
          defaultListId={newTaskListId}
          item={editingTask === 'new' ? null : editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}

      {confirmingList && (
        <ConfirmModal
          title="Delete list"
          message={deleteListMessage(confirmingList)}
          onConfirm={confirmDeleteList}
          onCancel={() => setConfirmingList(null)}
        />
      )}
    </section>
  );
}

export default ListsPage;
