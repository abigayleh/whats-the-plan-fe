import { useState } from 'react';
import {
  DndContext, closestCorners, PointerSensor, KeyboardSensor, useSensor, useSensors, useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { ListsIcon, PlusIcon, FolderIcon } from '../components/layout/icons';
import ListSection from '../components/lists/ListSection';
import SortableListSection from '../components/lists/SortableListSection';
import ListFolder from '../components/lists/ListFolder';
import { computeArrangement } from '../components/lists/arrangeDrop';
import PlanItemModal from '../components/items/PlanItemModal';
import ListModal from '../components/lists/ListModal';
import FolderModal from '../components/lists/FolderModal';
import useAppData from '../hooks/useAppData';
import usePlanItems from '../hooks/usePlanItems';
import useLocalStorageState from '../hooks/useLocalStorageState';
import {
  getListColorKey, getTaskColorKey, getTaskIconKey, isTaskOnDay, isTaskOverdue,
} from '../utils/tasks';

function ListsPage() {
  const {
    groups, lists, folders, tasks, currentUser, personalSpace,
    addList, updateList, deleteList, arrangeItems,
    addFolder, updateFolder, deleteFolder, toggleTaskStatus,
  } = useAppData();
  const { saveItem, deleteItem } = usePlanItems();
  const [listModal, setListModal] = useState(null); // null | { mode:'new' } | { mode:'edit', list }
  const [folderModal, setFolderModal] = useState(null); // null | { mode:'new' } | { mode:'edit', folder }
  const [editingTask, setEditingTask] = useState(null); // task object | 'new' | null
  const [newTaskListId, setNewTaskListId] = useState(null);
  const [showCompleted, setShowCompleted] = useLocalStorageState('lists-show-completed', true);
  const [hideScheduled, setHideScheduled] = useLocalStorageState('lists-hide-scheduled', false);

  // Layout: Overdue pinned on top; then the user's reorderable loose lists and folders;
  // then the other system lists. Only user lists/folders are draggable.
  const withColor = (list) => ({ ...list, colorKey: getListColorKey(list, groups, personalSpace) });
  // Unplaced lists (never dragged) fall to the end; name breaks ties for a stable order.
  const byPosition = (a, b) => (
    (a.position ?? Infinity) - (b.position ?? Infinity) || a.name.localeCompare(b.name)
  );
  const overdue = lists.find((l) => l.id === 'l-overdue');
  const systemLists = lists.filter((l) => l.isSystem && l.id !== 'l-overdue').map(withColor);
  const userLists = lists.filter((l) => !l.isSystem).map(withColor);
  const orderedFolders = [...folders].sort((a, b) => a.position - b.position);
  const folderIds = new Set(orderedFolders.map((f) => f.id));
  // A list is loose unless it sits in a folder that still exists.
  const looseLists = userLists.filter((l) => !l.folderId || !folderIds.has(l.folderId)).sort(byPosition);
  const childrenByFolder = new Map(orderedFolders.map((f) => [
    f.id, userLists.filter((l) => l.folderId === f.id).sort(byPosition),
  ]));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const { setNodeRef: looseRef, isOver: looseOver } = useDroppable({ id: 'loose' });
  function handleDragEnd({ active, over }) {
    const payload = computeArrangement({
      activeId: String(active.id),
      overId: over ? String(over.id) : null,
      looseLists,
      folders: orderedFolders,
      childrenByFolder,
    });
    if (payload) arrangeItems(payload);
  }

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

  async function handleSaveFolder(name) {
    if (folderModal.mode === 'edit') await updateFolder(folderModal.folder.id, { name });
    else await addFolder(name);
    setFolderModal(null);
  }

  function handleDeleteFolder(folder) {
    const count = lists.filter((l) => l.folderId === folder.id).length;
    const note = count ? ` Its ${count} list${count === 1 ? '' : 's'} will move back to the top level.` : '';
    // eslint-disable-next-line no-alert
    if (window.confirm(`Delete folder "${folder.name}"?${note}`)) deleteFolder(folder.id);
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

  // Same props for every list card, whether pinned or draggable (key is set at the call site).
  const sectionProps = (list) => ({
    list,
    tasks: tasksForList(list),
    allLists: lists,
    showCompleted,
    hideScheduled: list.id === 'l-overdue' ? false : hideScheduled,
    onToggleTask: toggleTaskStatus,
    onEditTask: handleEditTask,
    onAddTask: handleAddTask,
    onEditList: canManageList(list) ? (l) => setListModal({ mode: 'edit', list: l }) : null,
    onDeleteList: canManageList(list) ? handleDeleteList : null,
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
            className="button button--ghost"
            onClick={() => setFolderModal({ mode: 'new' })}
          >
            <FolderIcon width={16} height={16} />
            New Folder
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

        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div ref={looseRef} className={`lists-loose${looseOver ? ' lists-loose--over' : ''}`}>
            <SortableContext items={looseLists.map((l) => `list:${l.id}`)} strategy={verticalListSortingStrategy}>
              {looseLists.map((list) => (
                <SortableListSection key={list.id} {...sectionProps(list)} />
              ))}
            </SortableContext>
            {looseLists.length === 0 && orderedFolders.length > 0 && (
              <p className="lists-loose__empty">Drag a list here to move it out of a folder</p>
            )}
          </div>

          <SortableContext items={orderedFolders.map((f) => `folder:${f.id}`)} strategy={verticalListSortingStrategy}>
            {orderedFolders.map((folder) => (
              <ListFolder
                key={folder.id}
                folder={folder}
                childLists={childrenByFolder.get(folder.id) || []}
                renderChild={(l) => <SortableListSection key={l.id} {...sectionProps(l)} />}
                onRename={(f) => setFolderModal({ mode: 'edit', folder: f })}
                onDelete={handleDeleteFolder}
              />
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

      {folderModal && (
        <FolderModal
          folder={folderModal.mode === 'edit' ? folderModal.folder : null}
          onClose={() => setFolderModal(null)}
          onSave={handleSaveFolder}
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
