import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { render, screen, userEvent } from '../../test/utils';
import TaskActionButtons from './TaskActionButtons';
import useAppData from '../../hooks/useAppData';

vi.mock('../../hooks/useAppData', () => ({ default: vi.fn() }));

let updateTask;
let deleteTask;
beforeEach(() => {
  updateTask = vi.fn();
  deleteTask = vi.fn();
  useAppData.mockReturnValue({ updateTask, deleteTask });
});

const task = {
  id: 't1', title: 'Buy milk', status: 'todo', listId: 'l1', dueDate: new Date(2026, 6, 15),
};
const lists = [
  { id: 'l1', name: 'Groceries', isSystem: false },
  { id: 'l2', name: 'Work', isSystem: false },
  { id: 'l-sys', name: 'Assigned to Me', isSystem: true },
];

describe('TaskActionButtons', () => {
  it('renders the four action buttons', () => {
    render(<TaskActionButtons task={task} lists={lists} />);
    ['Reschedule', 'Push to tomorrow', 'Move to another list', 'Delete'].forEach((label) => {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    });
  });

  it('deletes via the real id', async () => {
    render(<TaskActionButtons task={task} lists={lists} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(deleteTask).toHaveBeenCalledWith('t1');
  });

  it('uses sourceId over the occurrence id when present', async () => {
    render(<TaskActionButtons task={{ ...task, id: 'occ-1', sourceId: 'real-1' }} lists={lists} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(deleteTask).toHaveBeenCalledWith('real-1');
  });

  it('pushes to tomorrow via updateTask', async () => {
    render(<TaskActionButtons task={task} lists={lists} />);
    await userEvent.click(screen.getByRole('button', { name: 'Push to tomorrow' }));
    expect(updateTask).toHaveBeenCalledWith('t1', expect.objectContaining({ dueDate: expect.any(Date) }));
  });

  it('opens the reschedule popover with a date input', async () => {
    const { container } = render(<TaskActionButtons task={task} lists={lists} />);
    await userEvent.click(screen.getByRole('button', { name: 'Reschedule' }));
    expect(container.querySelector('input[type="date"]')).toBeInTheDocument();
  });

  it('lists only writable lists in the move select', async () => {
    render(<TaskActionButtons task={task} lists={lists} />);
    await userEvent.click(screen.getByRole('button', { name: 'Move to another list' }));
    expect(screen.getByRole('option', { name: 'Groceries' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Work' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Assigned to Me' })).not.toBeInTheDocument();
  });
});