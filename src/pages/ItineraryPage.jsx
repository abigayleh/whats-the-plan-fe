import { useState } from 'react';
import {
  Outlet, useLocation, useNavigate, useParams,
} from 'react-router-dom';
import {
  TravelIcon, PlusIcon, ChevronIcon, MenuIcon,
} from '../components/layout/icons';
import ItineraryList from '../components/itineraries/ItineraryList';
import NewItineraryModal from '../components/itineraries/NewItineraryModal';
import ConfirmModal from '../components/common/ConfirmModal';
import useAppData from '../hooks/useAppData';
import useItineraries from '../hooks/useItineraries';
import useLocalStorageState from '../hooks/useLocalStorageState';
import useRememberedItem from '../hooks/useRememberedItem';

// Two-pane layout mirroring Pages: the itinerary list on the left, the selected
// itinerary's hub on the right (rendered through the nested :itineraryId route).
function ItineraryPage() {
  const { currentUser, personalSpace, groups } = useAppData();
  const {
    itineraries, loading, addItinerary, updateItinerary, setCompleted,
    reorderItineraries, deleteItinerary,
  } = useItineraries();
  const [showNew, setShowNew] = useState(false);
  const [confirmingItinerary, setConfirmingItinerary] = useState(null);
  const [collapsed, setCollapsed] = useLocalStorageState('itinerary-sidebar-collapsed', false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { itineraryId } = useParams();
  const atRoot = pathname === '/itinerary' || pathname === '/itinerary/';

  // Reopen the last itinerary viewed when landing on /itinerary, instead of the empty state.
  useRememberedItem({
    storageKey: 'itinerary-last-id', currentId: itineraryId, atRoot, loading, items: itineraries, pathPrefix: '/itinerary',
  });

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
      {collapsed ? (
        <button
          type="button"
          className="task-actions__button pages__expand"
          onClick={() => setCollapsed(false)}
          aria-label="Show itineraries"
          data-tooltip="Show itineraries"
        >
          <MenuIcon width={18} height={18} />
        </button>
      ) : (
        <aside className="pages__sidebar">
          <div className="pages__sidebar-header">
            <div className="pages__sidebar-heading">
              <button
                type="button"
                className="task-actions__button"
                onClick={() => setCollapsed(true)}
                aria-label="Hide itineraries"
                data-tooltip="Hide itineraries"
              >
                <ChevronIcon width={16} height={16} className="pages__collapse-icon" />
              </button>
              <h2 className="pages__sidebar-title">Itineraries</h2>
            </div>
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
            onReorder={reorderItineraries}
          />
        </aside>
      )}

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
