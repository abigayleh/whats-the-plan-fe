import { useState } from 'react';
import { ListsIcon, PlusIcon } from '../components/layout/icons';
import ListSection from '../components/lists/ListSection';
import PlanItemModal from '../components/items/PlanItemModal';
import ListModal from '../components/lists/ListModal';
import useAppData from '../hooks/useAppData';
import usePlanItems from '../hooks/usePlanItems';
import useLocalStorageState from '../hooks/useLocalStorageState';
import {
  getListColorKey, getTaskColorKey, getTaskIconKey, isTaskOnDay, isTaskOverdue,
} from '../utils/tasks';

function ListsPage() {
  const {
    groups, lists, tasks, currentUser, personalSpace,
    addList, updateList, deleteList, toggleTaskStatus,
  } = useAppData();
  const { saveItem, deleteItem } = usePlanItems();
  const [listModal, setListModal] = useState(null); // null | { mode:'new' } | { mode:'edit', list }
  const [editingTask, setEditingTask] = useState(null); // task object | 'new' | null
  const [newTaskListId, setNewTaskListId] = useState(null);
  const [showCompleted, setShowCompleted] = useLocalStorageState('lists-show-completed', true);
  const [hideScheduled, setHideScheduled] = useLocalStorageState('lists-hide-scheduled', false);

  // Overdue pinned to the very top, then user lists, then the other system lists.
  const listRank = (list) => (list.id === 'l-overdue' ? 0 : (list.isSystem ? 2 : 1));
  const orderedLists = [...lists]
    .sort((a, b) => listRank(a) - listRank(b))
    .map((list) => ({ ...list, colorKey: getListColorKey(list, groups, personalSpace) }));

  // Only the list's owner or an admin of its group may remove it (mirrors the API).
  function canManageList(list) {
    if (list.isSystem) return false;
    if (!list.groupId) return true;
    return list.ownerId === currentUser.id || groups.find((g) => g.id === list.groupId)?.role === 'ADMIN';
  }

  function tasksForList(list) {
    let matching;
    if (list.id === 'l-overdue') {
      matching = tasks.filter(isTaskOverdue);
    } else if (list.id === 'l-due-today') {
      matching = tasks.filter((task) => isTaskOnDay(task, new Date()));
    } else if (list.isSystem) {
      matching = tasks.filter((task) => task.assignedToId === currentUser.id);
    } else {
      matching = tasks.filter((task) => task.listId === list.id);
    }
    return matching.map((task) => ({
      ...task,
      colorKey: getTaskColorKey(task, lists, groups, personalSpace),
      icon: getTaskIconKey(task, lists),
    }));
  }

  async function handleSaveList(payload) {
    if (listModal.mode === 'edit') await updateList(listModal.list.id, payload);
    else await addList(payload);
    setListModal(null);
  }

  function handleDeleteList(list) {
    const count = tasks.filter((t) => t.listId === list.id).length;
    const warning = count ? ` and its ${count} task${count === 1 ? '' : 's'}` : '';
    // eslint-disable-next-line no-alert
    if (window.confirm(`Delete "${list.name}"${warning}? This can't be undone.`)) deleteList(list.id);
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
        {orderedLists.map((list) => {
          const listTasks = tasksForList(list);
          // Overdue only appears when there's something in it — no empty banner every day.
          if (list.id === 'l-overdue' && listTasks.length === 0) return null;
          return (
            <ListSection
              key={list.id}
              list={list}
              tasks={listTasks}
              allLists={lists}
              showCompleted={showCompleted}
              hideScheduled={list.id === 'l-overdue' ? false : hideScheduled}
              onToggleTask={toggleTaskStatus}
              onEditTask={handleEditTask}
              onAddTask={handleAddTask}
              onEditList={canManageList(list) ? (l) => setListModal({ mode: 'edit', list: l }) : null}
              onDeleteList={canManageList(list) ? handleDeleteList : null}
            />
          );
        })}
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
    </section>
  );
}

export default ListsPage;
