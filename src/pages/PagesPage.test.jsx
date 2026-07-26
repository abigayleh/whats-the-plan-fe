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
});