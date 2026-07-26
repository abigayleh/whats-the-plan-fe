import {
  describe, it, expect, vi,
} from 'vitest';
import {
  render, screen, userEvent, waitFor,
} from '../../test/utils';
import JoinGroupModal from './JoinGroupModal';

describe('JoinGroupModal', () => {
  it('joins with the trimmed code and closes on success', async () => {
    const onJoin = vi.fn().mockResolvedValue();
    const onClose = vi.fn();
    render(<JoinGroupModal onClose={onClose} onJoin={onJoin} />);
    await userEvent.type(screen.getByLabelText('Invite code'), '  ABC123 ');
    await userEvent.click(screen.getByRole('button', { name: 'Join' }));
    expect(onJoin).toHaveBeenCalledWith('ABC123');
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('shows an error and stays open when the join fails', async () => {
    const onJoin = vi.fn().mockRejectedValue(new Error('Invalid code'));
    const onClose = vi.fn();
    render(<JoinGroupModal onClose={onClose} onJoin={onJoin} />);
    await userEvent.type(screen.getByLabelText('Invite code'), 'BAD');
    await userEvent.click(screen.getByRole('button', { name: 'Join' }));
    expect(await screen.findByText('Invalid code')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not attempt to join with an empty code', async () => {
    const onJoin = vi.fn();
    render(<JoinGroupModal onClose={vi.fn()} onJoin={onJoin} />);
    await userEvent.click(screen.getByRole('button', { name: 'Join' }));
    expect(onJoin).not.toHaveBeenCalled();
  });
});