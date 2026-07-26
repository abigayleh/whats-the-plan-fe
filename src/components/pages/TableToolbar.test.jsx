import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { useEditorState } from '@tiptap/react';
import {
  renderWithRouter, screen, userEvent,
} from '../../test/utils';
import TableToolbar from './TableToolbar';

// Stub the TipTap selector hook; each test decides whether the cursor is "in a table".
vi.mock('@tiptap/react', () => ({ useEditorState: vi.fn() }));

// A chain proxy that records the command methods called and exposes a run() spy.
function makeEditor() {
  const calls = [];
  const run = vi.fn();
  const chain = new Proxy({}, {
    get: (_t, prop) => {
      if (prop === 'run') return run;
      return () => { calls.push(prop); return chain; };
    },
  });
  return { editor: { chain: () => chain }, calls, run };
}

describe('TableToolbar', () => {
  beforeEach(() => localStorage.clear());

  it('renders nothing when the cursor is not inside a table', () => {
    useEditorState.mockReturnValue(false);
    const { editor } = makeEditor();
    const { container } = renderWithRouter(<TableToolbar editor={editor} />);
    expect(container.querySelector('.page-doc__table-toolbar')).not.toBeInTheDocument();
  });

  it('shows the table actions while in a table', () => {
    useEditorState.mockReturnValue(true);
    const { editor } = makeEditor();
    renderWithRouter(<TableToolbar editor={editor} />);
    ['Column +', 'Column −', 'Row +', 'Row −', 'Delete table'].forEach((label) => {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    });
  });

  it('runs the matching command through a focused chain', async () => {
    useEditorState.mockReturnValue(true);
    const { editor, calls, run } = makeEditor();
    const user = userEvent.setup();
    renderWithRouter(<TableToolbar editor={editor} />);
    await user.click(screen.getByRole('button', { name: 'Column +' }));
    expect(calls).toContain('focus');
    expect(calls).toContain('addColumnAfter');
    expect(run).toHaveBeenCalled();
  });

  it('collapses to a handle and restores', async () => {
    useEditorState.mockReturnValue(true);
    const { editor } = makeEditor();
    const user = userEvent.setup();
    renderWithRouter(<TableToolbar editor={editor} />);
    await user.click(screen.getByRole('button', { name: 'Minimize table controls' }));
    expect(screen.queryByRole('button', { name: 'Column +' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show table controls' }));
    expect(screen.getByRole('button', { name: 'Column +' })).toBeInTheDocument();
  });
});