import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorageState from './useLocalStorageState';
import useMediaQuery from './useMediaQuery';
import { MOBILE_QUERY } from '../constants/breakpoints';

// Two-pane sections (Pages, Itinerary) remember the last item opened and reopen it when the
// user lands on the bare section root, instead of showing the empty state. Skips while the
// list is still loading and if the remembered item no longer exists.
export default function useRememberedItem({
  storageKey, currentId, atRoot, loading, items, pathPrefix,
}) {
  const navigate = useNavigate();
  const [lastId, setLastId] = useLocalStorageState(storageKey, null);
  // On a phone the root *is* the list screen, so reopening the last item would bounce the
  // user straight back into the detail, leaving no way to reach the list at all.
  const isMobile = useMediaQuery(MOBILE_QUERY);

  useEffect(() => { if (currentId) setLastId(currentId); }, [currentId, setLastId]);

  useEffect(() => {
    if (isMobile || !atRoot || loading || !lastId) return;
    if (!items.some((it) => it.id === lastId)) return;
    navigate(`${pathPrefix}/${lastId}`, { replace: true });
  }, [isMobile, atRoot, loading, lastId, items, pathPrefix, navigate]);
}