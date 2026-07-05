import { getTaskIcon } from '../../constants/taskIcons';

function ToggleChips({ items, activeIds, onToggle }) {
  return (
    <div className="filter-chips">
      {items.map((item) => {
        const active = activeIds.has(item.id);
        const ItemIcon = getTaskIcon(item.icon)?.Icon;
        return (
          <button
            key={item.id ?? 'none'}
            type="button"
            className={`filter-chips__chip filter-chips__chip--${item.colorKey}${active ? ' filter-chips__chip--active' : ''}`}
            onClick={() => onToggle(item.id)}
            aria-pressed={active}
          >
            {ItemIcon ? <ItemIcon className="filter-chips__icon" /> : <span className="filter-chips__dot" />}
            {item.name}
          </button>
        );
      })}
    </div>
  );
}

export default ToggleChips;
