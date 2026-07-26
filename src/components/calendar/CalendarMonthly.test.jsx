import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../test/utils';
import CalendarMonthly from './CalendarMonthly';

const focusDate = new Date(2026, 6, 15); // July 2026

describe('CalendarMonthly', () => {
  it('renders weekday headers', () => {
    render(<CalendarMonthly focusDate={focusDate} tasks={[]} onSelectDay={() => {}} />);
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('calls onSelectDay with the clicked day', async () => {
    const onSelectDay = vi.fn();
    render(<CalendarMonthly focusDate={focusDate} tasks={[]} onSelectDay={onSelectDay} />);
    // 15 is unique to July within this grid.
    await userEvent.click(screen.getByText('15'));
    expect(onSelectDay).toHaveBeenCalledTimes(1);
    expect(onSelectDay.mock.calls[0][0].getDate()).toBe(15);
  });

  it('renders a dot for a task falling on a day', () => {
    const tasks = [{ id: 't1', colorKey: 'teal', dueDate: new Date(2026, 6, 15) }];
    render(<CalendarMonthly focusDate={focusDate} tasks={tasks} onSelectDay={() => {}} />);
    const dayCell = screen.getByText('15').closest('button');
    expect(dayCell.querySelectorAll('.calendar-month__dot').length).toBe(1);
  });

  it('marks days from adjacent months as outside', () => {
    const { container } = render(
      <CalendarMonthly focusDate={focusDate} tasks={[]} onSelectDay={() => {}} />,
    );
    // The 42-cell grid always spills into the prev/next month.
    expect(container.querySelectorAll('.calendar-month__day--outside').length).toBeGreaterThan(0);
  });
});