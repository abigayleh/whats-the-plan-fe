import ItinerarySection from './ItinerarySection';
import useLocalStorageSet from '../../hooks/useLocalStorageSet';
import { groupItineraries, reorderWithinSection } from '../../utils/itineraries';

const SECTIONS = [
  { key: 'unplanned', title: 'To be planned' },
  { key: 'planned', title: 'Planned', emptyText: 'No trips yet' },
  { key: 'completed', title: 'Completed' },
];

// The itinerary sidebar: trips split into To be planned / Planned / Completed, each
// section collapsible (remembered across reloads) and sortable within itself.
function ItineraryList({
  itineraries, loading, onSetCompleted, onDelete, onReorder,
}) {
  const [collapsedSections, setCollapsedSections] = useLocalStorageSet('itinerary-sections-collapsed');

  function toggleSection(key) {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }

  function handleReorder(sectionIds, activeId, overId) {
    const ids = reorderWithinSection(itineraries, sectionIds, activeId, overId);
    if (ids) onReorder(ids);
  }

  if (loading) return <p className="itinerary-list__empty">Loading…</p>;

  const grouped = groupItineraries(itineraries);

  return (
    <div className="itinerary-list">
      {SECTIONS.map(({ key, title, emptyText }) => {
        // Only Planned holds the sidebar's empty state; the other two just drop out.
        if (grouped[key].length === 0 && !emptyText) return null;
        return (
          <ItinerarySection
            key={key}
            title={title}
            itineraries={grouped[key]}
            completed={key === 'completed'}
            collapsed={collapsedSections.has(key)}
            emptyText={emptyText}
            onToggle={() => toggleSection(key)}
            onSetCompleted={onSetCompleted}
            onDelete={onDelete}
            onReorder={handleReorder}
          />
        );
      })}
    </div>
  );
}

export default ItineraryList;