import {
  describe, it, expect, vi,
} from 'vitest';
import {
  renderWithRouter, screen, userEvent,
} from '../../test/utils';
import ItineraryList from './ItineraryList';

const active = { id: 'a1', title: 'Barcelona', completedAt: null };
const done = { id: 'd1', title: 'Rome', completedAt: new Date() };

describe('ItineraryList', () => {
  it('shows a loading placeholder while loading', () => {
    renderWithRouter(<ItineraryList itineraries={[]} loading onSetCompleted={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows the empty state when there are no active trips', () => {
    renderWithRouter(<ItineraryList itineraries={[]} loading={false} onSetCompleted={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('No trips yet')).toBeInTheDocument();
    expect(screen.queryByText('Completed')).not.toBeInTheDocument();
  });

  it('splits active trips from a Completed section', () => {
    renderWithRouter(
      <ItineraryList itineraries={[active, done]} loading={false} onSetCompleted={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText('Barcelona')).toBeInTheDocument();
    expect(screen.getByText('Rome')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('marks an active itinerary completed', async () => {
    const onSetCompleted = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(
      <ItineraryList itineraries={[active]} loading={false} onSetCompleted={onSetCompleted} onDelete={vi.fn()} />,
    );
    await user.click(screen.getByLabelText('Mark itinerary completed'));
    expect(onSetCompleted).toHaveBeenCalledWith('a1', true);
  });

  it('restores a completed itinerary', async () => {
    const onSetCompleted = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(
      <ItineraryList itineraries={[done]} loading={false} onSetCompleted={onSetCompleted} onDelete={vi.fn()} />,
    );
    await user.click(screen.getByLabelText('Restore itinerary'));
    expect(onSetCompleted).toHaveBeenCalledWith('d1', false);
  });

  it('passes the itinerary object to onDelete', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(
      <ItineraryList itineraries={[active]} loading={false} onSetCompleted={vi.fn()} onDelete={onDelete} />,
    );
    await user.click(screen.getByLabelText('Delete itinerary'));
    expect(onDelete).toHaveBeenCalledWith(active);
  });
});