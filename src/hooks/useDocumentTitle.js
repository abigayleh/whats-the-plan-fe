import { useEffect } from 'react';
import { SITE_NAME } from '../constants/site';

// Names the browser tab after whatever the route is showing, and puts the site name back
// when it unmounts. Set it once per route: a nested route that also set it would race
// its parent (child effects run first, so the parent's title would win).
export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
    return () => { document.title = SITE_NAME; };
  }, [title]);
}