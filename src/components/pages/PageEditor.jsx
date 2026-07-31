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
import ConfirmModal from '../common/ConfirmModal';

const SAVE_LABEL = {
  saving: 'Saving…', saved: 'Saved', error: "Couldn't save — changes are not stored", idle: '',
};

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
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error
  const [staleRemote, setStaleRemote] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState(false); // the caret is in the title or the document
  const lastSave = useRef(0); // timestamp of our last write, to ignore our own socket echo
  const unsaved = useRef(false); // an edit of ours the server hasn't accepted yet

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

  // An edit elsewhere loads straight in — unless it would land under the caret or overwrite an
  // edit of ours that hasn't been accepted yet, which is the one case still worth a nudge.
  // Our own save echo is skipped either way.
  useEffect(() => {
    const onUpdated = (payload) => {
      if (payload?.id !== pageId) return;
      if (Date.now() - lastSave.current < 2500) return;
      if (editing || unsaved.current) setStaleRemote(true);
      else setReloadKey((k) => k + 1);
    };
    socket.on('page:updated', onUpdated);
    return () => socket.off('page:updated', onUpdated);
  }, [pageId, editing]);

  const editable = page ? canManagePage(page) : false;

  // Same-scope pages (excluding this one) are the only ones the @-link picker offers.
  const scopePages = useMemo(
    () => pages.filter((p) => p.id !== pageId && (p.groupId || null) === ((page?.groupId) || null)),
    [pages, pageId, page],
  );
  const trail = useMemo(() => ancestorsOf(pageId, pages), [pageId, pages]);

  const [saveTitle, flushTitle] = useDebouncedCallback(async (id, value) => {
    lastSave.current = Date.now();
    try {
      await updatePage(id, { title: value.trim() || 'Untitled' });
      unsaved.current = false;
    } catch { /* still unsaved — a remote update must not overwrite it */ }
  }, 800);

  const [persist, flushPersist] = useDebouncedCallback(async (id, content) => {
    setSaveState('saving');
    // Stamp before the request: the server emits page:updated before it responds,
    // so a later stamp would let our own echo trip the "changed elsewhere" nudge.
    lastSave.current = Date.now();
    try {
      await saveContent(id, content);
      unsaved.current = false;
      setSaveState('saved');
    } catch {
      // Falling back to 'idle' here read as "nothing to save" — which is how a rejected
      // save (an over-limit body, say) looked exactly like a successful one.
      setSaveState('error');
    }
  }, 800);

  // Flush pending title + content saves before switching pages, so nothing lags mid-edit.
  useEffect(() => () => { flushPersist(); flushTitle(); }, [pageId, flushPersist, flushTitle]);

  function handleContent(content) {
    unsaved.current = true;
    persist(pageId, content);
  }

  function handleTitle(e) {
    unsaved.current = true;
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

  async function confirmDelete() {
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
          <span className={`page-editor__save${saveState === 'error' ? ' page-editor__save--error' : ''}`}>
            {SAVE_LABEL[saveState]}
          </span>
          {editable && <MovePageMenu page={page} pages={pages} onMove={handleMove} />}
          {editable && (
            <button
              type="button"
              className="task-actions__button task-actions__button--danger"
              onClick={() => setConfirmingDelete(true)}
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
        onFocus={() => setEditing(true)}
        onBlur={() => { setEditing(false); flushTitle(); }}
        placeholder="Untitled"
        disabled={!editable}
      />

      <PageDocument
        key={`${pageId}:${reloadKey}`}
        pageId={pageId}
        content={page.content}
        editable={editable}
        onChange={handleContent}
        onFocusChange={setEditing}
        pages={pages}
        scopePages={scopePages}
      />

      {confirmingDelete && (
        <ConfirmModal
          title="Delete page"
          message="Delete this page? Its subpages move up a level."
          onConfirm={confirmDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}

export default PageEditor;
