import EntityIcon from '../common/EntityIcon';

function ToggleChips({ items, activeIds, onToggle }) {
  return (
    <div className="filter-chips">
      {items.map((item) => {
        const active = activeIds.has(item.id);
        return (
          <button
            key={item.id ?? 'none'}
            type="button"
            className={`filter-chips__chip filter-chips__chip--${item.colorKey}${active ? ' filter-chips__chip--active' : ''}`}
            onClick={() => onToggle(item.id)}
            aria-pressed={active}
          >
            <EntityIcon
              icon={item.icon}
              className="filter-chips__icon"
              fallback={<span className="filter-chips__dot" />}
            />
            {item.name}
          </button>
        );
      })}
    </div>
  );
}

export default ToggleChips;
