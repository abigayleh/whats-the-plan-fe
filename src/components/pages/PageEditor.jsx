import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import {
  useParams, useNavigate, useOutletContext, Link,
} from 'react-router-dom';
import * as pagesApi from '../../api/pages';
import { TrashIcon } from '../layout/icons';
import { socket } from '../../socket/socketClient';
import useDebouncedCallback from '../../hooks/useDebouncedCallback';
import { ancestorsOf } from '../../utils/pageTree';
import PageDocument from './PageDocument';
import MovePageMenu from './MovePageMenu';
import PageIconPicker from './PageIconPicker';

const SAVE_LABEL = { saving: 'Saving…', saved: 'Saved', idle: '' };

// The right pane: loads a page's full content, edits title + document, autosaves both.
function PageEditor() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const {
    pages, canManagePage, saveContent, updatePage, deletePage,
  } = useOutletContext();

  const [page, setPage] = useState(null);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('loading'); // loading | ready | missing
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved
  const [staleRemote, setStaleRemote] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const lastSave = useRef(0); // timestamp of our last write, to ignore our own socket echo

  useEffect(() => {
    let active = true;
    setStatus('loading');
    setStaleRemote(false);
    pagesApi.get(pageId)
      .then((p) => {
        if (!active) return;
        setPage(p);
        setTitle(p.title || '');
        setStatus('ready');
      })
      .catch(() => { if (active) setStatus('missing'); });
    return () => { active = false; };
  }, [pageId, reloadKey]);

  // Nudge (don't clobber) when this page is edited elsewhere; skip our own save echo.
  useEffect(() => {
    const onUpdated = (payload) => {
      if (payload?.id !== pageId) return;
      if (Date.now() - lastSave.current < 2500) return;
      setStaleRemote(true);
    };
    socket.on('page:updated', onUpdated);
    return () => socket.off('page:updated', onUpdated);
  }, [pageId]);

  const editable = page ? canManagePage(page) : false;

  // Same-scope pages (excluding this one) are the only ones the @-link picker offers.
  const scopePages = useMemo(
    () => pages.filter((p) => p.id !== pageId && (p.groupId || null) === ((page?.groupId) || null)),
    [pages, pageId, page],
  );
  const trail = useMemo(() => ancestorsOf(pageId, pages), [pageId, pages]);

  const [saveTitle, flushTitle] = useDebouncedCallback((id, value) => {
    lastSave.current = Date.now();
    updatePage(id, { title: value.trim() || 'Untitled' });
  }, 800);

  const [persist, flushPersist] = useDebouncedCallback(async (id, content) => {
    setSaveState('saving');
    // Stamp before the request: the server emits page:updated before it responds,
    // so a later stamp would let our own echo trip the "changed elsewhere" nudge.
    lastSave.current = Date.now();
    try {
      await saveContent(id, content);
      setSaveState('saved');
    } catch {
      setSaveState('idle');
    }
  }, 800);

  // Flush pending title + content saves before switching pages, so nothing lags mid-edit.
  useEffect(() => () => { flushPersist(); flushTitle(); }, [pageId, flushPersist, flushTitle]);

  function handleTitle(e) {
    setTitle(e.target.value);
    saveTitle(pageId, e.target.value);
  }

  async function handleMove(parentId) {
    lastSave.current = Date.now();
    await updatePage(pageId, { parentId });
    setPage((prev) => (prev ? { ...prev, parentId } : prev));
  }

  async function handleIcon(icon) {
    lastSave.current = Date.now();
    await updatePage(pageId, { icon });
    setPage((prev) => (prev ? { ...prev, icon } : prev));
  }

  async function handleDelete() {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Delete this page? Its subpages move up a level.')) return;
    await deletePage(pageId);
    navigate('/pages');
  }

  if (status === 'loading') return <div className="page-editor page-editor--state">Loading…</div>;
  if (status === 'missing') return <div className="page-editor page-editor--state">This page is unavailable.</div>;

  return (
    <div className="page-editor">
      <div className="page-editor__bar">
        {trail.length > 0 && (
          <nav className="page-editor__trail">
            {trail.map((p) => (
              <Link key={p.id} to={`/pages/${p.id}`} className="page-editor__crumb">
                {p.title || 'Untitled'}
              </Link>
            ))}
          </nav>
        )}
        <div className="page-editor__actions">
          <span className="page-editor__save">{SAVE_LABEL[saveState]}</span>
          {editable && <MovePageMenu page={page} pages={pages} onMove={handleMove} />}
          {editable && (
            <button
              type="button"
              className="task-actions__button task-actions__button--danger"
              onClick={handleDelete}
              aria-label="Delete page"
              data-tooltip="Delete page"
            >
              <TrashIcon width={15} height={15} />
            </button>
          )}
        </div>
      </div>

      {staleRemote && (
        <div className="page-editor__stale">
          This page changed elsewhere.
          <button type="button" className="button button--ghost button--sm" onClick={() => setReloadKey((k) => k + 1)}>
            Reload
          </button>
        </div>
      )}

      <PageIconPicker icon={page.icon ?? null} onChange={handleIcon} disabled={!editable} />

      <input
        className="page-editor__title"
        value={title}
        onChange={handleTitle}
        onBlur={() => flushTitle()}
        placeholder="Untitled"
        disabled={!editable}
      />

      <PageDocument
        key={`${pageId}:${reloadKey}`}
        content={page.content}
        editable={editable}
        onChange={(content) => persist(pageId, content)}
        pages={pages}
        scopePages={scopePages}
      />
    </div>
  );
}

export default PageEditor;
