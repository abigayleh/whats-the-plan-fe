import {
  forwardRef, useEffect, useImperativeHandle, useState,
} from 'react';

// Shared popup for the slash (/) and mention (@) menus. Arrow keys move, Enter/Tab select.
// Exposes onKeyDown via ref so the TipTap suggestion plugin can forward key events.
const SuggestionList = forwardRef(({ items, command, emptyLabel }, ref) => {
  const [index, setIndex] = useState(0);

  useEffect(() => setIndex(0), [items]);

  const select = (i) => {
    const item = items[i];
    if (item) command(item);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setIndex((i) => (i + items.length - 1) % items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setIndex((i) => (i + 1) % items.length);
        return true;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        select(index);
        return true;
      }
      return false;
    },
  }));

  if (!items.length) {
    return <div className="suggestion-menu"><div className="suggestion-menu__empty">{emptyLabel}</div></div>;
  }

  return (
    <div className="suggestion-menu">
      {items.map((item, i) => (
        <button
          type="button"
          key={item.key ?? item.title}
          className={`suggestion-menu__item${i === index ? ' suggestion-menu__item--active' : ''}`}
          onMouseEnter={() => setIndex(i)}
          onMouseDown={(e) => { e.preventDefault(); select(i); }}
        >
          {item.Icon && <span className="suggestion-menu__icon"><item.Icon width={16} height={16} /></span>}
          <span className="suggestion-menu__label">
            {item.title}
            {item.subtitle && <span className="suggestion-menu__subtitle">{item.subtitle}</span>}
          </span>
        </button>
      ))}
    </div>
  );
});

export default SuggestionList;
