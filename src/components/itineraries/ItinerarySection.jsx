import {
  DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { ChevronIcon } from '../layout/icons';
import SortableItineraryRow from './SortableItineraryRow';
import { POINTER_ACTIVATION, TOUCH_ACTIVATION } from '../../constants/dragSensors';

// One collapsible sidebar section. Each section owns its DndContext, so a drag can never
// leave it — which would silently change an itinerary's planned/completed state.
function ItinerarySection({
  title, itineraries, completed, collapsed, emptyText,
  onToggle, onSetCompleted, onDelete, onReorder,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: POINTER_ACTIVATION }),
    useSensor(TouchSensor, { activationConstraint: TOUCH_ACTIVATION }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = itineraries.map((it) => it.id);

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    onReorder(ids, active.id, over.id);
  }

  return (
    <div className="itinerary-list__section">
      <button
        type="button"
        className="itinerary-list__section-toggle"
        onClick={onToggle}
        aria-expanded={!collapsed}
      >
        <ChevronIcon
          width={14}
          height={14}
          className={`itinerary-list__section-chevron${collapsed ? ' itinerary-list__section-chevron--collapsed' : ''}`}
        />
        <span className="itinerary-list__section-title">{title}</span>
      </button>

      {!collapsed && (itineraries.length === 0 ? (
        <p className="itinerary-list__empty">{emptyText}</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ul className="itinerary-list__items">
              {itineraries.map((it) => (
                <SortableItineraryRow
                  key={it.id}
                  itinerary={it}
                  completed={completed}
                  onSetCompleted={onSetCompleted}
                  onDelete={onDelete}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ))}
    </div>
  );
}

export default ItinerarySection;