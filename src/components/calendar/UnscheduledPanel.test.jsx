import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { render, screen } from '../../test/utils';
import UnscheduledPanel from './UnscheduledPanel';
import useAppData from '../../hooks/useAppData';

vi.mock('../../hooks/useAppData', () => ({ default: vi.fn() }));

beforeEach(() => {
  useAppData.mockReturnValue({ updateTask: vi.fn(), deleteTask: vi.fn() });
});

describe('UnscheduledPanel', () => {
  it('renders the section title and its rows', () => {
    const tasks = [{ id: 't1', title: 'Someday task', status: 'todo', colorKey: 'teal', listId: 'l1' }];
    render(<UnscheduledPanel tasks={tasks} lists={[]} onToggle={() => {}} onOpen={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Unscheduled to-dos' })).toBeInTheDocument();
    expect(screen.getByText('Someday task')).toBeInTheDocument();
  });

  it('shows the empty label when there is nothing unscheduled', () => {
    render(<UnscheduledPanel tasks={[]} lists={[]} onToggle={() => {}} onOpen={() => {}} />);
    expect(screen.getByText('Nothing unscheduled.')).toBeInTheDocument();
  });
});