import { useEffect, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import { TaskList, TaskItem } from '@tiptap/extension-list';

// A basic TipTap document (headings, lists, checkboxes, tables) — the general-purpose
// subset of the Pages editor, without the page-link/mention extensions. Reuses `.page-doc`.
function RichTextEditor({ content, editable = true, onChange }) {
  const extensions = useMemo(
    () => [StarterKit, TableKit, TaskList, TaskItem.configure({ nested: true })],
    [],
  );

  const editor = useEditor({
    extensions,
    content: content || '',
    editable,
    onUpdate: ({ editor: ed }) => onChange(ed.getJSON()),
  });

  useEffect(() => { editor?.setEditable(editable); }, [editor, editable]);

  return <EditorContent editor={editor} className="page-doc" />;
}

export default RichTextEditor;