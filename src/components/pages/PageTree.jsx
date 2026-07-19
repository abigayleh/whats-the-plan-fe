import useLocalStorageState from '../../hooks/useLocalStorageState';
import PageTreeNode from './PageTreeNode';

// Turns a flat, single-scope page list into a parent→children forest (roots first).
function buildForest(pages) {
  const byId = new Map(pages.map((p) => [p.id, { ...p, children: [] }]));
  const roots = [];
  byId.forEach((node) => {
    const parent = node.parentId && byId.get(node.parentId);
    if (parent) parent.children.push(node);
    else roots.push(node);
  });
  const sortByTitle = (list) => {
    list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    list.forEach((n) => sortByTitle(n.children));
  };
  sortByTitle(roots);
  return roots;
}

function PageTree({
  pages, loading, personalSpace, groups, onNewChild,
}) {
  const [expanded, setExpanded] = useLocalStorageState('pages-tree-expanded', {});
  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: prev[id] === false }));

  // Personal first, then one section per group. Each section is its own scope.
  const scopes = [
    { key: 'personal', name: personalSpace.name, pages: pages.filter((p) => !p.groupId) },
    ...groups.map((g) => ({ key: g.id, name: g.name, pages: pages.filter((p) => p.groupId === g.id) })),
  ];

  if (loading) return <p className="page-tree__empty">Loading…</p>;

  return (
    <div className="page-tree">
      {scopes.map((scope) => (
        <div key={scope.key} className="page-tree__scope">
          <p className="page-tree__scope-title">{scope.name}</p>
          {scope.pages.length === 0 ? (
            <p className="page-tree__empty">No pages yet</p>
          ) : (
            <ul className="page-tree__list">
              {buildForest(scope.pages).map((node) => (
                <PageTreeNode
                  key={node.id}
                  node={node}
                  depth={0}
                  expanded={expanded}
                  onToggle={toggle}
                  onNewChild={onNewChild}
                />
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

export default PageTree;
