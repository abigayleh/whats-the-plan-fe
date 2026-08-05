import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { render, screen, userEvent } from '../../test/utils';
import DayTodoPanel from './DayTodoPanel';
import useAppData from '../../hooks/useAppData';

vi.mock('../../hooks/useAppData', () => ({ default: vi.fn() }));

beforeEach(() => {
  useAppData.mockReturnValue({ updateTask: vi.fn(), deleteTask: vi.fn() });
});

const noop = () => {};
const handlers = {
  onToggle: noop, onToggleOverdue: noop, onOpenOverdue: noop, onOpenToday: noop, onOpenUnscheduled: noop,
};

describe('DayTodoPanel', () => {
  it('always renders the Today section', () => {
    render(
      <DayTodoPanel
        overdueTasks={[]}
        todayTasks={[]}
        unscheduledTasks={[]}
        lists={[]}
        showUnscheduled={false}
        {...handlers}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument();
  });

  it('shows the Overdue section only when there are overdue tasks', () => {
    const overdue = [{ id: 'o1', title: 'Late task', status: 'todo', colorKey: 'coral', listId: 'l1' }];
    const { rerender } = render(
      <DayTodoPanel overdueTasks={[]} todayTasks={[]} unscheduledTasks={[]} lists={[]} showUnscheduled={false} {...handlers} />,
    );
    expect(screen.queryByRole('heading', { name: 'Overdue' })).not.toBeInTheDocument();
    rerender(
      <DayTodoPanel overdueTasks={overdue} todayTasks={[]} unscheduledTasks={[]} lists={[]} showUnscheduled={false} {...handlers} />,
    );
    expect(screen.getByRole('heading', { name: 'Overdue' })).toBeInTheDocument();
    expect(screen.getByText('Late task')).toBeInTheDocument();
  });

  // Overdue rows stand for a missed day, so they tick off through their own handler.
  it('routes an overdue row’s checkbox to onToggleOverdue', async () => {
    const onToggleOverdue = vi.fn();
    const onToggle = vi.fn();
    const overdue = [{ id: 'o1', title: 'Late task', status: 'todo', colorKey: 'coral', listId: 'l1' }];
    render(
      <DayTodoPanel
        overdueTasks={overdue}
        todayTasks={[]}
        unscheduledTasks={[]}
        lists={[]}
        showUnscheduled={false}
        {...handlers}
        onToggle={onToggle}
        onToggleOverdue={onToggleOverdue}
      />,
    );
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onToggleOverdue).toHaveBeenCalledWith('o1');
    expect(onToggle).not.toHaveBeenCalled();
  });

  // A repeating to-do reaches Overdue as the whole series, so the panel has to name the day it
  // missed — without that the row is a bare series row: untickable, and read as done whenever
  // the series' own status happens to say so.
  describe('an overdue repeating to-do', () => {
    const missedDay = new Date(2026, 6, 17);
    const repeating = (extra) => ([{
      id: 'r1',
      title: 'Brush Loki teeth',
      status: 'done',
      colorKey: 'coral',
      listId: 'l1',
      dueDate: missedDay,
      recurrenceRule: { frequency: 'daily', interval: 1 },
      completedDates: [],
      shownDay: missedDay,
      ...extra,
    }]);

    const renderOverdue = (tasks) => render(
      <DayTodoPanel
        overdueTasks={tasks}
        todayTasks={[]}
        unscheduledTasks={[]}
        lists={[]}
        showUnscheduled={false}
        {...handlers}
      />,
    );

    it('is checkable for the day it missed', async () => {
      renderOverdue(repeating());
      const check = screen.getByRole('checkbox');
      expect(check).not.toHaveAttribute('aria-disabled', 'true');
      expect(check).toHaveAttribute('aria-checked', 'false');
    });

    it('is not shown as done just because the series status says so', () => {
      renderOverdue(repeating());
      expect(screen.getByText('Brush Loki teeth').closest('.task-row')).not.toHaveClass('task-row--done');
    });

    it('is shown as done once the missed day itself is completed', () => {
      renderOverdue(repeating({ completedDates: [missedDay.toISOString()] }));
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
    });
  });

  it('gates the Unscheduled section behind showUnscheduled', () => {
    const { rerender } = render(
      <DayTodoPanel overdueTasks={[]} todayTasks={[]} unscheduledTasks={[]} lists={[]} showUnscheduled={false} {...handlers} />,
    );
    expect(screen.queryByRole('heading', { name: 'Unscheduled' })).not.toBeInTheDocument();
    rerender(
      <DayTodoPanel overdueTasks={[]} todayTasks={[]} unscheduledTasks={[]} lists={[]} showUnscheduled {...handlers} />,
    );
    expect(screen.getByRole('heading', { name: 'Unscheduled' })).toBeInTheDocument();
  });
});