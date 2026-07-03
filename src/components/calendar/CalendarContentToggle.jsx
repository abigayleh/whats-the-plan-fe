const OPTIONS = [
  { key: 'all', label: 'Both' },
  { key: 'events', label: 'Events' },
  { key: 'tasks', label: 'To-Dos' },
];

function CalendarContentToggle({ value, onChange }) {
  return (
    <div className="view-switcher view-switcher--secondary">
      {OPTIONS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          className={`view-switcher__option${value === key ? ' view-switcher__option--active' : ''}`}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default CalendarContentToggle;
