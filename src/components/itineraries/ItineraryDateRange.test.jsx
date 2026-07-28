import {
  describe, it, expect, vi,
} from 'vitest';
import {
  renderWithRouter, screen, fireEvent, userEvent,
} from '../../test/utils';
import ItineraryDateRange from './ItineraryDateRange';

// Local-constructed dates stay date-only (no timezone shift) so the input values are deterministic.
const dated = { startDate: new Date(2026, 5, 1), endDate: new Date(2026, 5, 5), dayCount: null };
const unplanned = { startDate: null, endDate: null, dayCount: 3 };

const render = (itinerary, props = {}) => renderWithRouter(
  <ItineraryDateRange itinerary={itinerary} editable onChange={vi.fn()} {...props} />,
);

describe('ItineraryDateRange', () => {
  it('renders read-only text (no button) when not editable', () => {
    render(dated, { editable: false });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    // Both formatted dates appear in the range text.
    expect(screen.getByText(/Jun 1, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Jun 5, 2026/)).toBeInTheDocument();
  });

  it('reveals date pickers when the editable range is clicked', async () => {
    const user = userEvent.setup();
    render(dated);
    await user.click(screen.getByRole('button'));
    expect(screen.getByLabelText('Start date')).toHaveValue('2026-06-01');
    expect(screen.getByLabelText('End date')).toHaveValue('2026-06-05');
  });

  it('commits the edited range as yyyy-mm-dd via onChange', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(dated, { onChange });
    await user.click(screen.getByRole('button'));
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2026-06-03' } });
    expect(onChange).toHaveBeenLastCalledWith({ startDate: '2026-06-01', endDate: '2026-06-03' });
  });

  it('pushes end forward when a new start lands after it', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(dated, { onChange });
    await user.click(screen.getByRole('button'));
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-06-10' } });
    // end (06-05) is before the new start (06-10), so it is bumped to match.
    expect(onChange).toHaveBeenLastCalledWith({ startDate: '2026-06-10', endDate: '2026-06-10' });
    expect(screen.getByLabelText('End date')).toHaveValue('2026-06-10');
  });

  it('summarises an unplanned trip by its day count', () => {
    render({ ...unplanned, dayCount: 5 }, { editable: false });
    expect(screen.getByText('Not scheduled · 5 days')).toBeInTheDocument();
  });

  it('singularises a one-day trip', () => {
    render({ ...unplanned, dayCount: 1 }, { editable: false });
    expect(screen.getByText('Not scheduled · 1 day')).toBeInTheDocument();
  });

  it('says only "Not scheduled" when there is no day count either', () => {
    render({ ...unplanned, dayCount: null }, { editable: false });
    expect(screen.getByText('Not scheduled')).toBeInTheDocument();
  });

  it('opens straight into the day-count field for an unplanned trip', async () => {
    const user = userEvent.setup();
    render(unplanned);
    await user.click(screen.getByRole('button', { name: /Not scheduled/ }));
    expect(screen.getByLabelText('Number of days')).toHaveValue(3);
    expect(screen.queryByLabelText('Start date')).not.toBeInTheDocument();
  });

  it('commits a day count when a dated trip switches to unplanned', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(dated, { onChange });
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByRole('button', { name: 'Not scheduled yet' }));
    expect(onChange).toHaveBeenLastCalledWith({ dayCount: 1 });
  });

  it('writes the day count once, when the field is left — not per keystroke', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(unplanned, { onChange });
    await user.click(screen.getByRole('button', { name: /Not scheduled/ }));
    const days = screen.getByLabelText('Number of days');
    fireEvent.change(days, { target: { value: '1' } });
    fireEvent.change(days, { target: { value: '12' } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.blur(days);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ dayCount: 12 });
  });

  it('does not rewrite an unchanged day count', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(unplanned, { onChange });
    await user.click(screen.getByRole('button', { name: /Not scheduled/ }));
    fireEvent.blur(screen.getByLabelText('Number of days'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('commits dates when an unplanned trip switches back to dated', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(unplanned, { onChange });
    await user.click(screen.getByRole('button', { name: /Not scheduled/ }));
    await user.click(screen.getByRole('button', { name: 'Dates' }));
    // Both fields seed to today, so the commit is a real one-day range.
    const [payload] = onChange.mock.calls.at(-1);
    expect(payload.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(payload.endDate).toBe(payload.startDate);
  });
});