import { useEffect, useMemo, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import { TaskList, TaskItem } from '@tiptap/extension-list';
import PagesEditorContext from './PagesEditorContext';
import PageLink from './extensions/PageLink';
import slashCommand from './extensions/slashCommand';
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
    StarterKit,
    TableKit,
    TaskList,
    TaskItem.configure({ nested: true }),
    PageLink,
    slashCommand,
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
      <EditorContent editor={editor} className="page-doc" />
    </PagesEditorContext.Provider>
  );
}

export default PageDocument;
