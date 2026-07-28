import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import {
  renderWithRouter, screen, act, userEvent,
} from '../../test/utils';
import ItineraryList from './ItineraryList';

// The real DndContext still renders (useSortable needs it); this only grabs the drop
// handler, since a pointer drag can't be simulated in jsdom.
let onDragEnd;
vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    DndContext: (props) => {
      onDragEnd = props.onDragEnd;
      return <actual.DndContext {...props} />;
    },
  };
});

const unplanned = {
  id: 'u1', title: 'Lisbon', startDate: null, endDate: null, dayCount: 5, completedAt: null,
};
const planned = {
  id: 'p1', title: 'Barcelona', startDate: new Date(2026, 6, 25), endDate: new Date(2026, 6, 30), completedAt: null,
};
const planned2 = {
  id: 'p2', title: 'Porto', startDate: new Date(2026, 8, 1), endDate: new Date(2026, 8, 5), completedAt: null,
};
const done = {
  id: 'd1', title: 'Rome', startDate: new Date(2025, 3, 1), endDate: new Date(2025, 3, 8), completedAt: new Date(),
};

function renderList(itineraries, props = {}) {
  const merged = {
    loading: false,
    onSetCompleted: vi.fn(),
    onDelete: vi.fn(),
    onReorder: vi.fn(),
    ...props,
  };
  const view = renderWithRouter(<ItineraryList itineraries={itineraries} {...merged} />);
  return { ...merged, ...view };
}

describe('ItineraryList', () => {
  beforeEach(() => localStorage.clear());

  it('shows a loading placeholder while loading', () => {
    renderList([], { loading: true });
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows the empty state under Planned when there are no trips', () => {
    renderList([]);
    expect(screen.getByText('Planned')).toBeInTheDocument();
    expect(screen.getByText('No trips yet')).toBeInTheDocument();
    expect(screen.queryByText('To be planned')).not.toBeInTheDocument();
    expect(screen.queryByText('Completed')).not.toBeInTheDocument();
  });

  it('groups undated, dated and completed trips into their own sections', () => {
    renderList([unplanned, planned, done]);
    expect(screen.getByText('To be planned')).toBeInTheDocument();
    expect(screen.getByText('Planned')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Lisbon')).toBeInTheDocument();
    expect(screen.getByText('Barcelona')).toBeInTheDocument();
    expect(screen.getByText('Rome')).toBeInTheDocument();
  });

  it('shows the day count on an unplanned trip and the year on a dated one', () => {
    renderList([unplanned, done]);
    expect(screen.getByText('5 days')).toBeInTheDocument();
    expect(screen.getByText('(2025)')).toBeInTheDocument();
  });

  it('collapses a section and remembers it across a remount', async () => {
    const user = userEvent.setup();
    const { unmount } = renderList([planned]);
    await user.click(screen.getByRole('button', { expanded: true, name: /Planned/ }));
    expect(screen.queryByText('Barcelona')).not.toBeInTheDocument();

    unmount();
    renderList([planned]);
    expect(screen.queryByText('Barcelona')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { expanded: false, name: /Planned/ })).toBeInTheDocument();
  });

  it('sends the full new order when a row is dropped on another', () => {
    const { onReorder } = renderList([unplanned, planned, planned2]);
    act(() => onDragEnd({ active: { id: 'p2' }, over: { id: 'p1' } }));
    expect(onReorder).toHaveBeenCalledWith(['u1', 'p2', 'p1']);
  });

  it('ignores a drop on the row itself', () => {
    const { onReorder } = renderList([planned, planned2]);
    act(() => onDragEnd({ active: { id: 'p1' }, over: { id: 'p1' } }));
    expect(onReorder).not.toHaveBeenCalled();
  });

  it('marks an active itinerary completed', async () => {
    const user = userEvent.setup();
    const { onSetCompleted } = renderList([planned]);
    await user.click(screen.getByLabelText('Mark itinerary completed'));
    expect(onSetCompleted).toHaveBeenCalledWith('p1', true);
  });

  it('restores a completed itinerary', async () => {
    const user = userEvent.setup();
    const { onSetCompleted } = renderList([done]);
    await user.click(screen.getByLabelText('Restore itinerary'));
    expect(onSetCompleted).toHaveBeenCalledWith('d1', false);
  });

  it('passes the itinerary object to onDelete', async () => {
    const user = userEvent.setup();
    const { onDelete } = renderList([planned]);
    await user.click(screen.getByLabelText('Delete itinerary'));
    expect(onDelete).toHaveBeenCalledWith(planned);
  });
});