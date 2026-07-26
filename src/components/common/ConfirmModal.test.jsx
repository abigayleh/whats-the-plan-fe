import {
  describe, it, expect, vi,
} from 'vitest';
import { render, screen, userEvent, waitFor } from '../../test/utils';
import ConfirmModal from './ConfirmModal';

describe('ConfirmModal', () => {
  it('renders a string message and default labels', () => {
    render(<ConfirmModal title="Delete?" message="Are you sure?" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('renders a node message and custom labels', () => {
    render(
      <ConfirmModal
        title="T"
        message={<span>node message</span>}
        confirmLabel="Leave"
        cancelLabel="Stay"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText('node message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Leave' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stay' })).toBeInTheDocument();
  });

  it('calls onConfirm when confirm is clicked', async () => {
    const onConfirm = vi.fn().mockResolvedValue();
    render(<ConfirmModal title="T" message="m" onConfirm={onConfirm} onCancel={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel is clicked', async () => {
    const onCancel = vi.fn();
    render(<ConfirmModal title="T" message="m" onConfirm={vi.fn()} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows a busy label and disables both buttons while confirming', async () => {
    let resolve;
    const onConfirm = vi.fn(() => new Promise((r) => { resolve = r; }));
    render(<ConfirmModal title="T" message="m" onConfirm={onConfirm} onCancel={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('button', { name: 'Working…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    resolve();
  });

  it('re-enables the confirm button when onConfirm rejects', async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error('nope'));
    render(<ConfirmModal title="T" message="m" onConfirm={onConfirm} onCancel={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled());
  });
});