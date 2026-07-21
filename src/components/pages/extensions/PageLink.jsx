import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { Link } from 'react-router-dom';
import { PagesIcon } from '../../layout/icons';
import { usePagesEditor } from '../PagesEditorContext';

// The rendered chip. Title is resolved live from the loaded pages, so it never goes stale;
// a link to a deleted page degrades to a non-navigable "Deleted page".
function PageLinkChip({ node }) {
  const { pageId } = node.attrs;
  const { pages } = usePagesEditor();
  const target = pages.find((p) => p.id === pageId);

  if (!target) {
    return (
      <NodeViewWrapper as="span" className="page-link">
        <span className="page-link__chip page-link__chip--dead" contentEditable={false}>
          <PagesIcon width={13} height={13} />
          Deleted page
        </span>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper as="span" className="page-link">
      <Link
        to={`/pages/${pageId}`}
        className="page-link__chip"
        contentEditable={false}
        onMouseDown={(e) => {
          // A real click still needs preventDefault so the editor doesn't steal it as a
          // text-selection anchor — but let modifier/middle-clicks fall through untouched
          // so cmd/ctrl/middle-click can open the page in a new tab natively.
          if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          e.preventDefault();
        }}
      >
        <PagesIcon width={13} height={13} />
        {target.title || 'Untitled'}
      </Link>
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
