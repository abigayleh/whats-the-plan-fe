import { NavLink } from 'react-router-dom';
import {
  TravelIcon, CheckIcon, TrashIcon, SkipForwardIcon,
} from '../layout/icons';

function ItineraryRow({
  itinerary, completed, onSetCompleted, onDelete,
}) {
  return (
    <li className="itinerary-list__row">
      <NavLink
        to={`/itinerary/${itinerary.id}`}
        className={({ isActive }) => `itinerary-list__link${isActive ? ' itinerary-list__link--active' : ''}`}
      >
        <span className="itinerary-list__icon"><TravelIcon width={16} height={16} /></span>
        <span className="itinerary-list__title">{itinerary.title}</span>
      </NavLink>
      <div className="itinerary-list__actions">
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

// Flat list of itineraries, split into active trips and a Completed group at the bottom.
function ItineraryList({
  itineraries, loading, onSetCompleted, onDelete,
}) {
  if (loading) return <p className="itinerary-list__empty">Loading…</p>;

  const active = itineraries.filter((it) => !it.completedAt);
  const completed = itineraries.filter((it) => it.completedAt);

  return (
    <div className="itinerary-list">
      <div className="itinerary-list__section">
        <p className="itinerary-list__section-title">Trips</p>
        {active.length === 0 ? (
          <p className="itinerary-list__empty">No trips yet</p>
        ) : (
          <ul className="itinerary-list__items">
            {active.map((it) => (
              <ItineraryRow
                key={it.id}
                itinerary={it}
                completed={false}
                onSetCompleted={onSetCompleted}
                onDelete={onDelete}
              />
            ))}
          </ul>
        )}
      </div>

      {completed.length > 0 && (
        <div className="itinerary-list__section">
          <p className="itinerary-list__section-title">Completed</p>
          <ul className="itinerary-list__items">
            {completed.map((it) => (
              <ItineraryRow
                key={it.id}
                itinerary={it}
                completed
                onSetCompleted={onSetCompleted}
                onDelete={onDelete}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ItineraryList;