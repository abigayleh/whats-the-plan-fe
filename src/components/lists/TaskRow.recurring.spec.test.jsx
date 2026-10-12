import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { render, screen, userEvent } from '../../test/utils';
import TaskRow from './TaskRow';
import useAppData from '../../hooks/useAppData';

vi.mock('../../hooks/useAppData', () => ({ default: vi.fn() }));

beforeEach(() => {
  useAppData.mockReturnValue({ updateTask: vi.fn(), deleteTask: vi.fn() });
});

// A row standing for one day of a series is checkable for that day. Only the undated series
// row itself — the whole repeating thing — can't be ticked as a unit.
const overdueDay = new Date(2026, 7, 1);
const series = {
  id: 't1',
  title: 'Water plants',
  status: 'todo',
  colorKey: 'teal',
  listId: 'l1',
  dueDate: overdueDay,
  recurrenceRule: { frequency: 'daily', interval: 1 },
  completedDates: [],
};

const renderRow = (props) => {
  const onToggle = vi.fn();
  render(<TaskRow task={series} lists={[]} onToggle={onToggle} onClick={() => {}} {...props} />);
  return onToggle;
};

describe('an overdue occurrence of a recurring to-do', () => {
  it('is checkable', () => {
    renderRow({ day: overdueDay });
    const check = screen.getByRole('checkbox');
    expect(check).not.toHaveAttribute('aria-disabled', 'true');
    expect(check).toHaveAttribute('tabindex', '0');
  });

  it('ticks off the day it stands for, not the series', async () => {
    const onToggle = renderRow({ day: overdueDay });
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith('t1', overdueDay);
  });

  it('shows as done once that day is completed', () => {
    renderRow({ day: overdueDay, task: { ...series, completedDates: [overdueDay.toISOString()] } });
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
  });
});

describe('the series row itself', () => {
  it('cannot be ticked as a whole when it stands for no particular day', () => {
    renderRow({});
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-disabled', 'true');
  });
});

// A series is anchored to one date, but that date says nothing about when it falls — so its
// row describes the repeat instead. Monday 12 October 2026 is "today" throughout.
describe('what a repeating to-do row says about its schedule', () => {
  const weekly = {
    ...series,
    dueDate: new Date(2026, 7, 4),
    recurrenceRule: { frequency: 'weekly', interval: 1, daysOfWeek: [1, 3] },
  };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 12, 10, 0));
  });
  afterEach(() => vi.useRealTimers());

  it('describes when it repeats instead of the date it started', () => {
    renderRow({ task: weekly });
    expect(screen.getByText('Weekly on Mon, Wed')).toBeInTheDocument();
    expect(screen.queryByText(/Aug 4/)).not.toBeInTheDocument();
  });

  it('is never flagged overdue for having started in the past', () => {
    renderRow({ task: weekly });
    expect(screen.getByText('Weekly on Mon, Wed')).not.toHaveClass('task-row__due--overdue');
  });

  it('keeps the time of a timed series', () => {
    renderRow({
      task: {
        ...weekly,
        dueDate: null,
        scheduledStart: new Date(2026, 7, 4, 9, 0),
        scheduledEnd: new Date(2026, 7, 4, 10, 0),
      },
    });
    expect(screen.getByText('Weekly on Mon, Wed · 9:00 AM')).toBeInTheDocument();
  });

  it('says when a series that has not begun yet will start', () => {
    renderRow({ task: { ...weekly, dueDate: new Date(2026, 9, 20) } });
    expect(screen.getByText('Weekly on Mon, Wed · from Oct 20')).toBeInTheDocument();
  });

  it('names the missed day, flagged overdue, on an Overdue row', () => {
    const missedDay = new Date(2026, 9, 5);
    renderRow({ task: { ...weekly, missedDay }, day: missedDay });
    expect(screen.getByText('Mon, Oct 5')).toHaveClass('task-row__due--overdue');
    expect(screen.queryByText(/Weekly on/)).not.toBeInTheDocument();
  });
});
