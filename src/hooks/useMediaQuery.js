import { useEffect, useState } from 'react';

// Tracks whether a CSS media query currently matches, so components can adapt behavior
// (not just styles) to viewport — e.g. force the nav open on mobile.
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}
