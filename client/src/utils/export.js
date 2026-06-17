function escapeCSVValue(value) {
  if (value == null) return '';
  let str = String(value);
  // Neutralize CSV formula injection: a leading =, +, -, @, tab or CR can be
  // interpreted as a formula by Excel/Sheets. Prefix with a single quote.
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export function exportToCSV(data, columns, filename) {
  const headerRow = columns.map((col) => escapeCSVValue(col.label)).join(',');

  const dataRows = (data || []).map((row) =>
    columns
      .map((col) => {
        const value = col.render ? col.render(row) : row[col.key];
        return escapeCSVValue(value);
      })
      .join(',')
  );

  const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
