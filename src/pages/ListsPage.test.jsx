import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { renderWithRouter, screen, userEvent } from '../test/utils';
import ListsPage from './ListsPage';
import useAppData from '../hooks/useAppData';
import usePlanItems from '../hooks/usePlanItems';

vi.mock('../hooks/useAppData', () => ({ default: vi.fn() }));
vi.mock('../hooks/usePlanItems', () => ({ default: vi.fn() }));

const baseData = {
  groups: [],
  lists: [{
    id: 'l1', name: 'Groceries', isSystem: false, ownerId: 'u1', groupId: null, position: 0,
  }],
  tasks: [{ id: 't1', title: 'Buy milk', status: 'todo', listId: 'l1' }],
  currentUser: { id: 'u1' },
  personalSpace: { name: 'Personal', colorKey: 'primary' },
  addList: vi.fn(),
  updateList: vi.fn(),
  deleteList: vi.fn(),
  arrangeLists: vi.fn(),
  toggleTaskStatus: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
};

beforeEach(() => {
  localStorage.clear();
  useAppData.mockReturnValue(baseData);
  usePlanItems.mockReturnValue({ saveItem: vi.fn(), deleteItem: vi.fn() });
});

describe('ListsPage', () => {
  it('renders the page title and the user list with its task', () => {
    renderWithRouter(<ListsPage />);
    expect(screen.getByRole('heading', { name: 'Lists' })).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
  });

  it('opens the New List modal', async () => {
    renderWithRouter(<ListsPage />);
    await userEvent.click(screen.getByRole('button', { name: /New List/ }));
    expect(screen.getByRole('heading', { name: 'New List' })).toBeInTheDocument();
  });

  it('toggles the completed filter label', async () => {
    renderWithRouter(<ListsPage />);
    const toggle = screen.getByRole('button', { name: 'Hide completed' });
    await userEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Show completed' })).toBeInTheDocument();
  });
});