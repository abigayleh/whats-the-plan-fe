import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import {
  renderWithRouter, screen, within, userEvent,
} from '../test/utils';
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

// The same repeating to-do reads differently by section: Overdue is about the one day that was
// missed, its own list about how it repeats. Monday 12 October 2026 is "today".
describe('a repeating to-do that missed yesterday', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 12, 10, 0));
    useAppData.mockReturnValue({
      ...baseData,
      lists: [
        {
          id: 'l-overdue', name: 'Overdue', isSystem: true, groupId: null,
        },
        ...baseData.lists,
      ],
      tasks: [{
        id: 't1',
        title: 'Water plants',
        status: 'todo',
        listId: 'l1',
        dueDate: new Date(2026, 7, 4),
        recurrenceRule: { frequency: 'daily', interval: 1 },
        completedDates: [],
        skippedDates: [],
      }],
    });
  });
  afterEach(() => vi.useRealTimers());

  const sectionNamed = (name) => within(screen.getByText(name).closest('.list-section'));

  it('names the missed day under Overdue and the repeat in its own list', () => {
    renderWithRouter(<ListsPage />);
    expect(sectionNamed('Overdue').getByText('Sun, Oct 11')).toBeInTheDocument();
    expect(sectionNamed('Groceries').getByText('Daily')).toBeInTheDocument();
    expect(screen.queryByText(/Aug 4/)).not.toBeInTheDocument();
  });
});
