// Marks every case-insensitive occurrence of `query` inside `text`. Splitting on indices
// rather than a built regex keeps it safe for queries containing regex metacharacters.
function HighlightText({ text, query }) {
  const source = text ?? '';
  const needle = (query ?? '').trim().toLowerCase();
  if (!needle) return source;

  const haystack = source.toLowerCase();
  const parts = [];
  let cursor = 0;
  for (let at = haystack.indexOf(needle); at !== -1; at = haystack.indexOf(needle, cursor)) {
    if (at > cursor) parts.push(source.slice(cursor, at));
    parts.push(<mark key={at} className="highlight">{source.slice(at, at + needle.length)}</mark>);
    cursor = at + needle.length;
  }
  parts.push(source.slice(cursor));
  return parts;
}

export default HighlightText;