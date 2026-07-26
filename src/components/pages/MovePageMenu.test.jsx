import {
  describe, it, expect, vi,
} from 'vitest';
import {
  renderWithRouter, screen, userEvent, within,
} from '../../test/utils';
import MovePageMenu from './MovePageMenu';

// p2 is the page being moved; its only child p3 is a descendant (invalid target),
// p4 lives in another scope (group g1), p1 and p5 are valid same-scope targets.
const pages = [
  { id: 'p1', title: 'Alpha', groupId: null, parentId: null },
  { id: 'p2', title: 'Mover', groupId: null, parentId: 'p1' },
  { id: 'p3', title: 'Child', groupId: null, parentId: 'p2' },
  { id: 'p4', title: 'Grouped', groupId: 'g1', parentId: null },
  { id: 'p5', title: 'Zeta', groupId: null, parentId: null },
];
const mover = pages[1];

describe('MovePageMenu', () => {
  it('lists only valid same-scope targets, sorted by title', async () => {
    const user = userEvent.setup();
    renderWithRouter(<MovePageMenu page={mover} pages={pages} onMove={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Move to…' }));
    const list = document.querySelector('.move-menu__list');
    const labels = within(list).getAllByText(/Alpha|Zeta|Child|Grouped|Mover/).map((n) => n.textContent);
    expect(labels).toEqual(['Alpha', 'Zeta']); // excludes self, descendant, cross-scope
  });

  it('offers "Top level" only when the page has a parent', async () => {
    const user = userEvent.setup();
    renderWithRouter(<MovePageMenu page={mover} pages={pages} onMove={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Move to…' }));
    expect(screen.getByText('Top level')).toBeInTheDocument();
  });

  it('reports an empty scope when a root page has no other pages', async () => {
    const solo = { id: 's1', title: 'Solo', groupId: null, parentId: null };
    const user = userEvent.setup();
    renderWithRouter(<MovePageMenu page={solo} pages={[solo]} onMove={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Move to…' }));
    expect(screen.getByText('No other pages in this space')).toBeInTheDocument();
    expect(screen.queryByText('Top level')).not.toBeInTheDocument();
  });

  it('calls onMove with the chosen target id and closes', async () => {
    const onMove = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(<MovePageMenu page={mover} pages={pages} onMove={onMove} />);
    await user.click(screen.getByRole('button', { name: 'Move to…' }));
    await user.click(screen.getByText('Zeta'));
    expect(onMove).toHaveBeenCalledWith('p5');
    expect(document.querySelector('.move-menu__list')).not.toBeInTheDocument();
  });

  it('moves a page to the top level', async () => {
    const onMove = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(<MovePageMenu page={mover} pages={pages} onMove={onMove} />);
    await user.click(screen.getByRole('button', { name: 'Move to…' }));
    await user.click(screen.getByText('Top level'));
    expect(onMove).toHaveBeenCalledWith(null);
  });
});