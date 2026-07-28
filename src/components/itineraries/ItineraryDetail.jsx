import { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import ItineraryPlan from './ItineraryPlan';
import ItineraryNotes from './ItineraryNotes';
import ItineraryPolls from './ItineraryPolls';
import IconPicker from '../common/IconPicker';
import ConfirmModal from '../common/ConfirmModal';
import PillPicker from '../common/PillPicker';
import { scopeOptions } from '../../utils/scope';
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
    itineraries, currentUser, groups, personalSpace, canManage, updateItinerary,
  } = useOutletContext();
  const itinerary = itineraries.find((it) => it.id === itineraryId);

  const [title, setTitle] = useState(itinerary?.title ?? '');
  const [tab, setTab] = useState('plan');
  const [pendingMove, setPendingMove] = useState(null);

  // Re-seed the title field when switching between itineraries.
  useEffect(() => { setTitle(itinerary?.title ?? ''); }, [itineraryId, itinerary?.title]);

  if (!itinerary) return <div className="itinerary-detail itinerary-detail--empty">Itinerary not found.</div>;

  const editable = canManage(itinerary);
  const tabs = TABS.filter((t) => !t.needsGroup || itinerary.groupId);
  const group = groups.find((g) => g.id === itinerary.groupId) ?? null;
  // Polls vanish when a trip leaves its group, so fall back rather than show an empty pane.
  const activeTab = tabs.some((t) => t.key === tab) ? tab : 'plan';

  function commitTitle() {
    const next = title.trim();
    if (!next || next === itinerary.title) {
      setTitle(itinerary.title);
      return;
    }
    updateItinerary(itinerary.id, { title: next });
  }

  // Widening scope (personal → group) costs nobody access; leaving a group does, so confirm it.
  function requestScope(nextGroupId) {
    if (nextGroupId === itinerary.groupId) return;
    if (!itinerary.groupId) updateItinerary(itinerary.id, { groupId: nextGroupId });
    else setPendingMove({ groupId: nextGroupId });
  }

  function moveMessage() {
    const target = groups.find((g) => g.id === pendingMove.groupId);
    const destination = target ? target.name : 'your personal space';
    return `Move "${itinerary.title}" from ${group.name} to ${destination}? `
      + `${group.name} members will lose access to the trip and its polls.`;
  }

  async function confirmMove() {
    await updateItinerary(itinerary.id, { groupId: pendingMove.groupId });
    setPendingMove(null);
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
          itinerary={itinerary}
          editable={editable}
          onChange={(schedule) => updateItinerary(itinerary.id, schedule)}
        />
        <div className="itinerary-detail__scope">
          <span className="itinerary-detail__scope-label">Shared with</span>
          <PillPicker
            options={scopeOptions(personalSpace, groups)}
            value={itinerary.groupId}
            onChange={requestScope}
            disabled={!editable}
            ariaLabel="Shared with"
          />
        </div>
      </header>

      <nav className="itinerary-detail__tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`itinerary-detail__tab${activeTab === t.key ? ' itinerary-detail__tab--active' : ''}`}
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

      {pendingMove && (
        <ConfirmModal
          title="Move itinerary"
          message={moveMessage()}
          confirmLabel="Move"
          danger={false}
          onConfirm={confirmMove}
          onCancel={() => setPendingMove(null)}
        />
      )}
    </div>
  );
}

export default ItineraryDetail;
