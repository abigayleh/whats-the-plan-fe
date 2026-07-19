import { createContext, useContext } from 'react';

// Gives page-link chips the current page list so they can resolve a linked page's
// title at render time (never a stale stored title).
const PagesEditorContext = createContext({ pages: [] });

export const usePagesEditor = () => useContext(PagesEditorContext);

export default PagesEditorContext;
