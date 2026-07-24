import { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import ItineraryPlan from './ItineraryPlan';
import ItineraryNotes from './ItineraryNotes';
import ItineraryPolls from './ItineraryPolls';
import IconPicker from '../common/IconPicker';
import ItineraryDateRange from './ItineraryDateRange';
import { MapIcon } from '../layout/icons';

const TABS = [
  { key: 'plan', label: 'Plan' },
  { key: 'notes', label: 'Notes' },
  { key: 'polls', label: 'Polls', needsGroup: true },
];

// The itinerary hub: editable title, date range, and the Plan / Notes / Polls tabs.
function ItineraryDetail() {
  const { itineraryId } = useParams();
  const {
    itineraries, currentUser, groups, canManage, updateItinerary,
  } = useOutletContext();
  const itinerary = itineraries.find((it) => it.id === itineraryId);

  const [title, setTitle] = useState(itinerary?.title ?? '');
  const [tab, setTab] = useState('plan');

  // Re-seed the title field when switching between itineraries.
  useEffect(() => { setTitle(itinerary?.title ?? ''); }, [itineraryId, itinerary?.title]);

  if (!itinerary) return <div className="itinerary-detail itinerary-detail--empty">Itinerary not found.</div>;

  const editable = canManage(itinerary);
  const tabs = TABS.filter((t) => !t.needsGroup || itinerary.groupId);
  const group = groups.find((g) => g.id === itinerary.groupId) ?? null;

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
        <div className="itinerary-detail__title-row">
          <IconPicker
            icon={itinerary.icon ?? null}
            onChange={(icon) => updateItinerary(itinerary.id, { icon })}
            disabled={!editable}
            FallbackIcon={MapIcon}
            ariaLabel="Change trip icon"
          />
          <input
            className="itinerary-detail__title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            placeholder="Untitled trip"
            disabled={!editable}
          />
        </div>
        <ItineraryDateRange
          startDate={itinerary.startDate}
          endDate={itinerary.endDate}
          editable={editable}
          onChange={(range) => updateItinerary(itinerary.id, range)}
        />
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
        {tab === 'notes' && <ItineraryNotes itinerary={itinerary} editable={editable} />}
        {tab === 'polls' && group && (
          <ItineraryPolls itinerary={itinerary} group={group} currentUser={currentUser} />
        )}
      </div>
    </div>
  );
}

export default ItineraryDetail;