import { useState } from 'react';
import { ListsIcon, PlusIcon } from '../components/layout/icons';
import ListSection from '../components/lists/ListSection';
import TaskModal from '../components/lists/TaskModal';
import ListModal from '../components/lists/ListModal';
import useAppData from '../hooks/useAppData';
import useLocalStorageState from '../hooks/useLocalStorageState';
import {
  getListColorKey, getTaskColorKey, getTaskIconKey, isTaskOnDay,
} from '../utils/tasks';

function ListsPage() {
  const {
    groups, lists, tasks, currentUser, personalSpace,
    addList, updateList, deleteList, addTask, updateTask, deleteTask, toggleTaskStatus,
  } = useAppData();
  const [listModal, setListModal] = useState(null); // null | { mode:'new' } | { mode:'edit', list }
  const [editingTask, setEditingTask] = useState(null); // task object | 'new' | null
  const [newTaskListId, setNewTaskListId] = useState(null);
  const [showCompleted, setShowCompleted] = useLocalStorageState('lists-show-completed', true);

  const orderedLists = [...lists]
    .sort((a, b) => Number(a.isSystem) - Number(b.isSystem))
    .map((list) => ({ ...list, colorKey: getListColorKey(list, groups, personalSpace) }));

  // Only the list's owner or an admin of its group may remove it (mirrors the API).
  function canManageList(list) {
    if (list.isSystem) return false;
    if (!list.groupId) return true;
    return list.ownerId === currentUser.id || groups.find((g) => g.id === list.groupId)?.role === 'ADMIN';
  }

  function tasksForList(list) {
    let matching;
    if (list.id === 'l-due-today') {
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

  // Errors propagate so the modal can show them and stay open.
  async function handleSaveTask(payload) {
    if (editingTask && editingTask !== 'new') {
      await updateTask(editingTask.id, payload);
    } else {
      const { attachmentError } = await addTask(payload);
      // eslint-disable-next-line no-alert
      if (attachmentError) window.alert(`Task created, but its files didn't upload: ${attachmentError}`);
    }
    setEditingTask(null);
  }

  async function handleDeleteTask(taskId) {
    await deleteTask(taskId);
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
            className="button button--primary"
            onClick={() => setListModal({ mode: 'new' })}
          >
            <PlusIcon width={16} height={16} />
            New List
          </button>
        </div>
      </div>

      <div className="list-sections">
        {orderedLists.map((list) => (
          <ListSection
            key={list.id}
            list={list}
            tasks={tasksForList(list)}
            allLists={lists}
            showCompleted={showCompleted}
            onToggleTask={toggleTaskStatus}
            onEditTask={handleEditTask}
            onAddTask={handleAddTask}
            onEditList={canManageList(list) ? (l) => setListModal({ mode: 'edit', list: l }) : null}
            onDeleteList={canManageList(list) ? handleDeleteList : null}
          />
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
        <TaskModal
          lists={lists}
          defaultListId={newTaskListId}
          task={editingTask === 'new' ? null : editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}
    </section>
  );
}

export default ListsPage;
