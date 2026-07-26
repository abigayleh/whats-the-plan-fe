import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../test/utils';
import CalendarContentToggle from './CalendarContentToggle';

describe('CalendarContentToggle', () => {
  it('renders the three content options', () => {
    render(<CalendarContentToggle value="all" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Both' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Calendar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Todos' })).toBeInTheDocument();
  });

  it('marks the active option', () => {
    render(<CalendarContentToggle value="todos" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Todos' }).className).toContain('--active');
  });

  it('calls onChange with the option key', async () => {
    const onChange = vi.fn();
    render(<CalendarContentToggle value="all" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Calendar' }));
    expect(onChange).toHaveBeenCalledWith('calendar');
  });
});