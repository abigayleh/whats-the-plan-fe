import {
  useState, useEffect, useCallback, useRef,
} from 'react';
import * as pagesApi from '../api/pages';
import { adaptPage } from '../api/adapters';
import { socket } from '../socket/socketClient';

const EVENTS = ['page:created', 'page:updated', 'page:deleted'];

// Pages live only on the Pages route, so they get their own store (like usePolls).
// The tree holds metadata only; PageEditor fetches a page's content on demand.
export default function usePages() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const latest = useRef(0);

  const refresh = useCallback(async () => {
    // Ticketed so a slower earlier fetch never overwrites a newer one.
    const ticket = latest.current + 1;
    latest.current = ticket;
    try {
      const rows = await pagesApi.list();
      if (ticket !== latest.current) return;
      setPages(rows.map(adaptPage));
    } catch {
      // ignore — a failed refresh leaves the last known pages in place
    } finally {
      if (ticket === latest.current) setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const on = () => refresh();
    EVENTS.forEach((e) => socket.on(e, on));
    return () => EVENTS.forEach((e) => socket.off(e, on));
  }, [refresh]);

  const addPage = useCallback(async (body) => {
    const created = await pagesApi.create(body);
    await refresh();
    return adaptPage(created);
  }, [refresh]);

  const updatePage = useCallback(async (id, patch) => {
    await pagesApi.update(id, patch);
    await refresh();
  }, [refresh]);

  const movePage = useCallback((id, parentId) => updatePage(id, { parentId }), [updatePage]);

  const deletePage = useCallback(async (id) => {
    await pagesApi.remove(id);
    await refresh();
  }, [refresh]);

  // Autosave: persist content without a local refresh, so the editor keeps the cursor.
  const saveContent = useCallback((id, content) => pagesApi.update(id, { content }), []);

  return {
    pages, loading, refresh, addPage, updatePage, movePage, deletePage, saveContent,
  };
}
