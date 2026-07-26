import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../test/utils';
import TaskChip from './TaskChip';

const baseTask = {
  id: 't1', title: 'Buy milk', status: 'todo', colorKey: 'teal', origin: 'task',
};

function timedTask(overrides = {}) {
  const start = new Date(2026, 6, 15, 9, 0);
  const end = new Date(2026, 6, 15, 10, 0);
  return {
    id: 't2', title: 'Standup', status: 'todo', colorKey: 'coral', origin: 'task',
    scheduledStart: start, scheduledEnd: end, ...overrides,
  };
}

describe('TaskChip', () => {
  it('renders the title', () => {
    render(<TaskChip task={baseTask} lists={[]} onToggle={() => {}} />);
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
  });

  it('hides the body when compact', () => {
    render(<TaskChip task={baseTask} lists={[]} onToggle={() => {}} compact />);
    expect(screen.queryByText('Buy milk')).not.toBeInTheDocument();
  });

  it('toggles the check optimistically and calls onToggle with the id', async () => {
    const onToggle = vi.fn();
    render(<TaskChip task={baseTask} lists={[]} onToggle={onToggle} />);
    const check = screen.getByRole('button', { name: 'Mark as done' });
    expect(check).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(check);
    expect(onToggle).toHaveBeenCalledWith('t1');
    expect(screen.getByRole('button', { name: 'Mark as not done' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('opens the item when the chip is clicked', async () => {
    const onOpen = vi.fn();
    render(<TaskChip task={baseTask} lists={[]} onToggle={() => {}} onOpen={onOpen} />);
    await userEvent.click(screen.getByRole('button', { name: /Buy milk/ }));
    expect(onOpen).toHaveBeenCalledWith(baseTask);
  });

  it('shows the time range for a timed to-do', () => {
    render(<TaskChip task={timedTask()} lists={[]} onToggle={() => {}} />);
    expect(screen.getByText(/–/)).toBeInTheDocument();
  });

  it('disables push-to-tomorrow for a recurring item', () => {
    const onPush = vi.fn();
    render(
      <TaskChip
        task={timedTask({ recurrenceRule: { frequency: 'daily', interval: 1 } })}
        lists={[]}
        onToggle={() => {}}
        onPushToTomorrow={onPush}
      />,
    );
    expect(screen.getByRole('button', { name: 'Push to tomorrow' })).toBeDisabled();
  });

  it('has no always-visible checkbox for an event chip', () => {
    render(<TaskChip task={{ ...baseTask, origin: 'event' }} lists={[]} onToggle={() => {}} />);
    expect(screen.queryByRole('button', { name: /Mark as/ })).not.toBeInTheDocument();
  });
});