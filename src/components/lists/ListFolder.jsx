import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronIcon, FolderIcon, EditIcon, TrashIcon, GripIcon,
} from '../layout/icons';

// A collapsible, reorderable folder. Its body is a drop zone that accepts lists;
// children reorder within their own SortableContext.
function ListFolder({
  folder, childLists, renderChild, onRename, onDelete,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: `folder:${folder.id}` });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `foldzone:${folder.id}` });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const childIds = childLists.map((l) => `list:${l.id}`);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`list-folder${isDragging ? ' list-folder--dragging' : ''}`}
    >
      <div className="list-folder__header">
        <button
          type="button"
          className="list-folder__toggle"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
        >
          <span className={`list-folder__chevron${collapsed ? ' list-folder__chevron--collapsed' : ''}`}>
            <ChevronIcon />
          </span>
          <FolderIcon className="list-folder__icon" />
          <span className="list-folder__name">{folder.name}</span>
          <span className="list-folder__count">{childLists.length}</span>
        </button>
        <button
          type="button"
          className="task-actions__button"
          onClick={() => onRename(folder)}
          aria-label={`Rename ${folder.name}`}
          data-tooltip="Rename folder"
        >
          <EditIcon width={15} height={15} />
        </button>
        <button
          type="button"
          className="task-actions__button task-actions__button--danger"
          onClick={() => onDelete(folder)}
          aria-label={`Delete ${folder.name}`}
          data-tooltip="Delete folder"
        >
          <TrashIcon width={15} height={15} />
        </button>
        <button
          type="button"
          className="list-section__drag-handle"
          aria-label={`Reorder ${folder.name}`}
          data-tooltip="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripIcon />
        </button>
      </div>

      {!collapsed && (
        <div ref={setDropRef} className={`list-folder__body${isOver ? ' list-folder__body--over' : ''}`}>
          <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
            {childLists.length === 0
              ? <p className="list-folder__empty">Drag lists here</p>
              : childLists.map((l) => renderChild(l))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}

export default ListFolder;
