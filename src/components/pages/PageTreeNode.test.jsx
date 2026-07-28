import {
  describe, it, expect, vi,
} from 'vitest';
import { DndContext } from '@dnd-kit/core';
import {
  renderWithRouter, screen, userEvent,
} from '../../test/utils';
import PageTreeNode from './PageTreeNode';

// useDraggable/useDroppable read dnd-kit context, so wrap the node in a bare DndContext.
function renderNode(node, props = {}) {
  const merged = {
    depth: 0,
    collapsed: new Set(),
    onToggle: vi.fn(),
    onNewChild: vi.fn(),
    canManagePage: () => true,
    drag: null,
    ...props,
  };
  renderWithRouter(
    <DndContext>
      <ul>
        <PageTreeNode node={node} {...merged} />
      </ul>
    </DndContext>,
  );
  return merged;
}

const leaf = {
  id: 'p1', title: '', icon: null, children: [],
};
const parent = { ...leaf, id: 'p2', children: [{ ...leaf, id: 'c1' }] };

describe('PageTreeNode', () => {
  it('falls back to "Untitled" and links to the page', () => {
    renderNode(leaf);
    const link = screen.getByRole('link', { name: /Untitled/ });
    expect(link).toHaveAttribute('href', '/pages/p1');
  });

  it('requests a subpage for its own node', async () => {
    // Non-manageable rows carry no drag listeners, so the Add-subpage click isn't intercepted.
    const { onNewChild } = renderNode(leaf, { canManagePage: () => false });
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Add subpage' }));
    expect(onNewChild).toHaveBeenCalledWith(leaf);
  });

  it('shows a collapse toggle only when it has children', () => {
    renderNode(leaf);
    expect(screen.queryByRole('button', { name: /subpages/ })).not.toBeInTheDocument();
    renderNode(parent);
    expect(screen.getByRole('button', { name: 'Hide subpages' })).toBeInTheDocument();
  });

  // The chevron leads the row; childless rows keep the slot so the icons stay aligned.
  it('puts the toggle first in the row, and an empty slot when there is nothing to toggle', () => {
    renderNode(parent);
    expect(document.querySelector('.page-tree__row').firstElementChild)
      .toHaveClass('page-tree__toggle');
    renderNode(leaf);
    expect(document.querySelectorAll('.page-tree__row')[1].firstElementChild)
      .toHaveClass('page-tree__toggle-spacer');
  });

  it('leaves a row with children styled like any other', () => {
    renderNode(parent);
    expect(document.querySelector('.page-tree__row')).not.toHaveClass('page-tree__row--folder');
  });

  // Reports the state it wants rather than "flip", so a row forced open by a search
  // can't collapse-toggle the remembered state backwards.
  it('asks for the opposite of the state it is showing', async () => {
    const user = userEvent.setup();
    // Non-manageable, so the row's drag listeners don't swallow the click (see above).
    const opts = { canManagePage: () => false };
    const { onToggle } = renderNode(parent, opts);
    await user.click(screen.getByRole('button', { name: 'Hide subpages' }));
    expect(onToggle).toHaveBeenCalledWith('p2', false);

    const shown = renderNode(parent, { ...opts, collapsed: new Set(['p2']) });
    await user.click(screen.getByRole('button', { name: 'Show subpages' }));
    expect(shown.onToggle).toHaveBeenCalledWith('p2', true);
  });

  it('marks the active drag row and the current drop band', () => {
    renderNode(leaf, { drag: { activeId: 'p1' } });
    expect(document.querySelector('.page-tree__row--dragging')).toBeInTheDocument();
    renderNode(leaf, { drag: { overId: 'p1', band: 'child' } });
    expect(document.querySelector('.page-tree__row--drop-child')).toBeInTheDocument();
  });

  // The before/after drop line is drawn from this variable, so it has to track depth
  // in step with the padding or the line starts in the wrong place.
  it('exposes its indent as a variable matching its padding', () => {
    renderNode(leaf, { depth: 2 });
    const row = document.querySelector('.page-tree__row');
    expect(row.style.getPropertyValue('--page-row-indent')).toBe('3.1rem');
    expect(row.style.paddingLeft).toBe('var(--page-row-indent)');
  });
});