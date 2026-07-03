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
    groups, lists, tasks, currentUser, personalSpace, addList, addTask, updateTask, deleteTask, toggleTaskStatus,
  } = useAppData();
  const [showListModal, setShowListModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // task object | null
  const [newTaskListId, setNewTaskListId] = useState(null);
  const [showCompleted, setShowCompleted] = useLocalStorageState('lists-show-completed', true);

  const orderedLists = [...lists]
    .sort((a, b) => Number(a.isSystem) - Number(b.isSystem))
    .map((list) => ({ ...list, colorKey: getListColorKey(list, groups, personalSpace) }));

  function tasksForList(list) {
    let matching;
    if (list.id === 'l-due-today') {
      matching = tasks.filter((task) => isTaskOnDay(task, new Date()));
    } else if (list.isSystem) {
      matching = tasks.filter((task) => task.assignedTo === currentUser.name);
    } else {
      matching = tasks.filter((task) => task.listId === list.id);
    }
    return matching.map((task) => ({
      ...task,
      colorKey: getTaskColorKey(task, lists, groups, personalSpace),
      icon: getTaskIconKey(task, lists),
    }));
  }

  function handleAddList(payload) {
    addList(payload);
    setShowListModal(false);
  }

  function handleAddTask(listId) {
    setNewTaskListId(listId);
    setEditingTask('new');
  }

  function handleEditTask(task) {
    setNewTaskListId(null);
    setEditingTask(task);
  }

  function handleSaveTask(payload) {
    if (editingTask && editingTask !== 'new') {
      updateTask(editingTask.id, payload);
    } else {
      addTask(payload);
    }
    setEditingTask(null);
  }

  function handleDeleteTask(taskId) {
    deleteTask(taskId);
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
            onClick={() => setShowListModal(true)}
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
          />
        ))}
      </div>

      {showListModal && (
        <ListModal groups={groups} onClose={() => setShowListModal(false)} onSave={handleAddList} />
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
