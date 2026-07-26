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

const baseTask = {
  id: 't1', title: 'Buy milk', status: 'todo', colorKey: 'teal', listId: 'l1',
};

describe('TaskRow', () => {
  it('renders the title', () => {
    render(<TaskRow task={baseTask} lists={[]} onToggle={() => {}} onClick={() => {}} />);
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
  });

  it('shows the checkbox as checked for a done task', () => {
    render(
      <TaskRow task={{ ...baseTask, status: 'done' }} lists={[]} onToggle={() => {}} onClick={() => {}} />,
    );
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
  });

  it('toggles and calls onToggle with the id', async () => {
    const onToggle = vi.fn();
    render(<TaskRow task={baseTask} lists={[]} onToggle={onToggle} onClick={() => {}} />);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith('t1');
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
  });

  it('opens the task when the row is clicked', async () => {
    const onClick = vi.fn();
    render(<TaskRow task={baseTask} lists={[]} onToggle={() => {}} onClick={onClick} />);
    await userEvent.click(screen.getByText('Buy milk'));
    expect(onClick).toHaveBeenCalledWith(baseTask);
  });

  it('marks an overdue due date', () => {
    const task = { ...baseTask, dueDate: new Date(2020, 0, 1) };
    const { container } = render(
      <TaskRow task={task} lists={[]} onToggle={() => {}} onClick={() => {}} />,
    );
    expect(container.querySelector('.task-row__due--overdue')).toBeInTheDocument();
  });

  it('disables the checkbox for a recurring series row and ignores clicks', async () => {
    const onToggle = vi.fn();
    const task = { ...baseTask, recurrenceRule: { frequency: 'daily', interval: 1 } };
    render(<TaskRow task={task} lists={[]} onToggle={onToggle} onClick={() => {}} />);
    const check = screen.getByRole('checkbox');
    expect(check).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(check);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('shows the subtask progress count', () => {
    const task = { ...baseTask, subtasks: [{ id: 's1', done: true }, { id: 's2', done: false }] };
    render(<TaskRow task={task} lists={[]} onToggle={() => {}} onClick={() => {}} />);
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('hides meta and action buttons when plain', () => {
    const task = { ...baseTask, assignedTo: 'Alex' };
    render(<TaskRow task={task} lists={[]} onToggle={() => {}} onClick={() => {}} plain />);
    expect(screen.queryByText('Alex')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });
});