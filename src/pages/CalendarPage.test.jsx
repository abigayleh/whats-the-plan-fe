import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import {
  renderWithRouter, screen, userEvent, fireEvent,
} from '../test/utils';
import CalendarPage from './CalendarPage';
import useAppData from '../hooks/useAppData';
import usePlanItems from '../hooks/usePlanItems';
import useCalendarItems from '../hooks/useCalendarItems';

vi.mock('../hooks/useAppData', () => ({ default: vi.fn() }));
vi.mock('../hooks/usePlanItems', () => ({ default: vi.fn() }));
vi.mock('../hooks/useCalendarItems', () => ({ default: vi.fn() }));
vi.mock('../socket/socketClient', () => ({ socket: { on: vi.fn(), off: vi.fn(), emit: vi.fn() } }));

const baseData = {
  groups: [{ id: 'g1', name: 'Barcelona', colorKey: 'coral' }],
  lists: [],
  tasks: [],
  currentUser: { id: 'u1' },
  personalSpace: { name: 'Personal', colorKey: 'primary' },
};

beforeEach(() => {
  localStorage.clear();
  useAppData.mockReturnValue(baseData);
  usePlanItems.mockReturnValue({
    saveItem: vi.fn(), deleteItem: vi.fn(), moveItem: vi.fn(), toggleStatus: vi.fn(),
  });
  useCalendarItems.mockReturnValue({ items: [], refetch: vi.fn() });
});

describe('CalendarPage', () => {
  it('renders the calendar heading and view switcher', () => {
    renderWithRouter(<CalendarPage />);
    expect(screen.getByRole('heading', { name: 'Calendar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Month' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Week' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Day' })).toBeInTheDocument();
  });

  it('renders a group toggle chip for personal and each group', () => {
    renderWithRouter(<CalendarPage />);
    expect(screen.getByRole('button', { name: 'Personal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Barcelona' })).toBeInTheDocument();
  });

  it('reveals the content toggle when switching to the week view', async () => {
    renderWithRouter(<CalendarPage />);
    expect(screen.queryByRole('button', { name: 'Both' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Week' }));
    expect(screen.getByRole('button', { name: 'Both' })).toBeInTheDocument();
  });

  describe('creating an item', () => {
    beforeEach(() => {
      useAppData.mockReturnValue({
        ...baseData,
        lists: [
          { id: 'l1', name: 'Inbox', isSystem: false, groupId: null },
          {
            id: 'l2', name: 'Chores', isSystem: false, isDefault: true, groupId: null,
          },
        ],
      });
    });

    async function openDayTimeline() {
      const { container } = renderWithRouter(<CalendarPage />);
      await userEvent.click(screen.getByRole('button', { name: 'Day' }));
      fireEvent.click(container.querySelector('.calendar-timeline__col'));
    }

    it('opens a new to-do in the default list when a timeline slot is clicked', async () => {
      await openDayTimeline();
      expect(screen.getByRole('heading', { name: 'New Task' })).toBeInTheDocument();
      expect(screen.getByLabelText('List')).toHaveValue('l2');
    });

    it('opens a new to-do in the default list from the Add to-do button', async () => {
      renderWithRouter(<CalendarPage />);
      await userEvent.click(screen.getByRole('button', { name: 'Add to-do' }));
      expect(screen.getByRole('heading', { name: 'New Task' })).toBeInTheDocument();
      expect(screen.getByLabelText('List')).toHaveValue('l2');
    });

    it('opens a new event from the Add event button', async () => {
      renderWithRouter(<CalendarPage />);
      await userEvent.click(screen.getByRole('button', { name: 'Add event' }));
      expect(screen.getByRole('heading', { name: 'New Event' })).toBeInTheDocument();
    });
  });
});