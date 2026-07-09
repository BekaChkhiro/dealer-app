import './VinInput.css';

/**
 * VinInput — a text input for VIN codes that shows the last 6 characters in red
 * while typing. The real <input> text is transparent; a synced overlay renders
 * the colored characters underneath the caret.
 */
function VinInput({ value = '', onChange, maxLength = 17, className = '', ...rest }) {
  const vin = String(value || '');
  const normalPart = vin.length <= 6 ? '' : vin.slice(0, -6);
  const highlightPart = vin.length <= 6 ? vin : vin.slice(-6);

  return (
    <div className="vin-input-wrap">
      <input
        {...rest}
        type="text"
        className={`form-control vin-input-field ${className}`}
        value={vin}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        maxLength={maxLength}
        spellCheck={false}
        autoComplete="off"
      />
      <div className="vin-input-overlay" aria-hidden="true">
        <span className="vin-input-normal">{normalPart}</span>
        <span className="vin-input-highlight">{highlightPart}</span>
      </div>
    </div>
  );
}

export default VinInput;
