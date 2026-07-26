import {
  describe, it, expect, vi,
} from 'vitest';
import {
  renderWithRouter, screen, fireEvent, userEvent,
} from '../../test/utils';
import ItineraryDateRange from './ItineraryDateRange';

// Local-constructed dates stay date-only (no timezone shift) so toInput() is deterministic.
const start = new Date(2026, 5, 1); // 2026-06-01
const end = new Date(2026, 5, 5); // 2026-06-05

describe('ItineraryDateRange', () => {
  it('renders read-only text (no button) when not editable', () => {
    renderWithRouter(<ItineraryDateRange startDate={start} endDate={end} editable={false} onChange={vi.fn()} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    // Both formatted dates appear in the range text.
    expect(screen.getByText(/Jun 1, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Jun 5, 2026/)).toBeInTheDocument();
  });

  it('reveals date pickers when the editable range is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ItineraryDateRange startDate={start} endDate={end} editable onChange={vi.fn()} />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByLabelText('Start date')).toHaveValue('2026-06-01');
    expect(screen.getByLabelText('End date')).toHaveValue('2026-06-05');
  });

  it('commits the edited range as yyyy-mm-dd via onChange', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(<ItineraryDateRange startDate={start} endDate={end} editable onChange={onChange} />);
    await user.click(screen.getByRole('button'));
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2026-06-03' } });
    expect(onChange).toHaveBeenLastCalledWith({ startDate: '2026-06-01', endDate: '2026-06-03' });
  });

  it('pushes end forward when a new start lands after it', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(<ItineraryDateRange startDate={start} endDate={end} editable onChange={onChange} />);
    await user.click(screen.getByRole('button'));
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-06-10' } });
    // end (06-05) is before the new start (06-10), so it is bumped to match.
    expect(onChange).toHaveBeenLastCalledWith({ startDate: '2026-06-10', endDate: '2026-06-10' });
    expect(screen.getByLabelText('End date')).toHaveValue('2026-06-10');
  });
});