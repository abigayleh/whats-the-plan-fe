import {
  describe, it, expect, vi,
} from 'vitest';
import {
  render, screen, userEvent, waitFor,
} from '../../test/utils';
import DeleteAccountModal from './DeleteAccountModal';

const email = 'me@example.com';

describe('DeleteAccountModal', () => {
  it('keeps the delete button disabled until the email matches', async () => {
    render(<DeleteAccountModal email={email} onCancel={vi.fn()} onConfirm={vi.fn()} />);
    const deleteBtn = screen.getByRole('button', { name: 'Delete Account' });
    expect(deleteBtn).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Email'), 'wrong@example.com');
    expect(deleteBtn).toBeDisabled();
    await userEvent.clear(screen.getByLabelText('Email'));
    await userEvent.type(screen.getByLabelText('Email'), email);
    expect(deleteBtn).toBeEnabled();
  });

  it('calls onConfirm once the email matches', async () => {
    const onConfirm = vi.fn().mockResolvedValue();
    render(<DeleteAccountModal email={email} onCancel={vi.fn()} onConfirm={onConfirm} />);
    await userEvent.type(screen.getByLabelText('Email'), email);
    await userEvent.click(screen.getByRole('button', { name: 'Delete Account' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows a specific message for a LAST_ADMIN failure', async () => {
    const err = Object.assign(new Error('nope'), { code: 'LAST_ADMIN' });
    const onConfirm = vi.fn().mockRejectedValue(err);
    render(<DeleteAccountModal email={email} onCancel={vi.fn()} onConfirm={onConfirm} />);
    await userEvent.type(screen.getByLabelText('Email'), email);
    await userEvent.click(screen.getByRole('button', { name: 'Delete Account' }));
    expect(await screen.findByText(/transfer or resolve admin ownership/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Delete Account' })).toBeEnabled());
  });

  it('cancels', async () => {
    const onCancel = vi.fn();
    render(<DeleteAccountModal email={email} onCancel={onCancel} onConfirm={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});