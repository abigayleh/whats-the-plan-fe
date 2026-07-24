import { useEditorState } from '@tiptap/react';

// Contextual controls shown only while the cursor is inside a table — TableKit ships the
// commands but no UI. onMouseDown+preventDefault keeps the table selection from collapsing.
const ACTIONS = [
  { label: 'Column +', run: (c) => c.addColumnAfter() },
  { label: 'Column −', run: (c) => c.deleteColumn() },
  { label: 'Row +', run: (c) => c.addRowAfter() },
  { label: 'Row −', run: (c) => c.deleteRow() },
  { label: 'Delete table', run: (c) => c.deleteTable(), danger: true },
];

function TableToolbar({ editor }) {
  const inTable = useEditorState({ editor, selector: ({ editor: e }) => e?.isActive('table') ?? false });
  if (!editor || !inTable) return null;

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
    </div>
  );
}

export default TableToolbar;