import { useState, useEffect, useRef } from 'react';
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
}) {
  const { t } = useTranslation();
  const [openMenuRow, setOpenMenuRow] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuRow(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  return (
    <div className="dt-wrapper">
      <div className="dt-table-container">
        <table className="dt-table">
          <thead>
            <tr>
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
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  className="dt-loading"
                >
                  <div className="dt-spinner" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  className="dt-empty"
                >
                  {t('common.noData')}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={row.id ?? rowIndex} className="dt-row">
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
