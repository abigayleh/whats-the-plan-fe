import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../test/utils';
import IconPicker from './IconPicker';

function Fallback(props) {
  return <svg data-testid="fallback" {...props} />;
}

describe('IconPicker', () => {
  it('shows the fallback icon when no icon is set', () => {
    render(<IconPicker icon={null} onChange={vi.fn()} FallbackIcon={Fallback} />);
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });

  it('opens the menu on trigger click and closes it after picking', async () => {
    const onChange = vi.fn();
    render(<IconPicker icon={null} onChange={onChange} FallbackIcon={Fallback} />);
    await userEvent.click(screen.getByRole('button', { name: 'Change icon' }));
    expect(screen.getByRole('button', { name: 'Work' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Work' }));
    expect(onChange).toHaveBeenCalledWith('work');
    expect(screen.queryByRole('button', { name: 'Work' })).not.toBeInTheDocument();
  });

  it('clears the icon via the No icon option', async () => {
    const onChange = vi.fn();
    render(<IconPicker icon="work" onChange={onChange} FallbackIcon={Fallback} />);
    await userEvent.click(screen.getByRole('button', { name: 'Change icon' }));
    await userEvent.click(screen.getByRole('button', { name: 'No icon' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('marks the active icon as pressed', async () => {
    render(<IconPicker icon="work" onChange={vi.fn()} FallbackIcon={Fallback} />);
    await userEvent.click(screen.getByRole('button', { name: 'Change icon' }));
    expect(screen.getByRole('button', { name: 'Work' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'No icon' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('respects a custom aria label and disabled state', () => {
    render(<IconPicker icon={null} onChange={vi.fn()} FallbackIcon={Fallback} disabled ariaLabel="Pick icon" />);
    expect(screen.getByRole('button', { name: 'Pick icon' })).toBeDisabled();
  });
});