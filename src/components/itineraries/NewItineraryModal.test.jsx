import {
  describe, it, expect, vi,
} from 'vitest';
import {
  renderWithRouter, screen, userEvent, fireEvent, waitFor,
} from '../../test/utils';
import NewItineraryModal from './NewItineraryModal';

const groups = [{ id: 'g1', name: 'Roommates' }];
const personalSpace = { name: 'Personal' };

function setup(onCreate = vi.fn().mockResolvedValue({ id: 'new' })) {
  const onClose = vi.fn();
  renderWithRouter(
    <NewItineraryModal groups={groups} personalSpace={personalSpace} onClose={onClose} onCreate={onCreate} />,
  );
  return { onCreate, onClose };
}

describe('NewItineraryModal', () => {
  it('creates with a default title and today range when nothing is entered', async () => {
    const { onCreate } = setup();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(onCreate).toHaveBeenCalled());
    const payload = onCreate.mock.calls[0][0];
    expect(payload.title).toBe('Untitled trip');
    expect(payload.groupId).toBeNull();
    expect(payload.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(payload.endDate).toEqual(payload.startDate);
  });

  it('sends the chosen title and group scope', async () => {
    const { onCreate } = setup();
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('Barcelona Trip'), 'Ski trip');
    await user.click(screen.getByRole('button', { name: 'Roommates' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(onCreate).toHaveBeenCalled());
    expect(onCreate.mock.calls[0][0]).toMatchObject({ title: 'Ski trip', groupId: 'g1' });
  });

  it('blocks submit and shows an error when end precedes start', () => {
    const { onCreate } = setup();
    // Push the start past the (untouched) default end so end < start. The end input's `min`
    // makes the reverse awkward to drive in jsdom; the start field has no such constraint.
    const start = screen.getByLabelText('Start date');
    fireEvent.change(start, { target: { value: '2099-01-01' } });
    fireEvent.submit(start.closest('form'));
    expect(screen.getByText('End date must be on or after the start date')).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('sends a day count instead of dates when not scheduled yet', async () => {
    const { onCreate } = setup();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Not scheduled yet' }));
    fireEvent.change(screen.getByLabelText('Expected length (days)'), { target: { value: '4' } });
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(onCreate).toHaveBeenCalled());
    const payload = onCreate.mock.calls[0][0];
    expect(payload.dayCount).toBe(4);
    expect(payload.startDate).toBeUndefined();
    expect(payload.endDate).toBeUndefined();
  });

  it('falls back to a single day when the count is left blank', async () => {
    const { onCreate } = setup();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Not scheduled yet' }));
    fireEvent.change(screen.getByLabelText('Expected length (days)'), { target: { value: '' } });
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(onCreate).toHaveBeenCalled());
    expect(onCreate.mock.calls[0][0].dayCount).toBe(1);
  });

  it('rejects a day count below 1 with the field\'s own minimum', async () => {
    const { onCreate } = setup();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Not scheduled yet' }));
    const days = screen.getByLabelText('Expected length (days)');
    fireEvent.change(days, { target: { value: '0' } });
    expect(days).toBeInvalid();
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('offers emoji as well as the icon set', async () => {
    const { onCreate } = setup();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Use a custom emoji'), '🦕');
    await user.click(screen.getByRole('button', { name: 'Use' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(onCreate).toHaveBeenCalled());
    expect(onCreate.mock.calls[0][0].icon).toBe('🦕');
  });

  it('closes on Cancel', async () => {
    const { onClose } = setup();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
});
