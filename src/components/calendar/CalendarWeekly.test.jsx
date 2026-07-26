import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../test/utils';
import CalendarWeekly from './CalendarWeekly';

const focusDate = new Date(2026, 6, 15); // week of Sun Jul 12 – Sat Jul 18

const noop = () => {};
const handlers = {
  onSelectDay: noop, onToggleTask: noop, onOpenTask: noop, onCreateTask: noop, onMoveTask: noop,
};

describe('CalendarWeekly', () => {
  it('renders seven day header cells', () => {
    render(<CalendarWeekly focusDate={focusDate} tasks={[]} {...handlers} />);
    expect(screen.getAllByRole('button')).toHaveLength(7);
  });

  it('calls onSelectDay when a day header is clicked', async () => {
    const onSelectDay = vi.fn();
    render(<CalendarWeekly focusDate={focusDate} tasks={[]} {...handlers} onSelectDay={onSelectDay} />);
    await userEvent.click(screen.getByText('15'));
    expect(onSelectDay).toHaveBeenCalledTimes(1);
    expect(onSelectDay.mock.calls[0][0].getDate()).toBe(15);
  });

  it('disables a day the parent marks as disabled', () => {
    render(
      <CalendarWeekly
        focusDate={focusDate}
        tasks={[]}
        {...handlers}
        isDayDisabled={(day) => day.getDate() === 15}
      />,
    );
    expect(screen.getByText('15').closest('button')).toBeDisabled();
    expect(screen.getByText('16').closest('button')).not.toBeDisabled();
  });
});