import { useState } from 'react';
import EntityIcon from './EntityIcon';
import IconOptions from './IconOptions';

// Shows an entity's icon (or a fallback); clicking it opens the shared icon choices in a
// pop-up menu. The choices themselves live in IconOptions, shared with the create modals.
function IconPicker({
  icon, onChange, disabled, FallbackIcon, ariaLabel = 'Change icon',
}) {
  const [open, setOpen] = useState(false);

  function pick(key) {
    onChange(key);
    setOpen(false);
  }

  return (
    <div className="page-icon-picker">
      <button
        type="button"
        className="page-icon-picker__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label={ariaLabel}
        disabled={disabled}
      >
        <EntityIcon icon={icon} size={28} fallback={<FallbackIcon width={28} height={28} />} />
      </button>

      {open && (
        <>
          <button type="button" className="move-menu__backdrop" onClick={() => setOpen(false)} aria-label="Close" />
          <IconOptions icon={icon} onSelect={pick} className="page-icon-picker__menu" />
        </>
      )}
    </div>
  );
}

export default IconPicker;
