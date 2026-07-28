import {
  describe, it, expect, vi,
} from 'vitest';
import { Routes, Route, Outlet } from 'react-router-dom';
import {
  renderWithRouter, screen, userEvent, fireEvent,
} from '../../test/utils';
import ItineraryDetail from './ItineraryDetail';

// The Plan/Notes/Polls panes pull in TipTap + Leaflet; stub them to focus on the hub itself.
vi.mock('./ItineraryPlan', () => ({ default: () => <div data-testid="plan-pane" /> }));
vi.mock('./ItineraryNotes', () => ({ default: () => <div data-testid="notes-pane" /> }));
vi.mock('./ItineraryPolls', () => ({ default: () => <div data-testid="polls-pane" /> }));

const base = {
  id: 'it1',
  title: 'Barcelona',
  icon: null,
  groupId: null,
  startDate: new Date(2026, 5, 1),
  endDate: new Date(2026, 5, 5),
  createdById: 'me',
};

function renderDetail({
  itinerary = base, list, canManage = () => true, updateItinerary = vi.fn(), route,
} = {}) {
  const ctx = {
    itineraries: list ?? [itinerary],
    currentUser: { id: 'me' },
    groups: [{ id: 'g1', name: 'Crew', role: 'ADMIN' }],
    personalSpace: { name: 'Personal' },
    canManage,
    updateItinerary,
  };
  renderWithRouter(
    <Routes>
      <Route element={<Outlet context={ctx} />}>
        <Route path="/itinerary/:itineraryId" element={<ItineraryDetail />} />
      </Route>
    </Routes>,
    { route: route ?? `/itinerary/${itinerary.id}` },
  );
  return { updateItinerary };
}

describe('ItineraryDetail', () => {
  it('renders a not-found message for an unknown itinerary', () => {
    // route asks for it1 but the list is empty, so nothing matches
    renderDetail({ list: [], route: '/itinerary/it1' });
    expect(screen.getByText('Itinerary not found.')).toBeInTheDocument();
  });

  it('hides the Polls tab for a personal (no group) itinerary', () => {
    renderDetail();
    expect(screen.getByRole('button', { name: 'Plan' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Notes' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Polls' })).not.toBeInTheDocument();
  });

  it('shows the Polls tab when the itinerary is group-scoped', () => {
    renderDetail({ itinerary: { ...base, groupId: 'g1' } });
    expect(screen.getByRole('button', { name: 'Polls' })).toBeInTheDocument();
  });

  it('switches tab content when a tab is clicked', async () => {
    const user = userEvent.setup();
    renderDetail();
    expect(screen.getByTestId('plan-pane')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Notes' }));
    expect(screen.getByTestId('notes-pane')).toBeInTheDocument();
    expect(screen.queryByTestId('plan-pane')).not.toBeInTheDocument();
  });

  it('commits a changed title on blur', async () => {
    const user = userEvent.setup();
    const { updateItinerary } = renderDetail();
    const input = screen.getByDisplayValue('Barcelona');
    await user.clear(input);
    await user.type(input, 'Madrid');
    fireEvent.blur(input);
    expect(updateItinerary).toHaveBeenCalledWith('it1', { title: 'Madrid' });
  });

  it('does not commit an unchanged or empty title', async () => {
    const user = userEvent.setup();
    const { updateItinerary } = renderDetail();
    const input = screen.getByDisplayValue('Barcelona');
    await user.clear(input);
    fireEvent.blur(input);
    expect(updateItinerary).not.toHaveBeenCalled();
    // field reverts to the original title
    expect(input).toHaveValue('Barcelona');
  });

  it('disables the title input in read-only mode', () => {
    renderDetail({ canManage: () => false });
    expect(screen.getByDisplayValue('Barcelona')).toBeDisabled();
  });

  it('moves a personal itinerary into a group without confirming', async () => {
    const user = userEvent.setup();
    const { updateItinerary } = renderDetail();
    await user.click(screen.getByRole('button', { name: 'Crew' }));
    expect(updateItinerary).toHaveBeenCalledWith('it1', { groupId: 'g1' });
    expect(screen.queryByRole('heading', { name: 'Move itinerary' })).not.toBeInTheDocument();
  });

  it('confirms before moving an itinerary out of its group', async () => {
    const user = userEvent.setup();
    const { updateItinerary } = renderDetail({ itinerary: { ...base, groupId: 'g1' } });
    await user.click(screen.getByRole('button', { name: 'Personal' }));
    expect(updateItinerary).not.toHaveBeenCalled();
    expect(screen.getByText(/Crew members will lose access/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Move' }));
    expect(updateItinerary).toHaveBeenCalledWith('it1', { groupId: null });
  });

  it('leaves the scope unchanged when the move is cancelled', async () => {
    const user = userEvent.setup();
    const { updateItinerary } = renderDetail({ itinerary: { ...base, groupId: 'g1' } });
    await user.click(screen.getByRole('button', { name: 'Personal' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(updateItinerary).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Polls' })).toBeInTheDocument();
  });

  it('locks the scope picker in read-only mode', () => {
    renderDetail({ canManage: () => false });
    expect(screen.getByRole('button', { name: 'Crew' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Personal' })).toBeDisabled();
  });

  it('renders an itinerary with no dates', () => {
    renderDetail({
      itinerary: {
        ...base, startDate: null, endDate: null, dayCount: 3,
      },
    });
    expect(screen.getByText('Not scheduled · 3 days')).toBeInTheDocument();
  });
});
