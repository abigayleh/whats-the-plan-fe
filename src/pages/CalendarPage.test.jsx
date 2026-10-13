import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import {
  renderWithRouter, screen, within, userEvent, fireEvent, setVisibility,
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

describe('CalendarPage month view', () => {
  const setViewport = (mobile) => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: mobile, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    }));
  };

  // On a phone the grid only shows dots, so tapping a day has to explain it in place
  // rather than navigating away.
  it('fills the day panel instead of leaving the month on a phone', async () => {
    setViewport(true);
    const user = userEvent.setup();
    renderWithRouter(<CalendarPage />);
    const dayCell = document.querySelectorAll('.calendar-month__day')[10];
    await user.click(dayCell);
    expect(document.querySelector('.month-day-panel')).toBeInTheDocument();
    // Still on the month: the grid is present and the day timeline is not.
    expect(document.querySelector('.calendar-month__grid')).toBeInTheDocument();
    expect(document.querySelector('.calendar-day')).toBeNull();
  });

  it('jumps straight to the day view on desktop and shows no panel', async () => {
    setViewport(false);
    const user = userEvent.setup();
    renderWithRouter(<CalendarPage />);
    expect(document.querySelector('.month-day-panel')).toBeNull();
    await user.click(document.querySelectorAll('.calendar-month__day')[10]);
    expect(document.querySelector('.calendar-month__grid')).toBeNull();
  });
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

  describe('returning to a tab left open', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 9, 12, 22, 0));
    });
    afterEach(() => {
      setVisibility('visible');
      vi.useRealTimers();
    });

    async function browseToNextMonthAndLeave() {
      renderWithRouter(<CalendarPage />);
      await userEvent.click(screen.getByRole('button', { name: 'Next' }));
      expect(screen.getByText('November 2026')).toBeInTheDocument();
      setVisibility('hidden');
    }

    it('lands back on today when the day has changed', async () => {
      await browseToNextMonthAndLeave();
      vi.setSystemTime(new Date(2026, 9, 13, 8, 0));
      setVisibility('visible');
      expect(screen.getByText('October 2026')).toBeInTheDocument();
    });

    it('keeps the month being browsed on a same-day return', async () => {
      await browseToNextMonthAndLeave();
      vi.setSystemTime(new Date(2026, 9, 12, 23, 30));
      setVisibility('visible');
      expect(screen.getByText('November 2026')).toBeInTheDocument();
    });
  });

  // The calendar opens the series row (it carries the sub-to-dos and files), so the day that
  // was actually clicked has to travel with it — otherwise the modal can only delete it all.
  describe('opening a repeating to-do', () => {
    const today = new Date(2026, 9, 12);
    const yesterday = new Date(2026, 9, 11);
    const series = {
      id: 't1',
      sourceId: 't1',
      origin: 'task',
      title: 'Water plants',
      status: 'todo',
      listId: 'l1',
      dueDate: new Date(2026, 7, 4),
      recurrenceRule: { frequency: 'daily', interval: 1 },
      completedDates: [],
      skippedDates: [],
    };
    const occurrence = {
      ...series, id: 'task-t1:2026-10-12', dueDate: today, recurrenceRule: null, isRecurring: true,
    };
    let skipOccurrence;

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 9, 12, 10, 0));
      skipOccurrence = vi.fn().mockResolvedValue();
      useAppData.mockReturnValue({
        ...baseData,
        lists: [{
          id: 'l1', name: 'Home', isSystem: false, isDefault: true, groupId: null,
        }],
        tasks: [series],
      });
      usePlanItems.mockReturnValue({
        saveItem: vi.fn(), deleteItem: vi.fn(), moveItem: vi.fn(), toggleStatus: vi.fn(), skipOccurrence,
      });
      useCalendarItems.mockReturnValue({ items: [occurrence], refetch: vi.fn() });
    });
    afterEach(() => vi.useRealTimers());

    async function openRowIn(sectionTitle) {
      renderWithRouter(<CalendarPage />);
      await userEvent.click(screen.getByRole('button', { name: 'Day' }));
      const section = within(screen.getByRole('heading', { name: sectionTitle }).closest('section'));
      await userEvent.click(section.getByRole('button', { name: /Water plants/ }));
    }

    it('removes only the day that was clicked', async () => {
      await openRowIn('Today');
      const modal = within(screen.getByRole('dialog'));
      expect(modal.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
      await userEvent.click(modal.getByRole('button', { name: 'Remove this day' }));
      expect(skipOccurrence).toHaveBeenCalledWith(expect.objectContaining({ sourceId: 't1' }), today);
    });

    it('removes the clicked day when opened from a chip on the week grid', async () => {
      const { container } = renderWithRouter(<CalendarPage />);
      await userEvent.click(screen.getByRole('button', { name: 'Week' }));
      await userEvent.click(container.querySelector('.task-chip'));
      await userEvent.click(screen.getByRole('button', { name: 'Remove this day' }));
      expect(skipOccurrence).toHaveBeenCalledWith(expect.objectContaining({ sourceId: 't1' }), today);
    });

    it('removes the missed day when opened from Overdue', async () => {
      await openRowIn('Overdue');
      await userEvent.click(screen.getByRole('button', { name: 'Remove this day' }));
      const [, day] = skipOccurrence.mock.calls[0];
      expect(day.toDateString()).toBe(yesterday.toDateString());
    });
  });
});
