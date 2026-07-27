import { Mark, mergeAttributes } from '@tiptap/core';

// Keys of $accent-map in styles/abstracts/_variables.scss — the palette is applied by
// the stylesheet, so the stored document only ever holds the key, never a hex value.
export const TEXT_COLORS = ['primary', 'coral', 'teal', 'amber', 'blue'];
export const TEXT_SIZES = ['sm', 'lg', 'xl'];

const attribute = (name, allowed) => ({
  default: null,
  parseHTML: (el) => (allowed.includes(el.dataset[name]) ? el.dataset[name] : null),
  renderHTML: (attrs) => (attrs[name] ? { [`data-${name}`]: attrs[name] } : {}),
});

// Colour and size share one mark so setting either keeps the other (TipTap's setMark
// merges attributes), and both round-trip as plain attrs in the saved JSON document.
const TextFormat = Mark.create({
  name: 'textFormat',

  addAttributes() {
    return { color: attribute('color', TEXT_COLORS), size: attribute('size', TEXT_SIZES) };
  },

  parseHTML() {
    return [{ tag: 'span[data-color]' }, { tag: 'span[data-size]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes({ class: 'page-text' }, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      // Dropping both attributes removes the mark rather than leaving an empty span behind.
      setTextFormat: (attrs) => ({ editor, commands }) => {
        const next = { ...editor.getAttributes(this.name), ...attrs };
        if (!next.color && !next.size) return commands.unsetMark(this.name);
        return commands.setMark(this.name, next);
      },
    };
  },
});

export default TextFormat;