import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../test/utils';
import CalendarTimeline, { CalendarHourGutter } from './CalendarTimeline';

const day = new Date(2026, 6, 15);
const now = new Date(2026, 6, 15, 8, 0);

describe('CalendarHourGutter', () => {
  it('renders the To-dos all-day label when enabled', () => {
    render(<CalendarHourGutter showAllday />);
    expect(screen.getByText('To-dos')).toBeInTheDocument();
  });

  it('omits the all-day label when disabled', () => {
    render(<CalendarHourGutter />);
    expect(screen.queryByText('To-dos')).not.toBeInTheDocument();
  });
});

describe('CalendarTimeline', () => {
  it('renders an all-day (date-only) to-do as a chip', () => {
    const tasks = [{
      id: 't1', title: 'Groceries', status: 'todo', colorKey: 'teal', origin: 'task',
      dueDate: new Date(2026, 6, 15),
    }];
    render(<CalendarTimeline day={day} tasks={tasks} now={now} onCreateTask={() => {}} />);
    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });

  it('renders a timed to-do inside the timeline column', () => {
    const tasks = [{
      id: 't2', title: 'Standup', status: 'todo', colorKey: 'coral', origin: 'task',
      scheduledStart: new Date(2026, 6, 15, 9, 0), scheduledEnd: new Date(2026, 6, 15, 10, 0),
    }];
    render(<CalendarTimeline day={day} tasks={tasks} now={now} onCreateTask={() => {}} />);
    expect(screen.getByText('Standup')).toBeInTheDocument();
  });

  it('calls onCreateTask when the timeline column is clicked', () => {
    const onCreateTask = vi.fn();
    const { container } = render(
      <CalendarTimeline day={day} tasks={[]} now={now} onCreateTask={onCreateTask} />,
    );
    fireEvent.click(container.querySelector('.calendar-timeline__col'));
    expect(onCreateTask).toHaveBeenCalledTimes(1);
    expect(onCreateTask.mock.calls[0][0].getDate()).toBe(15);
  });

  it('does not fire create when the column is disabled', () => {
    const onCreateTask = vi.fn();
    const { container } = render(
      <CalendarTimeline day={day} tasks={[]} now={now} disabled onCreateTask={onCreateTask} />,
    );
    fireEvent.click(container.querySelector('.calendar-timeline__col'));
    expect(onCreateTask).not.toHaveBeenCalled();
  });
});