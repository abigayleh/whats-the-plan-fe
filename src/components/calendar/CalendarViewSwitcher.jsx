const VIEWS = [
  { key: 'month', label: 'Month' },
  { key: 'week', label: 'Week' },
  { key: 'day', label: 'Day' },
];

function CalendarViewSwitcher({ view, onChange }) {
  return (
    <div className="view-switcher">
      {VIEWS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          className={`view-switcher__option${view === key ? ' view-switcher__option--active' : ''}`}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default CalendarViewSwitcher;
