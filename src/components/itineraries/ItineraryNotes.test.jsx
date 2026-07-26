import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import {
  renderWithRouter, screen, waitFor, userEvent,
} from '../../test/utils';
import ItineraryNotes from './ItineraryNotes';
import * as itinerariesApi from '../../api/itineraries';

// Swap the TipTap editor for a stub that exposes onChange through a button click.
vi.mock('../common/RichTextEditor', () => ({
  default: ({ editable, onChange }) => (
    <button type="button" data-editable={String(editable)} onClick={() => onChange({ doc: 1 })}>
      editor
    </button>
  ),
}));

vi.mock('../../api/itineraries', () => ({
  get: vi.fn(),
  update: vi.fn(),
}));

const itinerary = { id: 'it1' };

describe('ItineraryNotes', () => {
  beforeEach(() => {
    itinerariesApi.get.mockResolvedValue({ content: null });
    itinerariesApi.update.mockResolvedValue({});
  });

  it('shows a loading placeholder until content resolves', async () => {
    renderWithRouter(<ItineraryNotes itinerary={itinerary} editable />);
    expect(screen.getByText('Loading notes…')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('editor')).toBeInTheDocument());
  });

  it('autosaves an edit and surfaces the saved status', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ItineraryNotes itinerary={itinerary} editable />);
    await user.click(await screen.findByText('editor'));
    expect(screen.getByText('Saving…')).toBeInTheDocument();
    // debounced 600ms write then flips to Saved
    await waitFor(() => expect(itinerariesApi.update).toHaveBeenCalledWith('it1', { content: { doc: 1 } }));
    await waitFor(() => expect(screen.getByText('Saved')).toBeInTheDocument());
  });

  it('does not save when read-only', async () => {
    renderWithRouter(<ItineraryNotes itinerary={itinerary} editable={false} />);
    await waitFor(() => expect(screen.getByText('editor')).toBeInTheDocument());
    screen.getByText('editor').click();
    expect(itinerariesApi.update).not.toHaveBeenCalled();
  });
});