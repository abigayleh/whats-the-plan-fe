import { useState } from 'react';
import { CloseIcon, PagesIcon } from '../layout/icons';
import { TASK_ICONS, getTaskIcon } from '../../constants/taskIcons';

// Shows a page's icon (or the default paper icon); clicking it opens the same
// icon set Lists use to pick or clear one. Reuses the ListModal icon-picker markup.
function PageIconPicker({ icon, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const Icon = getTaskIcon(icon)?.Icon;

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
        aria-label="Change page icon"
        disabled={disabled}
      >
        {Icon ? <Icon width={28} height={28} /> : <PagesIcon width={28} height={28} />}
      </button>

      {open && (
        <>
          <button type="button" className="move-menu__backdrop" onClick={() => setOpen(false)} aria-label="Close" />
          <div className="icon-picker page-icon-picker__menu">
            <button
              type="button"
              className={`icon-picker__option${icon === null ? ' icon-picker__option--active' : ''}`}
              onClick={() => pick(null)}
              aria-label="No icon"
              aria-pressed={icon === null}
            >
              <CloseIcon width={14} height={14} />
            </button>
            {TASK_ICONS.map(({ key, label, Icon: OptionIcon }) => (
              <button
                key={key}
                type="button"
                className={`icon-picker__option${icon === key ? ' icon-picker__option--active' : ''}`}
                onClick={() => pick(key)}
                aria-label={label}
                aria-pressed={icon === key}
              >
                <OptionIcon />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default PageIconPicker;
