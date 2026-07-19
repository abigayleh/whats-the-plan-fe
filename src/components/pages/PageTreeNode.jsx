import { NavLink } from 'react-router-dom';
import { ChevronIcon, PlusIcon, PagesIcon } from '../layout/icons';

// One row in the page tree, recursing into its children when expanded.
function PageTreeNode({
  node, depth, expanded, onToggle, onNewChild,
}) {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded[node.id] !== false; // default expanded

  return (
    <li className="page-tree__node">
      <div className="page-tree__row" style={{ paddingLeft: `${depth * 0.85 + 0.4}rem` }}>
        {hasChildren ? (
          <button
            type="button"
            className="page-tree__toggle"
            onClick={() => onToggle(node.id)}
            aria-label={isOpen ? 'Collapse' : 'Expand'}
          >
            <ChevronIcon className={`page-tree__chevron${isOpen ? ' page-tree__chevron--open' : ''}`} />
          </button>
        ) : (
          <span className="page-tree__toggle-spacer" />
        )}

        <NavLink
          to={`/pages/${node.id}`}
          className={({ isActive }) => `page-tree__link${isActive ? ' page-tree__link--active' : ''}`}
        >
          <span className="page-tree__icon">
            {node.icon || <PagesIcon width={15} height={15} />}
          </span>
          <span className="page-tree__title">{node.title || 'Untitled'}</span>
        </NavLink>

        <button
          type="button"
          className="task-actions__button page-tree__add"
          onClick={() => onNewChild(node)}
          aria-label="Add subpage"
          data-tooltip="Add subpage"
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
