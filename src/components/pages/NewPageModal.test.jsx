import {
  describe, it, expect, vi,
} from 'vitest';
import {
  renderWithRouter, screen, userEvent, waitFor,
} from '../../test/utils';
import NewPageModal from './NewPageModal';

const groups = [{ id: 'g1', name: 'Crew' }];
const personalSpace = { name: 'Personal' };

function setup(onCreate = vi.fn().mockResolvedValue(undefined)) {
  const onClose = vi.fn();
  renderWithRouter(
    <NewPageModal groups={groups} personalSpace={personalSpace} onClose={onClose} onCreate={onCreate} />,
  );
  return { onCreate, onClose };
}

describe('NewPageModal', () => {
  it('defaults the title to "Untitled" and personal scope', async () => {
    const { onCreate } = setup();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith({ title: 'Untitled', groupId: null, icon: null }));
  });

  it('submits the entered title, chosen group, and icon', async () => {
    const { onCreate } = setup();
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('Untitled'), 'Roadmap');
    await user.click(screen.getByRole('button', { name: 'Crew' }));
    await user.click(screen.getByRole('button', { name: 'Travel' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith({ title: 'Roadmap', groupId: 'g1', icon: 'travel' }));
  });

  it('surfaces a creation error and keeps the modal open', async () => {
    const onCreate = vi.fn().mockRejectedValue(new Error('nope'));
    setup(onCreate);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('nope')).toBeInTheDocument();
    // button re-enables after the failure
    expect(screen.getByRole('button', { name: 'Create' })).toBeEnabled();
  });

  it('closes on Cancel', async () => {
    const { onClose } = setup();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
});