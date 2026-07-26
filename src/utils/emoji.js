// Emoji are frequently multi-codepoint — flags, skin tones, ZWJ sequences like 👩‍💻 — so the
// first *grapheme* is what a user means by "one emoji". [...str][0] would split those apart.
export function firstEmoji(value) {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return null;
  if (typeof Intl === 'undefined' || !Intl.Segmenter) return [...trimmed][0] ?? null;
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  return [...segmenter.segment(trimmed)][0]?.segment ?? null;
}