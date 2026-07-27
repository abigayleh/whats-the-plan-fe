import { Extension } from '@tiptap/core';

const BLOCKS = ['paragraph', 'heading'];
const LIST_ITEMS = ['taskItem', 'listItem'];
const MAX_INDENT = 4;

// Steps the `indent` attribute of every block in the selection; no-ops at the ends of
// the range. setNodeMarkup keeps positions stable, so iterating the live doc is safe.
const shiftBlocks = (step) => ({ state, tr, dispatch }) => {
  let changed = false;
  state.doc.nodesBetween(state.selection.from, state.selection.to, (node, pos) => {
    if (!BLOCKS.includes(node.type.name)) return;
    const indent = Math.min(MAX_INDENT, Math.max(0, node.attrs.indent + step));
    if (indent === node.attrs.indent) return;
    tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent });
    changed = true;
  });
  if (changed && dispatch) dispatch(tr);
  return changed;
};

const listItemAt = (editor) => LIST_ITEMS.find((name) => editor.isActive(name));

// Inside a list, indenting nests the item; anywhere else it steps a data-indent level
// that the stylesheet turns into a left margin.
const Indent = Extension.create({
  name: 'indent',

  addGlobalAttributes() {
    return [{
      types: BLOCKS,
      attributes: {
        indent: {
          default: 0,
          parseHTML: (el) => Number(el.getAttribute('data-indent')) || 0,
          renderHTML: ({ indent }) => (indent ? { 'data-indent': indent } : {}),
        },
      },
    }];
  },

  addCommands() {
    return {
      indentBlock: () => (props) => {
        const item = listItemAt(props.editor);
        return item ? props.commands.sinkListItem(item) : shiftBlocks(1)(props);
      },
      outdentBlock: () => (props) => {
        const item = listItemAt(props.editor);
        return item ? props.commands.liftListItem(item) : shiftBlocks(-1)(props);
      },
    };
  },
});

export default Indent;