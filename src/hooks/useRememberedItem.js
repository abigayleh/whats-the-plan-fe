import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorageState from './useLocalStorageState';

// Two-pane sections (Pages, Itinerary) remember the last item opened and reopen it when the
// user lands on the bare section root, instead of showing the empty state. Skips while the
// list is still loading and if the remembered item no longer exists.
export default function useRememberedItem({
  storageKey, currentId, atRoot, loading, items, pathPrefix,
}) {
  const navigate = useNavigate();
  const [lastId, setLastId] = useLocalStorageState(storageKey, null);

  useEffect(() => { if (currentId) setLastId(currentId); }, [currentId, setLastId]);

  useEffect(() => {
    if (!atRoot || loading || !lastId) return;
    if (!items.some((it) => it.id === lastId)) return;
    navigate(`${pathPrefix}/${lastId}`, { replace: true });
  }, [atRoot, loading, lastId, items, pathPrefix, navigate]);
}