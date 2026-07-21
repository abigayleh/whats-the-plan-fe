import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { PagesIcon, PlusIcon } from '../components/layout/icons';
import PageTree from '../components/pages/PageTree';
import NewPageModal from '../components/pages/NewPageModal';
import useAppData from '../hooks/useAppData';
import usePages from '../hooks/usePages';

// Two-pane Notion-style layout: a scoped page tree on the left, the selected page on
// the right (rendered through the nested :pageId route via Outlet context).
function PagesPage() {
  const { currentUser, personalSpace, groups } = useAppData();
  const {
    pages, loading, addPage, updatePage, deletePage, saveContent,
  } = usePages();
  const [showNew, setShowNew] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const atRoot = pathname === '/pages' || pathname === '/pages/';

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

  return (
    <div className="pages">
      <aside className="pages__sidebar">
        <div className="pages__sidebar-header">
          <h2 className="pages__sidebar-title">Pages</h2>
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
        <PageTree
          pages={pages}
          loading={loading}
          personalSpace={personalSpace}
          groups={groups}
          onNewChild={(parent) => createPage({ groupId: parent.groupId, parentId: parent.id })}
        />
      </aside>

      <section className="pages__content">
        {atRoot ? (
          <div className="pages__empty">
            <PagesIcon width={40} height={40} />
            <p>Select a page, or create a new one.</p>
          </div>
        ) : (
          <Outlet context={context} />
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
