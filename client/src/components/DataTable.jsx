import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../context/LanguageContext';
import './DataTable.css';

export default function DataTable({
  columns,
  data,
  loading = false,
  sortBy = '',
  sortDir = 'desc',
  onSort,
  actions,
  onAction,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
}) {
  const { t } = useTranslation();
  const [openMenuRow, setOpenMenuRow] = useState(null);
  const menuRef = useRef(null);
  const selectAllRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuRow(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update indeterminate state on the select-all checkbox
  useEffect(() => {
    if (selectAllRef.current && selectable && data.length > 0) {
      const selectedCount = data.filter(row => selectedIds.has(row.id)).length;
      selectAllRef.current.indeterminate = selectedCount > 0 && selectedCount < data.length;
    }
  }, [selectedIds, data, selectable]);

  function handleSort(col) {
    if (!col.sortable || !onSort) return;
    const key = col.sortKey || col.key;
    if (sortBy === key) {
      onSort(key, sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(key, 'asc');
    }
  }

  function toggleMenu(rowIndex, e) {
    e.stopPropagation();
    setOpenMenuRow(openMenuRow === rowIndex ? null : rowIndex);
  }

  function handleAction(action, row) {
    setOpenMenuRow(null);
    if (onAction) onAction(action, row);
  }

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;
    const allOnPage = data.map(row => row.id);
    const allSelected = allOnPage.every(id => selectedIds.has(id));
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(allOnPage));
    }
  }, [data, selectedIds, onSelectionChange]);

  const handleSelectRow = useCallback((rowId) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    if (next.has(rowId)) {
      next.delete(rowId);
    } else {
      next.add(rowId);
    }
    onSelectionChange(next);
  }, [selectedIds, onSelectionChange]);

  function renderCell(col, row) {
    if (col.render) return col.render(row);

    const value = row[col.key];

    if (col.type === 'image') {
      return value ? (
        <img src={value} alt="" className="dt-thumbnail" />
      ) : (
        <div className="dt-thumbnail-empty" />
      );
    }

    if (value == null || value === '') return '—';
    return value;
  }

  const hasActions = actions && actions.length > 0;
  const totalCols = columns.length + (hasActions ? 1 : 0) + (selectable ? 1 : 0);
  const allSelected = data.length > 0 && data.every(row => selectedIds.has(row.id));

  return (
    <div className="dt-wrapper">
      <div className="dt-table-container">
        <table className="dt-table">
          <thead>
            <tr>
              {selectable && (
                <th className="dt-th dt-th-checkbox">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className="dt-checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`dt-th ${col.sortable ? 'dt-sortable' : ''} ${col.align === 'right' ? 'dt-align-right' : ''}`}
                  style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                  onClick={() => handleSort(col)}
                >
                  <span className="dt-th-content">
                    {col.label}
                    {col.sortable && (
                      <span className="dt-sort-icon">
                        {sortBy === (col.sortKey || col.key) ? (
                          sortDir === 'asc' ? (
                            <SortAscIcon />
                          ) : (
                            <SortDescIcon />
                          )
                        ) : (
                          <SortNeutralIcon />
                        )}
                      </span>
                    )}
                  </span>
                </th>
              ))}
              {hasActions && <th className="dt-th dt-th-actions" />}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={totalCols}
                  className="dt-loading"
                >
                  <div className="dt-spinner" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={totalCols}
                  className="dt-empty"
                >
                  {t('common.noData')}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={row.id ?? rowIndex} className={`dt-row ${selectable && selectedIds.has(row.id) ? 'dt-row-selected' : ''}`}>
                  {selectable && (
                    <td className="dt-td dt-td-checkbox">
                      <input
                        type="checkbox"
                        className="dt-checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => handleSelectRow(row.id)}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`dt-td ${col.align === 'right' ? 'dt-align-right' : ''}`}
                    >
                      {renderCell(col, row)}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="dt-td dt-td-actions">
                      <button
                        className="dt-menu-btn"
                        onClick={(e) => toggleMenu(rowIndex, e)}
                      >
                        <DotsIcon />
                      </button>
                      {openMenuRow === rowIndex && (
                        <div className="dt-menu-dropdown" ref={menuRef}>
                          {actions.map((action) => (
                            <button
                              key={action.key}
                              className="dt-menu-item"
                              onClick={() => handleAction(action.key, row)}
                            >
                              {action.icon && (
                                <span className="dt-menu-item-icon">
                                  {action.icon}
                                </span>
                              )}
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DotsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="9" cy="4" r="0.75" fill="currentColor" />
      <circle cx="9" cy="9" r="0.75" fill="currentColor" />
      <circle cx="9" cy="14" r="0.75" fill="currentColor" />
    </svg>
  );
}

function SortAscIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M6 2L10 7H2L6 2Z" opacity="1" />
      <path d="M6 10L10 5H2L6 10Z" opacity="0.25" />
    </svg>
  );
}

function SortDescIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M6 2L10 7H2L6 2Z" opacity="0.25" />
      <path d="M6 10L10 5H2L6 10Z" opacity="1" />
    </svg>
  );
}

function SortNeutralIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M6 2L10 7H2L6 2Z" opacity="0.35" />
      <path d="M6 10L10 5H2L6 10Z" opacity="0.35" />
    </svg>
  );
}
