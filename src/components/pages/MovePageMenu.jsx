import { useState } from 'react';
import { descendantIds } from '../../utils/pageTree';

// Reparents a page within its own scope. Targets exclude the page itself and its
// descendants (the backend rejects those too — this just keeps them out of the list).
function MovePageMenu({ page, pages, onMove }) {
  const [open, setOpen] = useState(false);
  const blocked = descendantIds(page.id, pages);

  const targets = pages
    .filter((p) => p.id !== page.id && (p.groupId || null) === (page.groupId || null) && !blocked.has(p.id))
    .sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  function move(parentId) {
    onMove(parentId);
    setOpen(false);
  }

  return (
    <div className="move-menu">
      <button type="button" className="button button--ghost button--sm" onClick={() => setOpen((o) => !o)}>
        Move to…
      </button>
      {open && (
        <>
          <button type="button" className="move-menu__backdrop" onClick={() => setOpen(false)} aria-label="Close" />
          <div className="suggestion-menu move-menu__list">
            {page.parentId && (
              <button
                type="button"
                className="suggestion-menu__item"
                onMouseDown={(e) => { e.preventDefault(); move(null); }}
              >
                <span className="suggestion-menu__label">Top level</span>
              </button>
            )}
            {targets.map((t) => (
              <button
                type="button"
                key={t.id}
                className="suggestion-menu__item"
                onMouseDown={(e) => { e.preventDefault(); move(t.id); }}
              >
                <span className="suggestion-menu__label">{t.title || 'Untitled'}</span>
              </button>
            ))}
            {!targets.length && !page.parentId && (
              <div className="suggestion-menu__empty">No other pages in this space</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default MovePageMenu;
