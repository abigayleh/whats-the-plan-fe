import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/utils';
import CalendarDaily from './CalendarDaily';

const focusDate = new Date(2026, 6, 15);
const noop = () => {};
const handlers = {
  onToggleTask: noop, onOpenTask: noop, onCreateTask: noop, onMoveTask: noop,
};

describe('CalendarDaily', () => {
  it('shows an empty message when nothing is scheduled', () => {
    render(<CalendarDaily focusDate={focusDate} tasks={[]} {...handlers} />);
    expect(screen.getByText('Nothing scheduled today.')).toBeInTheDocument();
  });

  it('renders timed items and hides the empty message', () => {
    const tasks = [{
      id: 't1', title: 'Standup', status: 'todo', colorKey: 'coral', origin: 'task',
      scheduledStart: new Date(2026, 6, 15, 9, 0), scheduledEnd: new Date(2026, 6, 15, 10, 0),
    }];
    render(<CalendarDaily focusDate={focusDate} tasks={tasks} {...handlers} />);
    expect(screen.queryByText('Nothing scheduled today.')).not.toBeInTheDocument();
    expect(screen.getByText('Standup')).toBeInTheDocument();
  });
});