import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import {
  render, screen, userEvent, waitFor,
} from '../../test/utils';
import ListModal from './ListModal';
import useAppData from '../../hooks/useAppData';

vi.mock('../../hooks/useAppData', () => ({ default: vi.fn() }));

beforeEach(() => {
  useAppData.mockReturnValue({ personalSpace: { name: 'Personal', colorKey: 'primary' } });
});

const groups = [{ id: 'g1', name: 'Barcelona' }];

describe('ListModal', () => {
  it('renders the New List title with the personal scope option', () => {
    render(<ListModal groups={groups} onClose={() => {}} onSave={() => {}} />);
    expect(screen.getByRole('heading', { name: 'New List' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Personal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Barcelona' })).toBeInTheDocument();
  });

  it('renders the Edit List title and locks the scope', () => {
    const list = { id: 'l1', name: 'Trip', groupId: 'g1' };
    render(<ListModal list={list} groups={groups} onClose={() => {}} onSave={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Edit List' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Personal' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Barcelona' })).toBeDisabled();
  });

  it('submits the entered name to onSave', async () => {
    const onSave = vi.fn().mockResolvedValue();
    render(<ListModal groups={groups} onClose={() => {}} onSave={onSave} />);
    await userEvent.type(screen.getByLabelText('Name'), 'Camping gear');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0]).toMatchObject({ name: 'Camping gear', groupId: null });
  });

  it('offers emoji alongside the icon set', async () => {
    const onSave = vi.fn().mockResolvedValue();
    render(<ListModal groups={groups} onClose={() => {}} onSave={onSave} />);
    await userEvent.type(screen.getByLabelText('Name'), 'Snacks');
    await userEvent.type(screen.getByLabelText('Use a custom emoji'), '🦕');
    await userEvent.click(screen.getByRole('button', { name: 'Use' }));
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0]).toMatchObject({ icon: '🦕' });
  });

  it('closes without saving on Cancel', async () => {
    const onClose = vi.fn();
    const onSave = vi.fn();
    render(<ListModal groups={groups} onClose={onClose} onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });
});
