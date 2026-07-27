import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import {
  render, screen, userEvent, waitFor, fireEvent,
} from '../../test/utils';
import PlanItemModal from './PlanItemModal';

vi.mock('../../hooks/useGroupMembers', () => ({ default: () => [] }));
vi.mock('./LocationSearch', () => ({ default: () => null }));
vi.mock('../lists/AttachmentUploader', () => ({ default: () => null }));

const personalSpace = { name: 'Personal', colorKey: 'primary' };
const lists = [
  { id: 'l1', name: 'Groceries', isSystem: false, isDefault: true, groupId: null },
  { id: 'sys', name: 'Assigned to Me', isSystem: true, groupId: null },
];

function renderModal(overrides = {}) {
  const props = {
    lists,
    groups: [],
    personalSpace,
    onClose: vi.fn(),
    onSave: vi.fn().mockResolvedValue({}),
    onDelete: vi.fn().mockResolvedValue(),
    ...overrides,
  };
  return { props, ...render(<PlanItemModal {...props} />) };
}

beforeEach(() => {
  // stable id for subtasks
  if (!globalThis.crypto?.randomUUID) {
    globalThis.crypto = { randomUUID: () => Math.random().toString(36).slice(2) };
  }
});

describe('PlanItemModal', () => {
  it('renders as a New Task when a list is selected', () => {
    renderModal();
    expect(screen.getByRole('heading', { name: 'New Task' })).toBeInTheDocument();
  });

  it('renders as a New Event with a calendar picker when origin is event', () => {
    renderModal({ defaultOrigin: 'event' });
    expect(screen.getByRole('heading', { name: 'New Event' })).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Personal' })).toBeInTheDocument();
  });

  it('seeds a new to-do into the space default list, not the first one', () => {
    renderModal({ lists: [{ id: 'l0', name: 'Inbox', isSystem: false }, ...lists] });
    expect(screen.getByLabelText('List')).toHaveValue('l1');
  });

  it('lets a new to-do be switched to a calendar event', async () => {
    renderModal();
    await userEvent.selectOptions(screen.getByLabelText('List'), '');
    expect(screen.getByRole('heading', { name: 'New Event' })).toBeInTheDocument();
  });

  it('falls back to a calendar event when there is no writable list', () => {
    renderModal({ lists: [{ id: 'sys', name: 'Assigned to Me', isSystem: true }] });
    expect(screen.getByRole('heading', { name: 'New Event' })).toBeInTheDocument();
    expect(screen.getByLabelText('List')).toHaveValue('');
  });

  it('keeps the seeded time when a to-do is created from a calendar slot', async () => {
    const start = new Date('2026-07-15T14:00:00');
    const { props } = renderModal({
      defaultSchedule: { scheduledStart: start, scheduledEnd: new Date('2026-07-15T15:00:00') },
    });
    await userEvent.type(screen.getByLabelText('Title'), 'Call plumber');
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(props.onSave).toHaveBeenCalled());
    expect(props.onSave.mock.calls[0][0]).toMatchObject({ origin: 'task', listId: 'l1' });
    expect(props.onSave.mock.calls[0][0].scheduledStart).toEqual(start);
  });

  it('excludes system lists from the list select', () => {
    renderModal();
    expect(screen.getByRole('option', { name: 'Groceries' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Assigned to Me' })).not.toBeInTheDocument();
  });

  it('adds and removes a sub-to-do', async () => {
    renderModal();
    const input = screen.getByPlaceholderText('Add a sub-to-do');
    await userEvent.type(input, 'Pack bags{Enter}');
    expect(screen.getByText('Pack bags')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove sub-to-do' }));
    expect(screen.queryByText('Pack bags')).not.toBeInTheDocument();
  });

  it('autosaves the title and closes on Done', async () => {
    const { props } = renderModal();
    await userEvent.type(screen.getByLabelText('Title'), 'Buy milk');
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(props.onSave).toHaveBeenCalled());
    expect(props.onSave.mock.calls[0][0]).toMatchObject({ title: 'Buy milk', origin: 'task' });
    await waitFor(() => expect(props.onClose).toHaveBeenCalled());
  });

  it('calls onDelete when editing an existing item', async () => {
    const item = {
      origin: 'task', sourceId: 't1', id: 't1', title: 'Existing', status: 'todo', listId: 'l1',
    };
    const { props } = renderModal({ item });
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(props.onDelete).toHaveBeenCalled());
  });

  it('rejects a calendar event whose end is before its start', async () => {
    renderModal({ defaultOrigin: 'event' });
    await userEvent.type(screen.getByLabelText('Title'), 'Meeting');
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-07-15' } });
    const end = screen.getByLabelText('End');
    fireEvent.change(end, { target: { value: '08:00' } });
    fireEvent.blur(end);
    expect(await screen.findByText('End time must be after start time')).toBeInTheDocument();
  });
});