// Renders text with any http(s) URLs turned into clickable links. stopPropagation keeps a
// link click from also triggering an enclosing clickable row/chip (which opens the item).
const URL_RE = /(https?:\/\/[^\s]+)/g;

function Linkify({ text }) {
  if (!text) return null;
  return String(text).split(URL_RE).map((part, i) => (part.match(/^https?:\/\//)
    ? (
      <a
        // eslint-disable-next-line react/no-array-index-key
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        {part}
      </a>
    )
    : part));
}

export default Linkify;
