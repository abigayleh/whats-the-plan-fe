import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import {
  renderWithRouter, screen, userEvent,
} from '../test/utils';
import PagesPage from './PagesPage';
import useAppData from '../hooks/useAppData';
import usePages from '../hooks/usePages';

vi.mock('../hooks/useAppData');
vi.mock('../hooks/usePages');

const pages = [
  {
    id: 'p1', title: 'Roadmap', groupId: null, parentId: null, position: 0,
  },
  {
    id: 'p2', title: 'Shopping', groupId: null, parentId: null, position: 1,
  },
];

function mockHooks(overrides = {}) {
  useAppData.mockReturnValue({
    currentUser: { id: 'me' },
    personalSpace: { name: 'Personal' },
    groups: [{ id: 'g1', name: 'Crew', role: 'ADMIN' }],
  });
  usePages.mockReturnValue({
    pages,
    loading: false,
    addPage: vi.fn(),
    updatePage: vi.fn(),
    deletePage: vi.fn(),
    saveContent: vi.fn(),
    reorderPages: vi.fn(),
    ...overrides,
  });
}

describe('PagesPage', () => {
  beforeEach(() => {
    localStorage.clear();
    mockHooks();
  });

  it('renders the page tree and the empty-state prompt at the root', () => {
    renderWithRouter(<PagesPage />, { route: '/pages' });
    expect(screen.getByText('Pages')).toBeInTheDocument();
    expect(screen.getByText('Roadmap')).toBeInTheDocument();
    expect(screen.getByText('Select a page, or create a new one.')).toBeInTheDocument();
  });

  // The pane a phone shows is driven by this class, so it is the contract the mobile
  // stylesheet hangs off. Desktop ignores it and shows both panes regardless.
  it('marks the detail pane as active only when a page is open', () => {
    const { unmount } = renderWithRouter(<PagesPage />, { route: '/pages' });
    expect(document.querySelector('.pages')).not.toHaveClass('pages--detail');
    expect(screen.queryByRole('link', { name: 'Pages' })).not.toBeInTheDocument();
    unmount();

    renderWithRouter(<PagesPage />, { route: '/pages/p1' });
    expect(document.querySelector('.pages')).toHaveClass('pages--detail');
    // The back link only exists in the detail pane, and returns to the tree.
    expect(screen.getByRole('link', { name: 'Pages' })).toHaveAttribute('href', '/pages');
  });

  it('collapses and re-expands the sidebar', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PagesPage />, { route: '/pages' });
    await user.click(screen.getByLabelText('Hide pages'));
    expect(screen.queryByText('Pages')).not.toBeInTheDocument();
    await user.click(screen.getByLabelText('Show pages'));
    expect(screen.getByText('Pages')).toBeInTheDocument();
  });

  it('opens the new-page modal', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PagesPage />, { route: '/pages' });
    await user.click(screen.getByLabelText('New page'));
    expect(screen.getByText('New Page')).toBeInTheDocument();
  });

  it('filters the tree as you type and restores it when cleared', async () => {
    mockHooks();
    renderWithRouter(<PagesPage />);
    expect(screen.getByText('Shopping')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Search pages'), 'road');
    // The match is split around a <mark>, so assert on the link's accessible name.
    expect(screen.getByRole('link', { name: 'Roadmap' })).toBeInTheDocument();
    expect(screen.getByText('Road').tagName).toBe('MARK');
    expect(screen.queryByText('Shopping')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getByText('Shopping')).toBeInTheDocument();
  });

  it('clears the search on Escape', async () => {
    mockHooks();
    renderWithRouter(<PagesPage />);
    const input = screen.getByLabelText('Search pages');
    await userEvent.type(input, 'road');
    expect(screen.queryByText('Shopping')).not.toBeInTheDocument();

    await userEvent.type(input, '{Escape}');
    expect(screen.getByText('Shopping')).toBeInTheDocument();
  });
});
