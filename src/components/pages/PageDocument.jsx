import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

// The TipTap document. Keyed by pageId upstream, so it remounts per page with fresh content.
function PageDocument({ content, editable, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || '',
    editable,
    onUpdate: ({ editor: ed }) => onChange(ed.getJSON()),
  });

  useEffect(() => { editor?.setEditable(editable); }, [editor, editable]);

  return <EditorContent editor={editor} className="page-doc" />;
}

export default PageDocument;
