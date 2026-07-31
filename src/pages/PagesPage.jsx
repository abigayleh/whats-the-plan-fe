import { useState } from 'react';
import {
  Link, Outlet, useLocation, useNavigate, useParams,
} from 'react-router-dom';
import {
  PagesIcon, PlusIcon, ChevronIcon, MenuIcon, SearchIcon, CloseIcon,
} from '../components/layout/icons';
import PageTree from '../components/pages/PageTree';
import NewPageModal from '../components/pages/NewPageModal';
import useAppData from '../hooks/useAppData';
import usePages from '../hooks/usePages';
import useLocalStorageState from '../hooks/useLocalStorageState';
import useRememberedItem from '../hooks/useRememberedItem';

// Two-pane Notion-style layout: a scoped page tree on the left, the selected page on
// the right (rendered through the nested :pageId route via Outlet context).
function PagesPage() {
  const { currentUser, personalSpace, groups } = useAppData();
  const {
    pages, loading, addPage, updatePage, deletePage, saveContent, reorderPages,
  } = usePages();
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useLocalStorageState('pages-sidebar-collapsed', false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { pageId } = useParams();
  const atRoot = pathname === '/pages' || pathname === '/pages/';

  // Reopen the last page viewed when landing on /pages, instead of the empty state.
  useRememberedItem({
    storageKey: 'pages-last-id', currentId: pageId, atRoot, loading, items: pages, pathPrefix: '/pages',
  });

  // Mirrors the API: only the owner or a group admin may edit/delete/move a page.
  function canManagePage(page) {
    if (!page.groupId) return page.ownerId === currentUser.id;
    return page.ownerId === currentUser.id
      || groups.find((g) => g.id === page.groupId)?.role === 'ADMIN';
  }

  async function createPage({
    title = 'Untitled', groupId = null, parentId = null, icon = null,
  }) {
    const page = await addPage({
      title, groupId, parentId, icon,
    });
    navigate(`/pages/${page.id}`);
    return page;
  }

  async function handleNew(payload) {
    await createPage(payload);
    setShowNew(false);
  }

  const context = {
    pages, currentUser, groups, personalSpace, canManagePage, saveContent, updatePage, deletePage, createPage,
  };

  // Phones show one pane at a time: the tree, or the page you opened from it.
  return (
    <div className={`pages${atRoot ? '' : ' pages--detail'}`}>
      {collapsed ? (
        <button
          type="button"
          className="task-actions__button pages__expand"
          onClick={() => setCollapsed(false)}
          aria-label="Show pages"
          data-tooltip="Show pages"
        >
          <MenuIcon width={18} height={18} />
        </button>
      ) : (
        <aside className="pages__sidebar">
          <div className="pages__sidebar-header">
            <div className="pages__sidebar-heading">
              <button
                type="button"
                className="task-actions__button"
                onClick={() => setCollapsed(true)}
                aria-label="Hide pages"
                data-tooltip="Hide pages"
              >
                <ChevronIcon width={16} height={16} className="pages__collapse-icon" />
              </button>
              <h2 className="pages__sidebar-title">Pages</h2>
            </div>
            <button
              type="button"
              className="task-actions__button"
              onClick={() => setShowNew(true)}
              aria-label="New page"
              data-tooltip="New page"
            >
              <PlusIcon width={16} height={16} />
            </button>
          </div>
          <div className="page-search">
            <SearchIcon className="page-search__icon" width={14} height={14} />
            <input
              className="page-search__input"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') setSearch(''); }}
              placeholder="Search pages"
              aria-label="Search pages"
            />
            {search && (
              <button
                type="button"
                className="page-search__clear"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <CloseIcon width={13} height={13} />
              </button>
            )}
          </div>

          <PageTree
            query={search}
            pages={pages}
            loading={loading}
            personalSpace={personalSpace}
            groups={groups}
            canManagePage={canManagePage}
            onReorder={reorderPages}
            onNewChild={(parent) => createPage({ groupId: parent.groupId, parentId: parent.id })}
          />
        </aside>
      )}

      <section className="pages__content">
        {atRoot ? (
          <div className="pages__empty">
            <PagesIcon width={40} height={40} />
            <p>Select a page, or create a new one.</p>
          </div>
        ) : (
          <>
            <Link to="/pages" className="pane-back">
              <ChevronIcon width={16} height={16} />
              Pages
            </Link>
            <Outlet context={context} />
          </>
        )}
      </section>

      {showNew && (
        <NewPageModal
          groups={groups}
          personalSpace={personalSpace}
          onClose={() => setShowNew(false)}
          onCreate={handleNew}
        />
      )}
    </div>
  );
}

export default PagesPage;
