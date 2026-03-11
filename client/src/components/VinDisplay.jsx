import './VinDisplay.css';

/**
 * VinDisplay Component
 * Displays a VIN code with the last 6 characters highlighted in red.
 * Standard VIN codes are 17 characters long.
 */
function VinDisplay({ vin, className = '' }) {
  if (!vin) return <span className={className}>—</span>;

  // VIN is typically 17 characters, highlight last 6
  const vinStr = String(vin);

  if (vinStr.length <= 6) {
    // If VIN is 6 chars or less, show all in red
    return (
      <span className={`vin-display ${className}`}>
        <span className="vin-highlight">{vinStr}</span>
      </span>
    );
  }

  const normalPart = vinStr.slice(0, -6);
  const highlightPart = vinStr.slice(-6);

  return (
    <span className={`vin-display ${className}`}>
      <span className="vin-normal">{normalPart}</span>
      <span className="vin-highlight">{highlightPart}</span>
    </span>
  );
}

export default VinDisplay;
