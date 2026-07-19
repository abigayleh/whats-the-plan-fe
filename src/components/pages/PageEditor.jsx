import { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import * as pagesApi from '../../api/pages';
import { TrashIcon } from '../layout/icons';
import useDebouncedCallback from '../../hooks/useDebouncedCallback';
import PageDocument from './PageDocument';

const SAVE_LABEL = { saving: 'Saving…', saved: 'Saved', idle: '' };

// The right pane: loads a page's full content, edits title + document, autosaves both.
function PageEditor() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const {
    canManagePage, saveContent, updatePage, deletePage,
  } = useOutletContext();

  const [page, setPage] = useState(null);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('loading'); // loading | ready | missing
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved

  useEffect(() => {
    let active = true;
    setStatus('loading');
    pagesApi.get(pageId)
      .then((p) => {
        if (!active) return;
        setPage(p);
        setTitle(p.title || '');
        setStatus('ready');
      })
      .catch(() => { if (active) setStatus('missing'); });
    return () => { active = false; };
  }, [pageId]);

  const editable = page ? canManagePage(page) : false;

  const [saveTitle, flushTitle] = useDebouncedCallback((id, value) => {
    updatePage(id, { title: value.trim() || 'Untitled' });
  }, 800);

  const [persist, flushPersist] = useDebouncedCallback(async (id, content) => {
    setSaveState('saving');
    try {
      await saveContent(id, content);
      setSaveState('saved');
    } catch {
      setSaveState('idle');
    }
  }, 800);

  // Flush a pending content save before switching pages, so nothing is lost mid-edit.
  useEffect(() => flushPersist, [pageId, flushPersist]);

  function handleTitle(e) {
    setTitle(e.target.value);
    saveTitle(pageId, e.target.value);
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
        <span className="page-editor__save">{SAVE_LABEL[saveState]}</span>
        {editable && (
          <button type="button" className="page-editor__delete" onClick={handleDelete} aria-label="Delete page">
            <TrashIcon />
          </button>
        )}
      </div>

      <input
        className="page-editor__title"
        value={title}
        onChange={handleTitle}
        onBlur={() => flushTitle()}
        placeholder="Untitled"
        disabled={!editable}
      />

      <PageDocument
        key={pageId}
        content={page.content}
        editable={editable}
        onChange={(content) => persist(pageId, content)}
      />
    </div>
  );
}

export default PageEditor;
