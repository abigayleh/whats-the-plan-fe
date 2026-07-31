import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { render, screen, userEvent } from '../../test/utils';
import MonthDayPanel from './MonthDayPanel';
import useAppData from '../../hooks/useAppData';

vi.mock('../../hooks/useAppData', () => ({ default: vi.fn() }));

beforeEach(() => {
  useAppData.mockReturnValue({ updateTask: vi.fn(), deleteTask: vi.fn() });
});

const day = new Date(2026, 7, 14);
const task = {
  id: 't1', title: 'Check in online', origin: 'task', status: 'todo', colorKey: 'primary',
};

function renderPanel(props = {}) {
  return render(
    <MonthDayPanel
      day={day}
      tasks={[task]}
      lists={[]}
      onToggle={vi.fn()}
      onOpen={vi.fn()}
      onOpenDay={vi.fn()}
      {...props}
    />,
  );
}

describe('MonthDayPanel', () => {
  it('names the day and lists what is on it', () => {
    renderPanel();
    expect(screen.getByRole('heading', { name: /14/ })).toBeInTheDocument();
    expect(screen.getByText('Check in online')).toBeInTheDocument();
  });

  it('says so when the day is empty', () => {
    renderPanel({ tasks: [] });
    expect(screen.getByText('Nothing planned.')).toBeInTheDocument();
  });

  it('opens the full day view on request', async () => {
    const onOpenDay = vi.fn();
    renderPanel({ onOpenDay });
    await userEvent.click(screen.getByRole('button', { name: 'Open day' }));
    expect(onOpenDay).toHaveBeenCalledTimes(1);
  });
});