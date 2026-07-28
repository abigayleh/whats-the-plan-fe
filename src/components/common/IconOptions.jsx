import { useState } from 'react';
import { CloseIcon } from '../layout/icons';
import { TASK_ICONS, EMOJI_OPTIONS, getTaskIcon } from '../../constants/taskIcons';
import { firstEmoji } from '../../utils/emoji';

// The icon choices themselves: the shared icon set, an emoji row, and a free-text emoji
// field. Rendered inline as a modal field, or inside IconPicker's pop-up menu.
function IconOptions({ icon, onSelect, className = '' }) {
  const [typed, setTyped] = useState('');
  // Anything set that isn't a known icon key is an emoji.
  const customEmoji = icon && !getTaskIcon(icon) ? icon : null;

  function pick(key) {
    setTyped('');
    onSelect(key);
  }
  function applyTyped() {
    const emoji = firstEmoji(typed);
    if (emoji) pick(emoji);
  }

  return (
    <div className={`icon-picker${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        className={`icon-picker__option${icon === null ? ' icon-picker__option--active' : ''}`}
        onClick={() => pick(null)}
        aria-label="No icon"
        aria-pressed={icon === null}
      >
        <CloseIcon width={14} height={14} />
      </button>
      {TASK_ICONS.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          className={`icon-picker__option${icon === key ? ' icon-picker__option--active' : ''}`}
          onClick={() => pick(key)}
          aria-label={label}
          aria-pressed={icon === key}
        >
          <Icon />
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

      {/* Not a <form>: this also renders inside modal forms, and forms cannot nest. */}
      <div className="icon-picker__custom">
        <input
          type="text"
          className="icon-picker__input"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyTyped(); } }}
          placeholder={customEmoji ? `Current ${customEmoji} — type another` : 'Or type any emoji…'}
          aria-label="Use a custom emoji"
        />
        <button type="button" className="icon-picker__use" onClick={applyTyped} disabled={!firstEmoji(typed)}>
          Use
        </button>
      </div>
    </div>
  );
}

export default IconOptions;
