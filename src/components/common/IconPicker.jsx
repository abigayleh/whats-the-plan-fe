import { useState } from 'react';
import { CloseIcon } from '../layout/icons';
import { TASK_ICONS, EMOJI_OPTIONS, getTaskIcon } from '../../constants/taskIcons';
import EntityIcon from './EntityIcon';
import { firstEmoji } from '../../utils/emoji';

// Shows an entity's icon (or a fallback); clicking it opens the shared icon set — the same one
// Lists and Pages use — plus an emoji row, to pick or clear one.
function IconPicker({
  icon, onChange, disabled, FallbackIcon, ariaLabel = 'Change icon',
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  // Anything set that isn't a known icon key is an emoji.
  const customEmoji = icon && !getTaskIcon(icon) ? icon : null;

  function pick(key) {
    onChange(key);
    setTyped('');
    setOpen(false);
  }

  function submitTyped(e) {
    e.preventDefault();
    const emoji = firstEmoji(typed);
    if (emoji) pick(emoji);
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

            <p className="icon-picker__heading">Emoji</p>
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`icon-picker__option${icon === emoji ? ' icon-picker__option--active' : ''}`}
                onClick={() => pick(emoji)}
                aria-label={emoji}
                aria-pressed={icon === emoji}
              >
                <span className="entity-emoji">{emoji}</span>
              </button>
            ))}

            <form className="icon-picker__custom" onSubmit={submitTyped}>
              <input
                type="text"
                className="icon-picker__input"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={customEmoji ? `Current ${customEmoji} — type another` : 'Or type any emoji…'}
                aria-label="Use a custom emoji"
              />
              <button type="submit" className="icon-picker__use" disabled={!firstEmoji(typed)}>Use</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export default IconPicker;