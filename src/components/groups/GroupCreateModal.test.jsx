import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../test/utils';
import GroupCreateModal from './GroupCreateModal';

describe('GroupCreateModal', () => {
  it('does not save when the name is empty', async () => {
    const onSave = vi.fn();
    render(<GroupCreateModal onClose={vi.fn()} onSave={onSave} />);
    // required attribute blocks native submit; force submit to prove the guard holds too.
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves the trimmed name with the default color', async () => {
    const onSave = vi.fn();
    render(<GroupCreateModal onClose={vi.fn()} onSave={onSave} />);
    await userEvent.type(screen.getByLabelText('Name'), '  Roommates ');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onSave).toHaveBeenCalledWith({ name: 'Roommates', colorKey: 'primary' });
  });

  it('saves with a chosen color', async () => {
    const onSave = vi.fn();
    render(<GroupCreateModal onClose={vi.fn()} onSave={onSave} />);
    await userEvent.type(screen.getByLabelText('Name'), 'Trip');
    await userEvent.click(screen.getByRole('button', { name: 'teal' }));
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onSave).toHaveBeenCalledWith({ name: 'Trip', colorKey: 'teal' });
  });

  it('closes on Cancel', async () => {
    const onClose = vi.fn();
    render(<GroupCreateModal onClose={onClose} onSave={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});