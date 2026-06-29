/* Shared form controls: real-button segmented control + numeric stepper. */

export function ButtonGroup({ legend, value, options, onChange }) {
  return (
    <fieldset className="field field--choice">
      <legend>{legend}</legend>
      <div className="btngroup" role="group" aria-label={legend}>
        {options.map((opt) => (
          <button
            type="button"
            key={opt.value}
            className={"btn-toggle" + (value === opt.value ? " is-active" : "")}
            aria-pressed={value === opt.value}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function Stepper({ id, label, value, min, max, onChange }) {
  const n = parseInt(value || `${min}`, 10) || min;
  const set = (v) => onChange(String(Math.min(max, Math.max(min, v))));
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="stepper">
        <button
          type="button"
          className="stepper__btn"
          aria-label="Diminuer"
          onClick={() => set(n - 1)}
        >
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="stepper__btn"
          aria-label="Augmenter"
          onClick={() => set(n + 1)}
        >
          +
        </button>
      </div>
    </div>
  );
}
