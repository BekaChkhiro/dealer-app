import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../context/LanguageContext';
import './FilterPanel.css';

export function ActiveFilters({ fields, values, onRemove }) {
  const pills = [];

  for (const field of fields) {
    if (field.type === 'date-range') {
      const startVal = values[field.startKey];
      const endVal = values[field.endKey];
      if (startVal) {
        pills.push({ key: field.startKey, label: `${field.label} from: ${startVal}` });
      }
      if (endVal) {
        pills.push({ key: field.endKey, label: `${field.label} to: ${endVal}` });
      }
    } else if (field.type === 'select') {
      const val = values[field.key];
      if (val) {
        const opt = field.options?.find((o) => o.value === val);
        pills.push({ key: field.key, label: `${field.label}: ${opt ? opt.label : val}` });
      }
    }
  }

  if (pills.length === 0) return null;

  return (
    <div className="fp-active-filters">
      {pills.map((pill) => (
        <span key={pill.key} className="fp-badge">
          {pill.label}
          <button className="fp-badge-remove" onClick={() => onRemove(pill.key)}>&times;</button>
        </span>
      ))}
    </div>
  );
}

export default function FilterPanel({ open, title, fields, values, onApply, onClear, onClose }) {
  const { t } = useTranslation();
  const resolvedTitle = title || t('common.filters');
  const [draft, setDraft] = useState({});

  useEffect(() => {
    if (open) {
      setDraft({ ...values });
    }
  }, [open, values]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  function updateDraft(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleApply() {
    onApply(draft);
  }

  function handleClear() {
    const cleared = {};
    for (const field of fields) {
      if (field.type === 'date-range') {
        cleared[field.startKey] = '';
        cleared[field.endKey] = '';
      } else {
        cleared[field.key] = '';
      }
    }
    setDraft(cleared);
    onClear();
  }

  return (
    <div className="fp-overlay" onClick={onClose}>
      <div className="fp-panel" onClick={(e) => e.stopPropagation()}>
        <div className="fp-header">
          <h5>{resolvedTitle}</h5>
          <button className="fp-close" onClick={onClose}>&times;</button>
        </div>

        <div className="fp-body">
          {fields.map((field) => {
            if (field.type === 'date-range') {
              return (
                <div key={field.startKey} className="fp-field">
                  <label>{field.label}</label>
                  <div className="fp-date-row">
                    <input
                      type="date"
                      value={draft[field.startKey] || ''}
                      onChange={(e) => updateDraft(field.startKey, e.target.value)}
                    />
                    <input
                      type="date"
                      value={draft[field.endKey] || ''}
                      onChange={(e) => updateDraft(field.endKey, e.target.value)}
                    />
                  </div>
                </div>
              );
            }

            if (field.type === 'select') {
              return (
                <div key={field.key} className="fp-field">
                  <label>{field.label}</label>
                  <select
                    className="form-select"
                    value={draft[field.key] || ''}
                    onChange={(e) => updateDraft(field.key, e.target.value)}
                  >
                    <option value="">{t('common.all')}</option>
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            return null;
          })}
        </div>

        <div className="fp-footer">
          <button className="btn btn-secondary" onClick={handleClear}>{t('filterPanel.clearAll')}</button>
          <button className="btn btn-primary" onClick={handleApply}>{t('filterPanel.apply')}</button>
        </div>
      </div>
    </div>
  );
}
