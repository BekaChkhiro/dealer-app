import { useTranslation } from '../context/LanguageContext';
import './ActionButtons.css';

export default function ActionButtons({
  showFilters = false,
  showExport = false,
  showAddNew = false,
  showPriceByPort = false,
  showSearch = true,
  searchValue = '',
  searchPlaceholder,
  addNewLabel,
  activeFilterCount = 0,
  exportLoading = false,
  onFilter,
  onExport,
  onAddNew,
  onPriceByPort,
  onSearch,
}) {
  const { t } = useTranslation();
  const resolvedPlaceholder = searchPlaceholder || (t('common.search') + '...');
  const resolvedAddNew = addNewLabel || t('common.addNew');

  function handleSearchChange(e) {
    if (onSearch) onSearch(e.target.value);
  }

  return (
    <div className="ab-bar">
      <div className="ab-left">
        {showFilters && (
          <button className="btn btn-primary ab-btn" onClick={onFilter}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            {t('common.filters')}
            {activeFilterCount > 0 && (
              <span className="ab-filter-badge">{activeFilterCount}</span>
            )}
          </button>
        )}

        {showExport && (
          <button className="btn btn-primary ab-btn" onClick={onExport} disabled={exportLoading}>
            {exportLoading ? (
              <span className="ab-spinner" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            )}
            {exportLoading ? t('common.exporting') : t('common.export')}
          </button>
        )}

        {showPriceByPort && (
          <button className="btn btn-primary ab-btn" onClick={onPriceByPort}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" rx="2" />
              <path d="M16 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
              <line x1="6" y1="13" x2="12" y2="13" />
              <line x1="9" y1="10" x2="9" y2="16" />
            </svg>
            {t('common.priceByPort')}
          </button>
        )}

        {showAddNew && (
          <button className="btn btn-primary ab-btn" onClick={onAddNew}>
            {resolvedAddNew}
          </button>
        )}
      </div>

      {showSearch && (
        <div className="ab-right">
          <div className="ab-search">
            <input
              type="text"
              className="ab-search-input"
              placeholder={resolvedPlaceholder}
              value={searchValue}
              onChange={handleSearchChange}
            />
            <span className="ab-search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
