import { useEffect, useMemo, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import { TaskList, TaskItem } from '@tiptap/extension-list';
import Image from '@tiptap/extension-image';
import PagesEditorContext from './PagesEditorContext';
import TableToolbar from './TableToolbar';
import PageLink from './extensions/PageLink';
import slashCommand from './extensions/slashCommand';
import linkShortcut from './extensions/linkShortcut';
import pageMention from './extensions/pageMention';

// The TipTap document. Keyed by pageId upstream, so it remounts per page with fresh content.
// `pages` resolves link-chip titles; `scopePages` feeds the @-mention picker (same scope only).
function PageDocument({
  content, editable, onChange, pages, scopePages,
}) {
  // A ref keeps the mention picker reading the latest same-scope pages without rebuilding the editor.
  const scopeRef = useRef(scopePages);
  useEffect(() => { scopeRef.current = scopePages; }, [scopePages]);

  const extensions = useMemo(() => [
    // StarterKit v3 bundles the Link mark, so configure it here rather than adding a second Link.
    StarterKit.configure({
      link: {
        openOnClick: true,
        autolink: true,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer nofollow' },
      },
    }),
    TableKit,
    TaskList,
    TaskItem.configure({ nested: true }),
    Image.configure({ inline: true }),
    PageLink,
    slashCommand,
    linkShortcut,
    pageMention.configure({ getPages: () => scopeRef.current }),
  ], []);

  const editor = useEditor({
    extensions,
    content: content || '',
    editable,
    onUpdate: ({ editor: ed }) => onChange(ed.getJSON()),
  });

  useEffect(() => { editor?.setEditable(editable); }, [editor, editable]);

  const ctx = useMemo(() => ({ pages }), [pages]);

  return (
    <PagesEditorContext.Provider value={ctx}>
      <div className="page-doc-wrap">
        {editable && <TableToolbar editor={editor} />}
        <EditorContent editor={editor} className="page-doc" />
      </div>
    </PagesEditorContext.Provider>
  );
}

export default PageDocument;
