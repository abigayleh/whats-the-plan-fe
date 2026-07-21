import { NavLink } from 'react-router-dom';
import { ChevronIcon, PlusIcon, PagesIcon } from '../layout/icons';
import { getTaskIcon } from '../../constants/taskIcons';

// One row in the page tree, recursing into its children when expanded.
function PageTreeNode({
  node, depth, expanded, onToggle, onNewChild,
}) {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded[node.id] !== false; // default expanded
  const NodeIcon = getTaskIcon(node.icon)?.Icon;

  return (
    <li className="page-tree__node">
      <div className="page-tree__row" style={{ paddingLeft: `${0.9 + depth * 0.9}rem` }}>
        {hasChildren && (
          // A sibling of the NavLink below, not nested in it — clicking it can't navigate.
          <button
            type="button"
            className="page-tree__toggle"
            style={{ left: `${depth * 0.9}rem` }}
            onClick={() => onToggle(node.id)}
            aria-label={isOpen ? 'Hide subpages' : 'Show subpages'}
            aria-expanded={isOpen}
          >
            <ChevronIcon width={13} height={13} className={`page-tree__chevron${isOpen ? ' page-tree__chevron--open' : ''}`} />
          </button>
        )}

        <NavLink
          to={`/pages/${node.id}`}
          className={({ isActive }) => `page-tree__link${isActive ? ' page-tree__link--active' : ''}`}
        >
          <span className="page-tree__icon">
            {NodeIcon ? <NodeIcon width={15} height={15} /> : <PagesIcon width={15} height={15} />}
          </span>
          <span className="page-tree__title">{node.title || 'Untitled'}</span>
        </NavLink>

        <button
          type="button"
          className="task-actions__button page-tree__add"
          onClick={() => onNewChild(node)}
          aria-label="Add subpage"
        >
          <PlusIcon width={14} height={14} />
        </button>
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
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default PageTreeNode;
