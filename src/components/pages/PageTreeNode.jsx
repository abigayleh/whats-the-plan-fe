import { NavLink } from 'react-router-dom';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { ChevronIcon, PlusIcon, PagesIcon } from '../layout/icons';
import EntityIcon from '../common/EntityIcon';
import HighlightText from '../common/HighlightText';

// One row in the page tree, recursing into its children when expanded.
// Manageable rows are draggable; every row is a drop target for reorder/reparent.
function PageTreeNode({
  node, depth, expanded, onToggle, onNewChild, canManagePage, drag, query = '',
}) {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded[node.id] !== false; // default expanded
  const canManage = canManagePage(node);

  // Pointer drag only (no keyboard sensor), so the row needs the listeners but not the
  // dnd-kit a11y attributes, which would add a duplicate tab stop over the inner link.
  const draggable = useDraggable({ id: node.id, disabled: !canManage });
  const droppable = useDroppable({ id: node.id });
  const setRowRef = (el) => { draggable.setNodeRef(el); droppable.setNodeRef(el); };

  const dropBand = drag?.overId === node.id ? drag.band : null;
  const rowClass = [
    'page-tree__row',
    drag?.activeId === node.id && 'page-tree__row--dragging',
    dropBand && `page-tree__row--drop-${dropBand}`,
  ].filter(Boolean).join(' ');

  return (
    <li className="page-tree__node">
      <div
        ref={setRowRef}
        className={rowClass}
        // Kept as a variable as well as padding: the drop-line starts at this same offset.
        style={{ '--page-row-indent': `${0.9 + depth * 0.9}rem`, paddingLeft: 'var(--page-row-indent)' }}
        {...(canManage ? draggable.listeners : {})}
      >
        <NavLink
          to={`/pages/${node.id}`}
          className={({ isActive }) => `page-tree__link${isActive ? ' page-tree__link--active' : ''}`}
        >
          <span className="page-tree__icon">
            <EntityIcon icon={node.icon} size={15} fallback={<PagesIcon width={15} height={15} />} />
          </span>
          <span className="page-tree__title">
              <HighlightText text={node.title || 'Untitled'} query={query} />
            </span>
        </NavLink>

        <button
          type="button"
          className="task-actions__button page-tree__add"
          onClick={() => onNewChild(node)}
          aria-label="Add subpage"
        >
          <PlusIcon width={14} height={14} />
        </button>

        {hasChildren && (
          // A sibling of the NavLink above, not nested in it — clicking it can't navigate.
          <button
            type="button"
            className="page-tree__toggle"
            onClick={() => onToggle(node.id)}
            aria-label={isOpen ? 'Hide subpages' : 'Show subpages'}
            aria-expanded={isOpen}
          >
            <ChevronIcon width={14} height={14} className={`page-tree__chevron${isOpen ? ' page-tree__chevron--open' : ''}`} />
          </button>
        )}
      </div>

      {hasChildren && isOpen && (
        <ul className="page-tree__list">
          {node.children.map((child) => (
            <PageTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              onNewChild={onNewChild}
              canManagePage={canManagePage}
              drag={drag}
              query={query}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default PageTreeNode;
