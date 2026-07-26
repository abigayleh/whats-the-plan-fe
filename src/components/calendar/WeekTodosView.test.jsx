import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { render, screen } from '../../test/utils';
import WeekTodosView from './WeekTodosView';
import useAppData from '../../hooks/useAppData';

vi.mock('../../hooks/useAppData', () => ({ default: vi.fn() }));

beforeEach(() => {
  useAppData.mockReturnValue({ updateTask: vi.fn(), deleteTask: vi.fn() });
});

const focusDate = new Date(2026, 6, 15);
const noop = () => {};

describe('WeekTodosView', () => {
  it('places a dated to-do in its weekday column', () => {
    const tasks = [{
      id: 't1', title: 'Wednesday task', status: 'todo', colorKey: 'teal', origin: 'task',
      dueDate: new Date(2026, 6, 15),
    }];
    render(
      <WeekTodosView
        focusDate={focusDate}
        tasks={tasks}
        unscheduledTasks={[]}
        lists={[]}
        onToggle={noop}
        onOpen={noop}
        onOpenUnscheduled={noop}
      />,
    );
    expect(screen.getByText('Wednesday task')).toBeInTheDocument();
    expect(screen.queryByText('No date')).not.toBeInTheDocument();
  });

  it('renders a No date column when there are unscheduled to-dos', () => {
    const unscheduled = [{ id: 'u1', title: 'Someday', status: 'todo', colorKey: 'teal', origin: 'task' }];
    render(
      <WeekTodosView
        focusDate={focusDate}
        tasks={[]}
        unscheduledTasks={unscheduled}
        lists={[]}
        onToggle={noop}
        onOpen={noop}
        onOpenUnscheduled={noop}
      />,
    );
    expect(screen.getByText('No date')).toBeInTheDocument();
    expect(screen.getByText('Someday')).toBeInTheDocument();
  });
});