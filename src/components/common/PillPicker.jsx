// A row of mutually-exclusive pill options — used for scope (personal / group) and for
// any other small either-or choice in a form.
function PillPicker({
  options, value, onChange, disabled = false, ariaLabel,
}) {
  return (
    <div className="pill-picker" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          className={`pill-picker__option${option.value === value ? ' pill-picker__option--active' : ''}`}
          onClick={() => onChange(option.value)}
          disabled={disabled}
          aria-pressed={option.value === value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default PillPicker;
