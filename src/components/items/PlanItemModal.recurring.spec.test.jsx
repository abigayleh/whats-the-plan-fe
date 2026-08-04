import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { render, screen, userEvent } from '../../test/utils';
import PlanItemModal from './PlanItemModal';

vi.mock('../../hooks/useGroupMembers', () => ({ default: () => [] }));
vi.mock('./LocationSearch', () => ({ default: () => null }));
vi.mock('../lists/AttachmentUploader', () => ({ default: () => null }));

beforeEach(() => {
  if (!globalThis.crypto?.randomUUID) {
    globalThis.crypto = { randomUUID: () => Math.random().toString(36).slice(2) };
  }
});

const lists = [{
  id: 'l1', name: 'Groceries', isSystem: false, isDefault: true, groupId: null,
}];

// A calendar occurrence: sourceId points at the series row, and the rule is nulled because the
// server already expanded it. Deleting here removes the day, never the series.
const occurrence = {
  id: 't1:2026-08-04',
  sourceId: 't1',
  origin: 'task',
  title: 'Water plants',
  status: 'todo',
  listId: 'l1',
  dueDate: new Date(2026, 7, 4),
  isRecurring: true,
  recurrenceRule: null,
};

function renderModal(overrides = {}) {
  const props = {
    lists,
    groups: [],
    personalSpace: { name: 'Personal', colorKey: 'primary' },
    onClose: vi.fn(),
    onSave: vi.fn().mockResolvedValue({}),
    onDelete: vi.fn().mockResolvedValue(),
    onSkipOccurrence: vi.fn().mockResolvedValue(),
    ...overrides,
  };
  render(<PlanItemModal {...props} />);
  return props;
}

describe('a recurring occurrence opened from the calendar', () => {
  it('offers to remove the day rather than delete the to-do', () => {
    renderModal({ item: occurrence });
    expect(screen.getByRole('button', { name: 'Remove this day' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('skips only that occurrence, leaving the series alone', async () => {
    const props = renderModal({ item: occurrence });
    await userEvent.click(screen.getByRole('button', { name: 'Remove this day' }));
    expect(props.onSkipOccurrence).toHaveBeenCalledWith(
      expect.objectContaining({ sourceId: 't1' }),
      occurrence.dueDate,
    );
    expect(props.onDelete).not.toHaveBeenCalled();
  });

  it('says where the whole series can be deleted', () => {
    renderModal({ item: occurrence });
    expect(screen.getByText(/delete the whole to-do from its list/i)).toBeInTheDocument();
  });
});

describe('a non-recurring item opened from the calendar', () => {
  it('still offers a plain delete', () => {
    renderModal({ item: { ...occurrence, isRecurring: false } });
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove this day' })).not.toBeInTheDocument();
  });
});