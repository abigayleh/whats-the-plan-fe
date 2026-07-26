import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import {
  renderWithRouter, screen, userEvent,
} from '../../test/utils';
import PageTree from './PageTree';

const personalSpace = { name: 'Personal' };
const groups = [{ id: 'g1', name: 'Crew' }];

// Two personal roots whose manual position order is the reverse of their titles,
// plus a child of the first, to exercise forest building + position sorting.
const pages = [
  {
    id: 'p1', title: 'Zeta', groupId: null, parentId: null, position: 0,
  },
  {
    id: 'p2', title: 'Alpha', groupId: null, parentId: null, position: 1,
  },
  {
    id: 'c1', title: 'Child', groupId: null, parentId: 'p1', position: 0,
  },
  {
    id: 'g1p', title: 'Grouped', groupId: 'g1', parentId: null, position: 0,
  },
];

function renderTree(props = {}) {
  const merged = {
    pages,
    loading: false,
    personalSpace,
    groups,
    canManagePage: () => true,
    onReorder: vi.fn(),
    onNewChild: vi.fn(),
    ...props,
  };
  renderWithRouter(<PageTree {...merged} />);
  return merged;
}

describe('PageTree', () => {
  beforeEach(() => localStorage.clear());

  it('shows a loading placeholder', () => {
    renderTree({ loading: true });
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('renders one section per scope, with an empty note where a scope has no pages', () => {
    renderTree({ pages: [] });
    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('Crew')).toBeInTheDocument();
    expect(screen.getAllByText('No pages yet')).toHaveLength(2);
  });

  it('orders sibling roots by manual position, not title', () => {
    renderTree();
    const titles = screen.getAllByText(/^(Zeta|Alpha)$/).map((n) => n.textContent);
    expect(titles).toEqual(['Zeta', 'Alpha']); // position 0 (Zeta) before position 1 (Alpha)
  });

  it('renders a nested child under its parent', () => {
    renderTree();
    expect(screen.getByText('Child')).toBeInTheDocument();
  });

  it('hides subpages when the parent toggle is collapsed', async () => {
    const user = userEvent.setup();
    renderTree();
    expect(screen.getByText('Child')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Hide subpages' }));
    expect(screen.queryByText('Child')).not.toBeInTheDocument();
  });

  it('requests a new child page for the clicked node', async () => {
    const { onNewChild } = renderTree();
    const user = userEvent.setup();
    // The first "Add subpage" button belongs to the first rendered root (Zeta / p1).
    await user.click(screen.getAllByRole('button', { name: 'Add subpage' })[0]);
    expect(onNewChild).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1' }));
  });
});