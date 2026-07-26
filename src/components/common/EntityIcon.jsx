import { getTaskIcon } from '../../constants/taskIcons';

// An entity's icon: one of the shared icon set, a literal emoji, or the caller's fallback.
// Emoji live in the same `icon` field as icon keys — anything that isn't a known key is one,
// so no migration and no second column. `size` is optional; omit it to size from CSS.
function EntityIcon({
  icon, size, className, fallback = null,
}) {
  const Icon = getTaskIcon(icon)?.Icon;
  if (Icon) {
    return size ? <Icon width={size} height={size} className={className} /> : <Icon className={className} />;
  }
  if (icon) {
    return (
      <span
        className={`entity-emoji${className ? ` ${className}` : ''}`}
        style={size ? { fontSize: `${size}px` } : undefined}
        role="img"
        aria-label="icon"
      >
        {icon}
      </span>
    );
  }
  return fallback;
}

export default EntityIcon;