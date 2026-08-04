import {
  describe, it, expect, vi, beforeEach,
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