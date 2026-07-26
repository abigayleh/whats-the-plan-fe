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
    expanded: {},
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
    const parent = { ...leaf, id: 'p2', children: [{ ...leaf, id: 'c1', children: [] }] };
    renderNode(parent);
    expect(screen.getByRole('button', { name: 'Hide subpages' })).toBeInTheDocument();
  });

  it('marks the active drag row and the current drop band', () => {
    renderNode(leaf, { drag: { activeId: 'p1' } });
    expect(document.querySelector('.page-tree__row--dragging')).toBeInTheDocument();
    renderNode(leaf, { drag: { overId: 'p1', band: 'child' } });
    expect(document.querySelector('.page-tree__row--drop-child')).toBeInTheDocument();
  });
});