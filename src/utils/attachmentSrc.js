const PREFIX = 'attachment:';

// Images embedded in a page store a reference, not the bytes: the document JSON is re-sent
// whole on every autosave, so inlining even one screenshot pushed it past the API's body
// limit and the save failed silently. The node view resolves this back to a blob URL.
export const attachmentSrc = (id) => `${PREFIX}${id}`;

export const attachmentIdFrom = (src) => (
  typeof src === 'string' && src.startsWith(PREFIX) && src.length > PREFIX.length
    ? src.slice(PREFIX.length)
    : null
);