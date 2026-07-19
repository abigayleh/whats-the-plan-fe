import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { useNavigate } from 'react-router-dom';
import { PagesIcon } from '../../layout/icons';
import { usePagesEditor } from '../PagesEditorContext';

// The rendered chip. Title is resolved live from the loaded pages, so it never goes stale;
// a link to a deleted page degrades to a disabled "Deleted page".
function PageLinkChip({ node }) {
  const { pageId } = node.attrs;
  const { pages } = usePagesEditor();
  const navigate = useNavigate();
  const target = pages.find((p) => p.id === pageId);

  return (
    <NodeViewWrapper as="span" className="page-link">
      <button
        type="button"
        className={`page-link__chip${target ? '' : ' page-link__chip--dead'}`}
        contentEditable={false}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => target && navigate(`/pages/${pageId}`)}
        disabled={!target}
      >
        <PagesIcon width={13} height={13} />
        {target ? (target.title || 'Untitled') : 'Deleted page'}
      </button>
    </NodeViewWrapper>
  );
}

// Inline atom holding just a pageId; everything visible is derived from live page data.
const PageLink = Node.create({
  name: 'pageLink',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return { pageId: { default: null } };
  },

  parseHTML() {
    return [{ tag: 'span[data-page-link]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes({ 'data-page-link': '' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PageLinkChip);
  },
});

export default PageLink;
