import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../test/utils';
import PersonalSpaceModal from './PersonalSpaceModal';

const personalSpace = { name: 'My Space', colorKey: 'coral' };

describe('PersonalSpaceModal', () => {
  it('prefills the current name and saves edits, then closes', async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<PersonalSpaceModal personalSpace={personalSpace} onClose={onClose} onSave={onSave} />);
    const input = screen.getByLabelText('Name');
    expect(input).toHaveValue('My Space');
    await userEvent.clear(input);
    await userEvent.type(input, 'Home Base');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith({ name: 'Home Base', colorKey: 'coral' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not save when the name is cleared', async () => {
    const onSave = vi.fn();
    render(<PersonalSpaceModal personalSpace={personalSpace} onClose={vi.fn()} onSave={onSave} />);
    await userEvent.clear(screen.getByLabelText('Name'));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).not.toHaveBeenCalled();
  });
});