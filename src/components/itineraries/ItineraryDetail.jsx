import { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import ItineraryPlan from './ItineraryPlan';

const TABS = [
  { key: 'plan', label: 'Plan' },
  { key: 'notes', label: 'Notes' },
  { key: 'polls', label: 'Polls', needsGroup: true },
];

const fmt = (d) => (d ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '');

// The itinerary hub: editable title, date range, and the Plan / Notes / Polls tabs.
// Plan is filled in Phase 2; Notes and Polls in Phase 6.
function ItineraryDetail() {
  const { itineraryId } = useParams();
  const { itineraries, canManage, updateItinerary } = useOutletContext();
  const itinerary = itineraries.find((it) => it.id === itineraryId);

  const [title, setTitle] = useState(itinerary?.title ?? '');
  const [tab, setTab] = useState('plan');

  // Re-seed the title field when switching between itineraries.
  useEffect(() => { setTitle(itinerary?.title ?? ''); }, [itineraryId, itinerary?.title]);

  if (!itinerary) return <div className="itinerary-detail itinerary-detail--empty">Itinerary not found.</div>;

  const editable = canManage(itinerary);
  const tabs = TABS.filter((t) => !t.needsGroup || itinerary.groupId);

  function commitTitle() {
    const next = title.trim();
    if (!next || next === itinerary.title) {
      setTitle(itinerary.title);
      return;
    }
    updateItinerary(itinerary.id, { title: next });
  }

  return (
    <div className="itinerary-detail">
      <header className="itinerary-detail__header">
        <input
          className="itinerary-detail__title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          placeholder="Untitled trip"
          disabled={!editable}
        />
        <p className="itinerary-detail__dates">
          {fmt(itinerary.startDate)}
          {' – '}
          {fmt(itinerary.endDate)}
        </p>
      </header>

      <nav className="itinerary-detail__tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`itinerary-detail__tab${tab === t.key ? ' itinerary-detail__tab--active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="itinerary-detail__tab-content">
        {tab === 'plan' && <ItineraryPlan itinerary={itinerary} />}
        {tab === 'notes' && <p className="itinerary-detail__placeholder">Shared notes are coming soon.</p>}
        {tab === 'polls' && <p className="itinerary-detail__placeholder">Group polls are coming soon.</p>}
      </div>
    </div>
  );
}

export default ItineraryDetail;