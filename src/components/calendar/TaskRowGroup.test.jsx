import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { render, screen } from '../../test/utils';
import TaskRowGroup from './TaskRowGroup';
import useAppData from '../../hooks/useAppData';

vi.mock('../../hooks/useAppData', () => ({ default: vi.fn() }));

beforeEach(() => {
  useAppData.mockReturnValue({ updateTask: vi.fn(), deleteTask: vi.fn() });
});

const tasks = [
  { id: 't1', title: 'Task one', status: 'todo', colorKey: 'teal', listId: 'l1' },
  { id: 't2', title: 'Task two', status: 'todo', colorKey: 'teal', listId: 'l1' },
];

describe('TaskRowGroup', () => {
  it('renders the title and each task row', () => {
    render(
      <TaskRowGroup title="Today" tasks={tasks} lists={[]} onToggle={() => {}} onOpen={() => {}} emptyLabel="None" />,
    );
    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByText('Task one')).toBeInTheDocument();
    expect(screen.getByText('Task two')).toBeInTheDocument();
  });

  it('shows the empty label when there are no tasks', () => {
    render(
      <TaskRowGroup title="Today" tasks={[]} lists={[]} onToggle={() => {}} onOpen={() => {}} emptyLabel="Nothing due today." />,
    );
    expect(screen.getByText('Nothing due today.')).toBeInTheDocument();
  });
});