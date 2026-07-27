import { useEditorState } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { TEXT_COLORS, TEXT_SIZES } from './extensions/textFormat';

const SIZE_LABELS = { sm: 'Small', lg: 'Large', xl: 'Huge' };
const INDENT_ACTIONS = [
  { label: 'Outdent', run: (c) => c.outdentBlock() },
  { label: 'Indent', run: (c) => c.indentBlock() },
];

// A leading null in each set is the "clear it" option.
const COLORS = [null, ...TEXT_COLORS];
const SIZES = [null, ...TEXT_SIZES];

const hasTextSelection = (editor) => Boolean(editor) && !editor.state.selection.empty;

// Formatting controls that follow the text selection. BubbleMenu keeps its portal
// mounted and only toggles visibility, so the controls are gated on the same predicate
// to keep them out of the DOM (and the tab order) when nothing is selected.
function TextBubbleMenu({ editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      open: hasTextSelection(e),
      color: e?.getAttributes('textFormat').color ?? null,
      size: e?.getAttributes('textFormat').size ?? null,
    }),
  });

  if (!editor) return null;

  // preventDefault on mousedown keeps the selection alive while the button is pressed.
  const run = (event, apply) => {
    event.preventDefault();
    apply(editor.chain().focus()).run();
  };

  return (
    <BubbleMenu
      editor={editor}
      className="page-doc__bubble"
      shouldShow={({ editor: e }) => hasTextSelection(e)}
    >
      {state.open && (
        <>
          <div className="page-doc__bubble-group" role="group" aria-label="Text colour">
            {COLORS.map((color) => (
              <button
                key={color || 'default'}
                type="button"
                className="page-doc__swatch"
                data-color={color}
                aria-pressed={state.color === color}
                aria-label={color ? `Colour ${color}` : 'Default colour'}
                onMouseDown={(e) => run(e, (c) => c.setTextFormat({ color }))}
              />
            ))}
          </div>

          <div className="page-doc__bubble-group" role="group" aria-label="Text size">
            {SIZES.map((size) => (
              <button
                key={size || 'default'}
                type="button"
                className="button button--ghost button--sm"
                aria-pressed={state.size === size}
                onMouseDown={(e) => run(e, (c) => c.setTextFormat({ size }))}
              >
                {size ? SIZE_LABELS[size] : 'Normal'}
              </button>
            ))}
          </div>

          <div className="page-doc__bubble-group" role="group" aria-label="Indentation">
            {INDENT_ACTIONS.map((action) => (
              <button
                key={action.label}
                type="button"
                className="button button--ghost button--sm"
                onMouseDown={(e) => run(e, action.run)}
              >
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </BubbleMenu>
  );
}

export default TextBubbleMenu;