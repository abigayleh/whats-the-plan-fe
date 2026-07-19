import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';
import {
  ListsIcon, CheckIcon, TableIcon, PagesIcon,
} from '../../layout/icons';
import suggestionRender from './suggestionRender';

// Distinct key so this Suggestion plugin doesn't collide with the @-mention one.
const slashKey = new PluginKey('slashCommand');

// Block commands offered by the "/" menu. Each runs against the deleted "/query" range.
const COMMANDS = [
  { key: 'h1', title: 'Heading 1', command: (c) => c.toggleHeading({ level: 1 }) },
  { key: 'h2', title: 'Heading 2', command: (c) => c.toggleHeading({ level: 2 }) },
  { key: 'h3', title: 'Heading 3', command: (c) => c.toggleHeading({ level: 3 }) },
  { key: 'bullet', title: 'Bullet list', Icon: ListsIcon, command: (c) => c.toggleBulletList() },
  { key: 'ordered', title: 'Numbered list', Icon: ListsIcon, command: (c) => c.toggleOrderedList() },
  { key: 'todo', title: 'To-do list', Icon: CheckIcon, command: (c) => c.toggleTaskList() },
  {
    key: 'table',
    title: 'Table',
    Icon: TableIcon,
    command: (c) => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }),
  },
  {
    key: 'pagelink',
    title: 'Link to page',
    subtitle: 'or type @',
    Icon: PagesIcon,
    // Bridges to the mention picker by re-inserting the trigger char.
    command: (c) => c.insertContent('@'),
  },
];

const SlashCommand = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        pluginKey: slashKey,
        char: '/',
        startOfLine: false,
        command: ({ editor, range, props }) => {
          props.command(editor.chain().focus().deleteRange(range)).run();
        },
        items: ({ query }) => COMMANDS.filter(
          (c) => c.title.toLowerCase().includes(query.toLowerCase()),
        ),
        render: () => suggestionRender({ emptyLabel: 'No blocks' }),
      }),
    ];
  },
});

export default SlashCommand;
