import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ItineraryRow from './ItineraryRow';

// Wraps ItineraryRow with dnd-kit sortable wiring; the grip handle carries the drag
// listeners, so the row's link and actions stay clickable.
function SortableItineraryRow(props) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: props.itinerary.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <ItineraryRow
      {...props}
      sortable={{
        setNodeRef, style, attributes, listeners, isDragging,
      }}
    />
  );
}

export default SortableItineraryRow;