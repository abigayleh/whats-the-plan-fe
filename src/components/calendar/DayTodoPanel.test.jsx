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