import { useEffect, useMemo, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import { TaskList, TaskItem } from '@tiptap/extension-list';
import PagesEditorContext from './PagesEditorContext';
import TableToolbar from './TableToolbar';
import PageLink from './extensions/PageLink';
import slashCommand from './extensions/slashCommand';
import linkShortcut from './extensions/linkShortcut';
import pageMention from './extensions/pageMention';
import ResizableImage from './extensions/ResizableImage';
import { imageFilesFrom, fileToScaledBlob } from '../../utils/image';
import { attachmentSrc } from '../../utils/attachmentSrc';
import * as attachmentsApi from '../../api/attachments';

// A pasted image is uploaded first and the document stores only its attachment id --
// inlining the bytes pushed the whole document past the API's body limit on every save.
// Returning true claims the event so the browser doesn't also paste the file's name as
// text; the insert lands once the upload resolves, at the caret's position at paste time.
function insertImages(view, dataTransfer, pageId) {
  const files = imageFilesFrom(dataTransfer);
  if (!files.length || !pageId) return false;
  const at = view.state.selection.from;
  Promise.all(files.map(async (file) => {
    const blob = await fileToScaledBlob(file);
    const named = new File([blob], file.name || 'image.jpg', { type: blob.type || file.type });
    return attachmentsApi.upload(named, { pageId });
  }))
    .then((uploaded) => {
      const { image } = view.state.schema.nodes;
      if (!image) return;
      const tr = uploaded.reduce(
        (acc, att) => acc.insert(acc.mapping.map(at), image.create({ src: attachmentSrc(att.id) })),
        view.state.tr,
      );
      view.dispatch(tr);
    })
    .catch(() => { /* a failed upload leaves the document untouched */ });
  return true;
}

// The TipTap document. Keyed by pageId upstream, so it remounts per page with fresh content.
// `pages` resolves link-chip titles; `scopePages` feeds the @-mention picker (same scope only).
function PageDocument({
  pageId, content, editable, onChange, pages, scopePages,
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
    ResizableImage.configure({ inline: true }),
    PageLink,
    slashCommand,
    linkShortcut,
    pageMention.configure({ getPages: () => scopeRef.current }),
  ], []);

  const editor = useEditor({
    extensions,
    content: content || '',
    editable,
    editorProps: {
      handlePaste: (view, event) => insertImages(view, event.clipboardData, pageId),
      handleDrop: (view, event) => insertImages(view, event.dataTransfer, pageId),
    },
    onUpdate: ({ editor: ed }) => onChange(ed.getJSON()),
  });

  useEffect(() => { editor?.setEditable(editable); }, [editor, editable]);

  const ctx = useMemo(() => ({ pages }), [pages]);

  return (
    <PagesEditorContext.Provider value={ctx}>
      {editable && <TableToolbar editor={editor} />}
      <EditorContent editor={editor} className="page-doc" />
    </PagesEditorContext.Provider>
  );
}

export default PageDocument;
