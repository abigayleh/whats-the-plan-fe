const PROFILES = [{ key: 'foot', label: 'Walk' }, { key: 'driving', label: 'Drive' }];

// Switches the routing profile for the day's route line (walking vs driving).
function RouteProfileToggle({ profile, onChange }) {
  return (
    <div className="route-toggle">
      {PROFILES.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          className={`route-toggle__option${profile === key ? ' route-toggle__option--active' : ''}`}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default RouteProfileToggle;