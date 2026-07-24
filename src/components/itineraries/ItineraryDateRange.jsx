import { useState } from 'react';

const fmt = (d) => (d ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '');
const toInput = (d) => (d
  ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  : '');

// The trip's date range under the title. Read-only text unless editable, in which case
// clicking reveals two date pickers that commit on change (end is kept on/after start).
function ItineraryDateRange({
  startDate, endDate, editable, onChange,
}) {
  const [editing, setEditing] = useState(false);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  function begin() {
    if (!editable) return;
    setStart(toInput(startDate));
    setEnd(toInput(endDate));
    setEditing(true);
  }
  const commit = (s, e) => { if (s && e) onChange({ startDate: s, endDate: e }); };
  function handleStart(v) {
    const e = end && end < v ? v : end; // yyyy-mm-dd compares lexically
    setStart(v); setEnd(e);
    commit(v, e);
  }
  function handleEnd(v) { setEnd(v); commit(start, v); }
  function handleBlur(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) setEditing(false);
  }

  if (!editing) {
    const text = `${fmt(startDate)} – ${fmt(endDate)}`;
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
      onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') setEditing(false); }}
    >
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
    </div>
  );
}

export default ItineraryDateRange;
