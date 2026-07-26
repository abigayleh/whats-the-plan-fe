import { useEffect, useRef, useState } from 'react';
import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { clampImageWidth, MIN_IMAGE_WIDTH } from '../../../utils/imageWidth';
import { attachmentIdFrom } from '../../../utils/attachmentSrc';
import * as attachmentsApi from '../../../api/attachments';

// Files sit behind Bearer auth, so an `attachment:<id>` reference can't go straight into an
// <img src>. It's fetched as a blob and shown through an object URL, revoked on the way out
// so a long editing session doesn't leak them.
function useAttachmentUrl(src) {
  const attachmentId = attachmentIdFrom(src);
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!attachmentId) return undefined;
    let active = true;
    let created = null;
    setFailed(false);
    attachmentsApi.objectUrl(attachmentId)
      .then((next) => {
        if (!active) { URL.revokeObjectURL(next); return; }
        created = next;
        setUrl(next);
      })
      .catch(() => { if (active) setFailed(true); });
    return () => {
      active = false;
      if (created) URL.revokeObjectURL(created);
    };
  }, [attachmentId]);

  // A plain URL needs no resolving.
  if (!attachmentId) return { url: src, failed: false };
  return { url, failed };
}

// Drag the corner handle to resize. The width is held in local state during the drag and
// written to the document only on release — updating per pointer-move would fire the page's
// autosave on every pixel, and the whole document goes up on each save.
function ResizableImageView({ node, updateAttributes, selected, editor }) {
  const { src, alt, title, width } = node.attrs;
  const { url, failed } = useAttachmentUrl(src);
  const wrapRef = useRef(null);
  const [dragWidth, setDragWidth] = useState(null);
  const shown = dragWidth ?? width;

  function startResize(event) {
    event.preventDefault();
    const image = wrapRef.current?.querySelector('img');
    if (!image) return;
    const startX = event.clientX;
    const startWidth = image.getBoundingClientRect().width;
    const max = wrapRef.current?.parentElement?.getBoundingClientRect().width;
    const widthAt = (e) => clampImageWidth(startWidth + (e.clientX - startX), max);

    const onMove = (e) => setDragWidth(widthAt(e));
    const onUp = (e) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setDragWidth(null);
      updateAttributes({ width: Math.round(widthAt(e)) });
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  return (
    <NodeViewWrapper
      as="span"
      ref={wrapRef}
      className={`page-image${selected ? ' page-image--selected' : ''}`}
    >
      {failed && <span className="page-image__failed" contentEditable={false}>Image unavailable</span>}
      {!failed && !url && <span className="page-image__loading" contentEditable={false} />}
      {url && (
        <img
          src={url}
          alt={alt || ''}
          title={title || undefined}
          draggable={false}
          style={shown ? { width: `${shown}px` } : undefined}
        />
      )}
      {url && editor.isEditable && (
        <span
          className="page-image__handle"
          role="slider"
          tabIndex={0}
          aria-label="Resize image"
          aria-valuenow={Math.round(shown || 0)}
          aria-valuemin={MIN_IMAGE_WIDTH}
          onPointerDown={startResize}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 100 : 20;
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
            e.preventDefault();
            const current = wrapRef.current?.querySelector('img')?.getBoundingClientRect().width ?? 0;
            const max = wrapRef.current?.parentElement?.getBoundingClientRect().width;
            const next = current + (e.key === 'ArrowRight' ? step : -step);
            updateAttributes({ width: Math.round(clampImageWidth(next, max)) });
          }}
        />
      )}
    </NodeViewWrapper>
  );
}

// Adds a persisted `width` to the stock image node — everything else is inherited.
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const raw = element.getAttribute('width') || element.style.width;
          const parsed = parseInt(raw, 10);
          return Number.isFinite(parsed) ? parsed : null;
        },
        renderHTML: ({ width }) => (width ? { width } : {}),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

export default ResizableImage;