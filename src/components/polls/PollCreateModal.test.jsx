import {
  describe, it, expect, vi,
} from 'vitest';
import {
  render, screen, userEvent, waitFor,
} from '../../test/utils';
import PollCreateModal from './PollCreateModal';

const groups = [
  { id: 'g1', name: 'Alpha' },
  { id: 'g2', name: 'Beta' },
];

function setup(onSave = vi.fn().mockResolvedValue()) {
  const onClose = vi.fn();
  render(<PollCreateModal groups={groups} onClose={onClose} onSave={onSave} />);
  return { onSave, onClose };
}

describe('PollCreateModal', () => {
  it('starts with two empty option rows and no remove buttons', () => {
    setup();
    expect(screen.getByPlaceholderText('Option 1')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Option 2')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove option' })).not.toBeInTheDocument();
  });

  it('adds and removes option rows', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: /Add option/ }));
    expect(screen.getByPlaceholderText('Option 3')).toBeInTheDocument();
    const removeButtons = screen.getAllByRole('button', { name: 'Remove option' });
    expect(removeButtons).toHaveLength(3);
    await userEvent.click(removeButtons[0]);
    expect(screen.queryByPlaceholderText('Option 3')).not.toBeInTheDocument();
  });

  it('shows an error when fewer than two options are filled', async () => {
    const { onSave } = setup();
    await userEvent.type(screen.getByLabelText('Question'), 'Pick one');
    await userEvent.type(screen.getByPlaceholderText('Option 1'), 'Only one');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Give the poll at least 2 options')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('rejects an expiry in the past', async () => {
    const { onSave } = setup();
    await userEvent.type(screen.getByLabelText('Question'), 'Pick one');
    await userEvent.type(screen.getByPlaceholderText('Option 1'), 'Tacos');
    await userEvent.type(screen.getByPlaceholderText('Option 2'), 'Pizza');
    const expiry = document.querySelector('input[type="date"]');
    await userEvent.type(expiry, '2000-01-01');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Expiry must be in the future')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('submits a trimmed payload with the selected group and options', async () => {
    const { onSave } = setup();
    await userEvent.type(screen.getByLabelText('Question'), '  Where to? ');
    await userEvent.type(screen.getByPlaceholderText('Option 1'), '  Tacos ');
    await userEvent.type(screen.getByPlaceholderText('Option 2'), 'Pizza');
    await userEvent.selectOptions(screen.getByLabelText('Group'), 'g2');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith({
      question: 'Where to?',
      groupId: 'g2',
      expiresAt: null,
      optionTexts: ['Tacos', 'Pizza'],
    });
  });

  it('surfaces an error thrown by onSave', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Server said no'));
    setup(onSave);
    await userEvent.type(screen.getByLabelText('Question'), 'Q');
    await userEvent.type(screen.getByPlaceholderText('Option 1'), 'A');
    await userEvent.type(screen.getByPlaceholderText('Option 2'), 'B');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Server said no')).toBeInTheDocument();
  });

  it('closes on Cancel without saving', async () => {
    const { onClose, onSave } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });
});