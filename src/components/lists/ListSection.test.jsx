import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { render, screen, userEvent } from '../../test/utils';
import ListSection from './ListSection';
import useAppData from '../../hooks/useAppData';
import usePlanItems from '../../hooks/usePlanItems';

vi.mock('../../hooks/useAppData', () => ({ default: vi.fn() }));
vi.mock('../../hooks/usePlanItems', () => ({ default: vi.fn() }));

beforeEach(() => {
  useAppData.mockReturnValue({ updateTask: vi.fn(), deleteTask: vi.fn() });
  usePlanItems.mockReturnValue({ saveItem: vi.fn().mockResolvedValue({}) });
  localStorage.clear();
});

const tasks = [
  { id: 't1', title: 'Todo one', status: 'todo', colorKey: 'teal', listId: 'l1' },
  { id: 't2', title: 'Done one', status: 'done', colorKey: 'teal', listId: 'l1' },
];

function renderSection(overrides = {}) {
  const props = {
    list: { id: 'l1', name: 'Groceries', colorKey: 'teal', isSystem: false },
    tasks,
    allLists: [],
    showCompleted: true,
    hideScheduled: false,
    onToggleTask: vi.fn(),
    onEditTask: vi.fn(),
    onAddTask: vi.fn(),
    onEditList: vi.fn(),
    onDeleteList: vi.fn(),
    ...overrides,
  };
  return { props, ...render(<ListSection {...props} />) };
}

describe('ListSection', () => {
  it('renders the list name and task count', () => {
    renderSection();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument(); // 1 todo of 2 visible
  });

  it('collapses and hides tasks when the header is toggled', async () => {
    renderSection({ list: { id: 'collapse-test', name: 'Groceries', colorKey: 'teal', isSystem: false } });
    expect(screen.getByText('Todo one')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { expanded: true }));
    expect(screen.queryByText('Todo one')).not.toBeInTheDocument();
  });

  it('hides completed tasks when showCompleted is false', () => {
    renderSection({ showCompleted: false, list: { id: 'l2', name: 'Groceries', colorKey: 'teal', isSystem: false } });
    expect(screen.getByText('Todo one')).toBeInTheDocument();
    expect(screen.queryByText('Done one')).not.toBeInTheDocument();
  });

  it('calls onAddTask with the list id', async () => {
    const { props } = renderSection({ list: { id: 'l3', name: 'Groceries', colorKey: 'teal', isSystem: false } });
    await userEvent.click(screen.getByRole('button', { name: /Add task/ }));
    expect(props.onAddTask).toHaveBeenCalledWith('l3');
  });

  it('calls onEditList and onDeleteList from the header actions', async () => {
    const { props } = renderSection({ list: { id: 'l4', name: 'Groceries', colorKey: 'teal', isSystem: false } });
    await userEvent.click(screen.getByRole('button', { name: 'Edit Groceries' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete Groceries' }));
    expect(props.onEditList).toHaveBeenCalled();
    expect(props.onDeleteList).toHaveBeenCalled();
  });

  it('hides add/quick-add controls for a system list', () => {
    renderSection({ list: { id: 'sys', name: 'Assigned to Me', colorKey: 'teal', isSystem: true } });
    expect(screen.queryByRole('button', { name: /Add task/ })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Add a to-do…')).not.toBeInTheDocument();
  });

  it('shows a placeholder when the list has no tasks', () => {
    renderSection({ tasks: [], list: { id: 'empty', name: 'Groceries', colorKey: 'teal', isSystem: false } });
    expect(screen.getByText('No tasks yet.')).toBeInTheDocument();
  });
});