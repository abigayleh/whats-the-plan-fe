import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { renderWithRouter, screen, userEvent } from '../test/utils';
import GroupsPage from './GroupsPage';
import useAppData from '../hooks/useAppData';

vi.mock('../hooks/useAppData', () => ({ default: vi.fn() }));

const appData = (over = {}) => ({
  groups: [{
    id: 'g1', name: 'Trip', colorKey: 'teal', memberCount: 2,
  }],
  personalSpace: { name: 'Personal', colorKey: 'primary' },
  addGroup: vi.fn(),
  joinGroup: vi.fn().mockResolvedValue(),
  updatePersonalSpace: vi.fn(),
  ...over,
});

describe('GroupsPage', () => {
  beforeEach(() => vi.mocked(useAppData).mockReturnValue(appData()));

  it('renders the personal space card and group cards', () => {
    renderWithRouter(<GroupsPage />);
    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('Just you — tap to customize')).toBeInTheDocument();
    expect(screen.getByText('Trip')).toBeInTheDocument();
  });

  it('opens the create-group modal', async () => {
    renderWithRouter(<GroupsPage />);
    await userEvent.click(screen.getByRole('button', { name: /New Group/ }));
    expect(screen.getByRole('heading', { name: 'New Group' })).toBeInTheDocument();
  });

  it('opens the join-group modal', async () => {
    renderWithRouter(<GroupsPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Join Group' }));
    expect(screen.getByRole('heading', { name: 'Join a Group' })).toBeInTheDocument();
  });

  it('opens the personal space modal from its card', async () => {
    renderWithRouter(<GroupsPage />);
    await userEvent.click(screen.getByText('Just you — tap to customize'));
    expect(screen.getByRole('heading', { name: 'Personal Space' })).toBeInTheDocument();
  });

  it('adds a group through the create modal', async () => {
    const addGroup = vi.fn();
    vi.mocked(useAppData).mockReturnValue(appData({ addGroup }));
    renderWithRouter(<GroupsPage />);
    await userEvent.click(screen.getByRole('button', { name: /New Group/ }));
    await userEvent.type(screen.getByLabelText('Name'), 'Book Club');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(addGroup).toHaveBeenCalledWith({ name: 'Book Club', colorKey: 'primary' });
  });
});