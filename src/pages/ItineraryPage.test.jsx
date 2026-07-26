import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import {
  renderWithRouter, screen, userEvent, waitFor,
} from '../test/utils';
import ItineraryPage from './ItineraryPage';
import useAppData from '../hooks/useAppData';
import useItineraries from '../hooks/useItineraries';

vi.mock('../hooks/useAppData');
vi.mock('../hooks/useItineraries');

const itineraries = [
  { id: 'a1', title: 'Barcelona', completedAt: null },
];

function mockHooks(overrides = {}) {
  useAppData.mockReturnValue({
    currentUser: { id: 'me' },
    personalSpace: { name: 'Personal' },
    groups: [{ id: 'g1', name: 'Crew', role: 'ADMIN' }],
  });
  useItineraries.mockReturnValue({
    itineraries,
    loading: false,
    addItinerary: vi.fn(),
    updateItinerary: vi.fn(),
    setCompleted: vi.fn(),
    deleteItinerary: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  });
}

describe('ItineraryPage', () => {
  beforeEach(() => {
    localStorage.clear();
    mockHooks();
  });

  it('renders the sidebar list and the empty-state prompt at the root', () => {
    renderWithRouter(<ItineraryPage />, { route: '/itinerary' });
    expect(screen.getByText('Itineraries')).toBeInTheDocument();
    expect(screen.getByText('Barcelona')).toBeInTheDocument();
    expect(screen.getByText('Select an itinerary, or plan a new one.')).toBeInTheDocument();
  });

  it('collapses and re-expands the sidebar', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ItineraryPage />, { route: '/itinerary' });
    await user.click(screen.getByLabelText('Hide itineraries'));
    expect(screen.queryByText('Itineraries')).not.toBeInTheDocument();
    await user.click(screen.getByLabelText('Show itineraries'));
    expect(screen.getByText('Itineraries')).toBeInTheDocument();
  });

  it('opens the new-itinerary modal', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ItineraryPage />, { route: '/itinerary' });
    await user.click(screen.getByLabelText('New itinerary'));
    expect(screen.getByText('New Itinerary')).toBeInTheDocument();
  });

  it('confirms and runs deletion from the list', async () => {
    const deleteItinerary = vi.fn().mockResolvedValue(undefined);
    mockHooks({ deleteItinerary });
    const user = userEvent.setup();
    renderWithRouter(<ItineraryPage />, { route: '/itinerary' });
    await user.click(screen.getByLabelText('Delete itinerary'));
    expect(screen.getByText('Delete itinerary')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(deleteItinerary).toHaveBeenCalledWith('a1'));
  });
});