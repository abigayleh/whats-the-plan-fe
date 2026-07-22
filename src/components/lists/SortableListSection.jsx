import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ListSection from './ListSection';

// Wraps ListSection with dnd-kit sortable wiring; the grip handle inside the header
// carries the drag listeners, so the rest of the card stays interactive.
function SortableListSection(props) {
  // `list:`-prefixed so drag ids never collide with folder ids across containers.
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: `list:${props.list.id}` });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <ListSection
      {...props}
      sortable={{
        setNodeRef, style, attributes, listeners, isDragging,
      }}
    />
  );
}

export default SortableListSection;
