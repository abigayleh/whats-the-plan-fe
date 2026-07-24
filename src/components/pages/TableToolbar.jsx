import { useEditorState } from '@tiptap/react';
import { TableIcon, CloseIcon } from '../layout/icons';
import useLocalStorageState from '../../hooks/useLocalStorageState';

// Contextual controls shown only while the cursor is inside a table — TableKit ships the
// commands but no UI. onMouseDown+preventDefault keeps the table selection from collapsing.
// The bar sticks to the top of the editor and can be minimized to a small handle.
const ACTIONS = [
  { label: 'Column +', run: (c) => c.addColumnAfter() },
  { label: 'Column −', run: (c) => c.deleteColumn() },
  { label: 'Row +', run: (c) => c.addRowAfter() },
  { label: 'Row −', run: (c) => c.deleteRow() },
  { label: 'Delete table', run: (c) => c.deleteTable(), danger: true },
];

function TableToolbar({ editor }) {
  const inTable = useEditorState({ editor, selector: ({ editor: e }) => e?.isActive('table') ?? false });
  const [minimized, setMinimized] = useLocalStorageState('pages-table-toolbar-minimized', false);
  if (!editor || !inTable) return null;

  if (minimized) {
    return (
      <div className="page-doc__table-toolbar page-doc__table-toolbar--min" contentEditable={false}>
        <button
          type="button"
          className="button button--ghost button--sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setMinimized(false)}
          aria-label="Show table controls"
          data-tooltip="Table controls"
        >
          <TableIcon width={15} height={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="page-doc__table-toolbar" contentEditable={false}>
      {ACTIONS.map((action) => (
        <button
          key={action.label}
          type="button"
          className={`button button--ghost button--sm${action.danger ? ' page-doc__table-toolbar-danger' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); action.run(editor.chain().focus()).run(); }}
        >
          {action.label}
        </button>
      ))}
      <button
        type="button"
        className="button button--ghost button--sm page-doc__table-toolbar-min-btn"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setMinimized(true)}
        aria-label="Minimize table controls"
        data-tooltip="Minimize"
      >
        <CloseIcon width={14} height={14} />
      </button>
    </div>
  );
}

export default TableToolbar;