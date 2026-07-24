import { Extension } from '@tiptap/core';
import { promptUrl, normalizeUrl } from './urlPrompt';

// Cmd/Ctrl+K on a text selection opens the shared URL input to add/edit/remove a link.
const LinkShortcut = Extension.create({
  name: 'linkShortcut',

  addKeyboardShortcuts() {
    return {
      'Mod-k': () => {
        const { editor } = this;
        if (editor.state.selection.empty) return false;
        promptUrl({
          editor,
          initial: editor.getAttributes('link').href || '',
          onSubmit: (url) => {
            const chain = editor.chain().focus().extendMarkRange('link');
            if (url) chain.setLink({ href: normalizeUrl(url) }).run();
            else chain.unsetLink().run();
          },
        });
        return true;
      },
    };
  },
});

export default LinkShortcut;
