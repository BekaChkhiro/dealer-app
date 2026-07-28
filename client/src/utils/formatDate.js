// Shared date formatting — American style with the month spelled out.
// e.g. "Jul 9, 2026". Used everywhere dates are displayed to the user.
export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  const opts = { year: 'numeric', month: 'short', day: 'numeric' };
  // Show the time too when the value carries a non-midnight time.
  if (d.getHours() || d.getMinutes()) {
    return d.toLocaleString('en-US', { ...opts, hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-US', opts);
}

// Same as formatDate but with time, e.g. "Jul 9, 2026, 3:04 PM".
export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export default formatDate;
