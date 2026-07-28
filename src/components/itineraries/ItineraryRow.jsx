import { NavLink } from 'react-router-dom';
import {
  MapIcon, CheckIcon, TrashIcon, SkipForwardIcon, GripIcon,
} from '../layout/icons';
import EntityIcon from '../common/EntityIcon';
import { itineraryMeta } from '../../utils/itineraries';

function ItineraryRow({
  itinerary, completed, onSetCompleted, onDelete, sortable,
}) {
  const meta = itineraryMeta(itinerary);

  return (
    <li
      ref={sortable?.setNodeRef}
      style={sortable?.style}
      className={`itinerary-list__row${sortable?.isDragging ? ' itinerary-list__row--dragging' : ''}`}
    >
      <NavLink
        to={`/itinerary/${itinerary.id}`}
        className={({ isActive }) => `itinerary-list__link${isActive ? ' itinerary-list__link--active' : ''}`}
      >
        <span className="itinerary-list__icon">
          <EntityIcon icon={itinerary.icon} size={16} fallback={<MapIcon width={16} height={16} />} />
        </span>
        <span className="itinerary-list__title">{itinerary.title}</span>
        {meta && <span className="itinerary-list__row-meta">{meta}</span>}
      </NavLink>
      <div className="itinerary-list__actions">
        {sortable && (
          <button
            type="button"
            className="task-actions__button itinerary-list__action itinerary-list__drag-handle"
            aria-label={`Reorder ${itinerary.title}`}
            data-tooltip="Drag to reorder"
            {...sortable.attributes}
            {...sortable.listeners}
          >
            <GripIcon width={15} height={15} />
          </button>
        )}
        <button
          type="button"
          className="task-actions__button itinerary-list__action"
          onClick={() => onSetCompleted(itinerary.id, !completed)}
          aria-label={completed ? 'Restore itinerary' : 'Mark itinerary completed'}
          data-tooltip={completed ? 'Restore' : 'Complete'}
        >
          {completed ? <SkipForwardIcon width={15} height={15} /> : <CheckIcon width={15} height={15} />}
        </button>
        <button
          type="button"
          className="task-actions__button itinerary-list__action"
          onClick={() => onDelete(itinerary)}
          aria-label="Delete itinerary"
          data-tooltip="Delete"
        >
          <TrashIcon width={15} height={15} />
        </button>
      </div>
    </li>
  );
}

export default ItineraryRow;