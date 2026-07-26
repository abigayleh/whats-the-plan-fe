import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../test/utils';
import CalendarViewSwitcher from './CalendarViewSwitcher';

describe('CalendarViewSwitcher', () => {
  it('renders a button per view', () => {
    render(<CalendarViewSwitcher view="month" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Month' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Week' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Day' })).toBeInTheDocument();
  });

  it('marks the active view', () => {
    render(<CalendarViewSwitcher view="week" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Week' }).className).toContain('view-switcher__option--active');
    expect(screen.getByRole('button', { name: 'Month' }).className).not.toContain('--active');
  });

  it('calls onChange with the clicked view key', async () => {
    const onChange = vi.fn();
    render(<CalendarViewSwitcher view="month" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Day' }));
    expect(onChange).toHaveBeenCalledWith('day');
  });
});