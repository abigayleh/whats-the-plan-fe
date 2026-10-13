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
// What the calendar and the Lists page both hand over for a to-do: the series row itself, whose
// date is only where the series is anchored. Only the calendar knows which day was clicked.
const seriesRow = {
  id: 't1',
  sourceId: 't1',
  origin: 'task',
  title: 'Water plants',
  status: 'todo',
  listId: 'l1',
  dueDate: new Date(2026, 7, 4),
  recurrenceRule: { frequency: 'weekly', interval: 1, daysOfWeek: [1, 3] },
};
const clickedDay = new Date(2026, 9, 12);

describe('a repeating to-do opened from the calendar as its series row', () => {
  it('removes the day that was clicked, not the day the series started', async () => {
    const props = renderModal({ item: seriesRow, occurrenceDay: clickedDay });
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove this day' }));
    expect(props.onSkipOccurrence).toHaveBeenCalledWith(
      expect.objectContaining({ sourceId: 't1' }),
      clickedDay,
    );
  });

  it('names the day that would be removed', () => {
    renderModal({ item: seriesRow, occurrenceDay: clickedDay });
    expect(screen.getByText(/Mon, Oct 12/)).toBeInTheDocument();
  });

  it('goes back to a plain delete once the to-do is set to stop repeating', async () => {
    renderModal({ item: seriesRow, occurrenceDay: clickedDay });
    await userEvent.selectOptions(screen.getByLabelText('Repeat'), '');
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove this day' })).not.toBeInTheDocument();
  });
});

describe('a repeating to-do opened from its list', () => {
  it('deletes the whole series, as there is no single day in play', () => {
    renderModal({ item: seriesRow });
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove this day' })).not.toBeInTheDocument();
  });
});

describe('the schedule of a to-do', () => {
  it('shows a repeating to-do as a start date plus when it repeats', () => {
    renderModal({ item: seriesRow });
    expect(screen.getByLabelText('Starts')).toHaveValue('2026-08-04');
    expect(screen.getByText('Repeats weekly on Mon, Wed')).toBeInTheDocument();
    expect(screen.queryByLabelText('Complete by')).not.toBeInTheDocument();
  });

  it('keeps "Complete by" while the to-do does not repeat', () => {
    renderModal({ item: { ...seriesRow, recurrenceRule: null } });
    expect(screen.getByLabelText('Complete by')).toHaveValue('2026-08-04');
    expect(screen.queryByText(/^Repeats/)).not.toBeInTheDocument();
  });

  it('turns the date into a start date as soon as a repeat is chosen', async () => {
    renderModal({ item: { ...seriesRow, recurrenceRule: null } });
    await userEvent.selectOptions(screen.getByLabelText('Repeat'), 'monthly');
    expect(screen.getByLabelText('Starts')).toBeInTheDocument();
    expect(screen.getByText('Repeats monthly on the 4th')).toBeInTheDocument();
  });

  it('asks how it repeats before asking when it starts', () => {
    renderModal({ item: seriesRow });
    const repeat = screen.getByLabelText('Repeat');
    const starts = screen.getByLabelText('Starts');
    expect(repeat.compareDocumentPosition(starts) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('a repeating event', () => {
  it('keeps its Date field where it was, and gains no repeat summary', () => {
    renderModal({
      item: {
        id: 'event-e1:2026-10-12',
        sourceId: 'e1',
        origin: 'event',
        title: 'Standup',
        scheduledStart: new Date(2026, 9, 12, 9, 0),
        scheduledEnd: new Date(2026, 9, 12, 9, 30),
        isRecurring: true,
        recurrenceRule: null,
        rule: { frequency: 'daily', interval: 1 },
      },
    });
    const date = screen.getByLabelText('Date');
    const repeat = screen.getByLabelText('Repeat');
    expect(date.compareDocumentPosition(repeat) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByLabelText('Starts')).not.toBeInTheDocument();
    expect(screen.queryByText(/^Repeats/)).not.toBeInTheDocument();
  });
});
