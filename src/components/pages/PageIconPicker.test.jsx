import {
  describe, it, expect, vi,
} from 'vitest';
import {
  renderWithRouter, screen, userEvent,
} from '../../test/utils';
import PageIconPicker from './PageIconPicker';

describe('PageIconPicker', () => {
  it('opens the icon menu and reports the chosen icon', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(<PageIconPicker icon={null} onChange={onChange} disabled={false} />);
    await user.click(screen.getByRole('button', { name: 'Change page icon' }));
    await user.click(screen.getByRole('button', { name: 'Travel' }));
    expect(onChange).toHaveBeenCalledWith('travel');
  });

  it('clears the icon via the No-icon option', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(<PageIconPicker icon="travel" onChange={onChange} disabled={false} />);
    await user.click(screen.getByRole('button', { name: 'Change page icon' }));
    await user.click(screen.getByRole('button', { name: 'No icon' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('cannot be opened when disabled', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PageIconPicker icon={null} onChange={vi.fn()} disabled />);
    const trigger = screen.getByRole('button', { name: 'Change page icon' });
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByRole('button', { name: 'Travel' })).not.toBeInTheDocument();
  });
});