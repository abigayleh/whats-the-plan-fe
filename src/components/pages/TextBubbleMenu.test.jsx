import { useEffect } from 'react';
import {
  describe, it, expect, vi, afterEach,
} from 'vitest';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  render, screen, waitFor, act, userEvent,
} from '../../test/utils';
import TextBubbleMenu from './TextBubbleMenu';
import textFormat from './extensions/textFormat';
import indent from './extensions/indent';

// A minimal editor holding the marks the bubble drives, handed back so tests can move
// the selection the way a real drag-highlight would.
function Harness({ onReady }) {
  const editor = useEditor({
    extensions: [StarterKit, textFormat, indent],
    content: '<p>Hello world</p>',
  });
  useEffect(() => { if (editor) onReady(editor); }, [editor, onReady]);
  return (
    <>
      <TextBubbleMenu editor={editor} />
      <EditorContent editor={editor} className="page-doc" />
    </>
  );
}

async function setup() {
  const onReady = vi.fn();
  render(<Harness onReady={onReady} />);
  await waitFor(() => expect(onReady).toHaveBeenCalled());
  const editor = onReady.mock.calls[0][0];

  const select = async (from, to) => {
    await act(async () => { editor.commands.setTextSelection({ from, to }); });
  };
  // The bubble is positioned on a debounce, so it lands a tick after the selection.
  const highlight = async () => {
    await select(1, 6);
    await screen.findByRole('group', { name: 'Text colour' });
  };
  const press = async (name) => {
    await highlight();
    await userEvent.click(screen.getByRole('button', { name }));
  };
  const marksOfFirstText = () => editor.getJSON().content[0].content[0].marks;

  return {
    editor, select, highlight, press, marksOfFirstText,
  };
}

const colours = () => screen.queryByRole('group', { name: 'Text colour' });

const setViewport = (mobile) => {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: mobile, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }));
};

describe('TextBubbleMenu on a phone', () => {
  afterEach(() => {
    setViewport(false);
    document.body.classList.remove('is-formatting');
  });

  it('docks the controls to the bottom edge instead of floating them', async () => {
    setViewport(true);
    const { highlight } = await setup();
    await highlight();
    expect(document.querySelector('.page-doc__bubble--docked')).toBeInTheDocument();
    expect(screen.getByRole('toolbar', { name: 'Formatting' })).toBeInTheDocument();
  });

  // The docked bar and the tab bar both own the bottom edge, so they cannot coexist.
  it('yields the bottom edge by the tab bar only while text is selected', async () => {
    setViewport(true);
    const { select, highlight } = await setup();
    expect(document.body).not.toHaveClass('is-formatting');

    await highlight();
    expect(document.body).toHaveClass('is-formatting');

    await select(1, 1);
    await waitFor(() => expect(document.body).not.toHaveClass('is-formatting'));
  });

  it('still floats beside the selection on desktop', async () => {
    setViewport(false);
    const { highlight } = await setup();
    await highlight();
    expect(document.querySelector('.page-doc__bubble--docked')).toBeNull();
    expect(document.body).not.toHaveClass('is-formatting');
  });
});

describe('TextBubbleMenu', () => {
  it('stays hidden until text is selected, and hides again when the selection collapses', async () => {
    const { select, highlight } = await setup();
    expect(colours()).not.toBeInTheDocument();

    await highlight();
    expect(screen.getByRole('group', { name: 'Text size' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Indentation' })).toBeInTheDocument();

    await select(1, 1);
    await waitFor(() => expect(colours()).not.toBeInTheDocument());
  });

  it('applies a colour to the selection and keeps it in the saved document', async () => {
    const { press, marksOfFirstText } = await setup();

    await press('Colour teal');

    expect(marksOfFirstText()).toEqual([{ type: 'textFormat', attrs: { color: 'teal', size: null } }]);
  });

  it('keeps the colour when a size is added on top', async () => {
    const { press, marksOfFirstText } = await setup();

    await press('Colour amber');
    await press('Large');

    expect(marksOfFirstText()[0].attrs).toEqual({ color: 'amber', size: 'lg' });
  });

  it('drops the mark entirely when both colour and size are cleared', async () => {
    const { press, marksOfFirstText } = await setup();

    await press('Colour coral');
    await press('Default colour');

    expect(marksOfFirstText()).toBeUndefined();
  });

  it('indents and outdents the selected block', async () => {
    const { editor, press } = await setup();

    await press('Indent');
    expect(editor.getJSON().content[0].attrs.indent).toBe(1);

    await press('Outdent');
    expect(editor.getJSON().content[0].attrs.indent).toBe(0);
  });

  it('renders nothing while the editor is still starting up', () => {
    const { container } = render(<TextBubbleMenu editor={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a saved colour, size and indent back onto the document', async () => {
    const { editor } = await setup();

    await act(async () => {
      editor.commands.setContent({
        type: 'doc',
        content: [{
          type: 'paragraph',
          attrs: { indent: 2 },
          content: [{
            type: 'text',
            text: 'Hi',
            marks: [{ type: 'textFormat', attrs: { color: 'blue', size: 'xl' } }],
          }],
        }],
      });
    });

    const span = document.querySelector('.page-text');
    expect(span).toHaveAttribute('data-color', 'blue');
    expect(span).toHaveAttribute('data-size', 'xl');
    expect(document.querySelector('p[data-indent="2"]')).toBeInTheDocument();
  });
});