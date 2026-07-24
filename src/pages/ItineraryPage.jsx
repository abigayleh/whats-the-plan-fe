import { useState } from 'react';
import {
  Outlet, useLocation, useNavigate, useParams,
} from 'react-router-dom';
import { TravelIcon, PlusIcon } from '../components/layout/icons';
import ItineraryList from '../components/itineraries/ItineraryList';
import NewItineraryModal from '../components/itineraries/NewItineraryModal';
import ConfirmModal from '../components/common/ConfirmModal';
import useAppData from '../hooks/useAppData';
import useItineraries from '../hooks/useItineraries';

// Two-pane layout mirroring Pages: the itinerary list on the left, the selected
// itinerary's hub on the right (rendered through the nested :itineraryId route).
function ItineraryPage() {
  const { currentUser, personalSpace, groups } = useAppData();
  const {
    itineraries, loading, addItinerary, updateItinerary, setCompleted, deleteItinerary,
  } = useItineraries();
  const [showNew, setShowNew] = useState(false);
  const [confirmingItinerary, setConfirmingItinerary] = useState(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { itineraryId } = useParams();
  const atRoot = pathname === '/itinerary' || pathname === '/itinerary/';

  // Mirrors the API: only the owner or a group admin may edit/delete an itinerary.
  function canManage(itinerary) {
    if (!itinerary.groupId) return itinerary.createdById === currentUser.id;
    return itinerary.createdById === currentUser.id
      || groups.find((g) => g.id === itinerary.groupId)?.role === 'ADMIN';
  }

  async function handleNew(payload) {
    const itinerary = await addItinerary(payload);
    setShowNew(false);
    navigate(`/itinerary/${itinerary.id}`);
  }

  async function confirmDelete() {
    const itinerary = confirmingItinerary;
    await deleteItinerary(itinerary.id);
    setConfirmingItinerary(null);
    if (itinerary.id === itineraryId) navigate('/itinerary');
  }

  const context = {
    itineraries, currentUser, groups, canManage, updateItinerary, setCompleted, deleteItinerary,
  };

  return (
    <div className="pages">
      <aside className="pages__sidebar">
        <div className="pages__sidebar-header">
          <h2 className="pages__sidebar-title">Itineraries</h2>
          <button
            type="button"
            className="task-actions__button"
            onClick={() => setShowNew(true)}
            aria-label="New itinerary"
            data-tooltip="New itinerary"
          >
            <PlusIcon width={16} height={16} />
          </button>
        </div>
        <ItineraryList
          itineraries={itineraries}
          loading={loading}
          onSetCompleted={setCompleted}
          onDelete={setConfirmingItinerary}
        />
      </aside>

      <section className="pages__content">
        {atRoot ? (
          <div className="pages__empty">
            <TravelIcon width={40} height={40} />
            <p>Select an itinerary, or plan a new one.</p>
          </div>
        ) : (
          <Outlet context={context} />
        )}
      </section>

      {showNew && (
        <NewItineraryModal
          groups={groups}
          personalSpace={personalSpace}
          onClose={() => setShowNew(false)}
          onCreate={handleNew}
        />
      )}

      {confirmingItinerary && (
        <ConfirmModal
          title="Delete itinerary"
          message={`Delete "${confirmingItinerary.title}"? Its to-dos, notes, and polls are removed too.`}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmingItinerary(null)}
        />
      )}
    </div>
  );
}

export default ItineraryPage;
