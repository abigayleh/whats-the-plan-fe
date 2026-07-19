import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';
import suggestionRender from './suggestionRender';

// Distinct key so this Suggestion plugin doesn't collide with the slash-command one.
const mentionKey = new PluginKey('pageMention');

// The "@" picker: lists pages in the current scope and inserts a pageLink node.
const PageMention = Extension.create({
  name: 'pageMention',

  addOptions() {
    return { getPages: () => [] };
  },

  addProseMirrorPlugins() {
    const { getPages } = this.options;
    return [
      Suggestion({
        editor: this.editor,
        pluginKey: mentionKey,
        char: '@',
        command: ({ editor, range, props }) => {
          editor.chain().focus().deleteRange(range)
            .insertContent([
              { type: 'pageLink', attrs: { pageId: props.id } },
              { type: 'text', text: ' ' },
            ])
            .run();
        },
        items: ({ query }) => getPages()
          .filter((p) => (p.title || 'Untitled').toLowerCase().includes(query.toLowerCase()))
          .slice(0, 8)
          .map((p) => ({ key: p.id, id: p.id, title: p.title || 'Untitled' })),
        render: () => suggestionRender({ emptyLabel: 'No pages in this space' }),
      }),
    ];
  },
});

export default PageMention;
