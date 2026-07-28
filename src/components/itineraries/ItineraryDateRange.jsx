import { useState } from 'react';
import PillPicker from '../common/PillPicker';
import { SCHEDULE_OPTIONS, clampDayCount, isScheduled } from '../../constants/itinerary';
import { toDateInputValue } from '../../utils/tasks';

const fmt = (d) => (d ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '');

const summarise = (trip) => {
  if (isScheduled(trip)) return `${fmt(trip.startDate)} – ${fmt(trip.endDate)}`;
  if (!trip.dayCount) return 'Not scheduled';
  return `Not scheduled · ${trip.dayCount} ${trip.dayCount === 1 ? 'day' : 'days'}`;
};

// The trip's schedule under the title. Read-only text unless editable, in which case clicking
// reveals a dated/unplanned switch plus the matching fields. Dates commit as they are picked;
// the day count commits when the field is left, so typing it is one write, not one per digit.
function ItineraryDateRange({ itinerary, editable, onChange }) {
  const [editing, setEditing] = useState(false);
  const [schedule, setSchedule] = useState('dates');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [days, setDays] = useState('1');

  function begin() {
    if (!editable) return;
    const today = toDateInputValue(new Date());
    setStart(toDateInputValue(itinerary.startDate) || today);
    setEnd(toDateInputValue(itinerary.endDate) || today);
    setDays(String(itinerary.dayCount ?? 1));
    setSchedule(isScheduled(itinerary) ? 'dates' : 'unplanned');
    setEditing(true);
  }

  const commitDates = (s, e) => { if (s && e) onChange({ startDate: s, endDate: e }); };
  // Skipped when unchanged, so leaving the field and pressing Enter can't write twice.
  function commitDays() {
    const next = clampDayCount(days);
    if (next !== itinerary.dayCount) onChange({ dayCount: next });
  }

  function handleStart(v) {
    const e = end && end < v ? v : end; // yyyy-mm-dd compares lexically
    setStart(v); setEnd(e);
    commitDates(v, e);
  }
  function handleEnd(v) { setEnd(v); commitDates(start, v); }
  // Switching mode writes straight away, so the trip never sits with both kinds of schedule.
  function handleSchedule(next) {
    setSchedule(next);
    if (next === 'dates') commitDates(start, end);
    else commitDays();
  }
  function handleBlur(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) setEditing(false);
  }
  function handleKeyDown(e) {
    if (e.key !== 'Escape' && e.key !== 'Enter') return;
    if (e.key === 'Enter' && schedule === 'unplanned') commitDays();
    setEditing(false);
  }

  if (!editing) {
    const text = summarise(itinerary);
    if (!editable) return <p className="itinerary-detail__dates">{text}</p>;
    return (
      <button type="button" className="itinerary-detail__dates itinerary-detail__dates--edit" onClick={begin}>
        {text}
      </button>
    );
  }

  return (
    <div
      className="itinerary-dates-edit"
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <PillPicker options={SCHEDULE_OPTIONS} value={schedule} onChange={handleSchedule} ariaLabel="Schedule" />
      {schedule === 'dates' ? (
        <>
          <input
            type="date"
            className="modal__input"
            value={start}
            onChange={(e) => handleStart(e.target.value)}
            aria-label="Start date"
          />
          <span className="itinerary-dates-edit__sep">–</span>
          <input
            type="date"
            className="modal__input"
            value={end}
            min={start}
            onChange={(e) => handleEnd(e.target.value)}
            aria-label="End date"
          />
        </>
      ) : (
        <>
          <input
            type="number"
            className="modal__input"
            min="1"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            onBlur={commitDays}
            aria-label="Number of days"
          />
          <span className="itinerary-dates-edit__sep">days</span>
        </>
      )}
    </div>
  );
}

export default ItineraryDateRange;
