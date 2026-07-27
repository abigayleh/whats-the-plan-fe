import { describe, it, expect } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import indent from './indent';

const editorWith = (content) => new Editor({
  element: document.createElement('div'),
  extensions: [StarterKit, indent],
  content,
});

describe('indent extension', () => {
  it('steps a plain block up to a ceiling and back down to zero', () => {
    const editor = editorWith('<p>Hello</p>');
    const level = () => editor.getJSON().content[0].attrs.indent;

    for (let i = 0; i < 6; i += 1) editor.commands.indentBlock();
    expect(level()).toBe(4);

    for (let i = 0; i < 6; i += 1) editor.commands.outdentBlock();
    expect(level()).toBe(0);
  });

  it('nests the list item instead when the cursor is inside a list', () => {
    const editor = editorWith('<ul><li><p>One</p></li><li><p>Two</p></li></ul>');
    editor.commands.setTextSelection(9);

    editor.commands.indentBlock();

    // The second item becomes a sublist of the first, so the outer list has one child.
    const [list] = editor.getJSON().content;
    expect(list.content).toHaveLength(1);
    expect(list.content[0].content[1].type).toBe('bulletList');
  });

  it('keeps the level in the saved document', () => {
    const editor = editorWith({
      type: 'doc',
      content: [{ type: 'paragraph', attrs: { indent: 3 }, content: [{ type: 'text', text: 'Hi' }] }],
    });
    expect(editor.getJSON().content[0].attrs.indent).toBe(3);
    expect(editor.getHTML()).toContain('data-indent="3"');
  });
});