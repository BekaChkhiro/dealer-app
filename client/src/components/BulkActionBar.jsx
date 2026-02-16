import { useTranslation } from '../context/LanguageContext';
import './BulkActionBar.css';

export default function BulkActionBar({
  selectedCount,
  onBulkDelete,
  onExportSelected,
  onDeselectAll,
  bulkDeleting = false,
}) {
  const { t } = useTranslation();

  if (selectedCount === 0) return null;

  return (
    <div className="bulk-bar">
      <div className="bulk-bar-left">
        <span className="bulk-bar-count">
          {selectedCount} {t('bulk.selected')}
        </span>
        <button className="bulk-bar-deselect" onClick={onDeselectAll}>
          {t('bulk.deselectAll')}
        </button>
      </div>
      <div className="bulk-bar-right">
        {onExportSelected && (
          <button className="btn btn-primary btn-sm" onClick={onExportSelected}>
            {t('bulk.exportSelected')}
          </button>
        )}
        {onBulkDelete && (
          <button
            className="btn btn-danger btn-sm"
            onClick={onBulkDelete}
            disabled={bulkDeleting}
          >
            {bulkDeleting ? (
              <>
                <span className="bulk-bar-spinner" />
                {t('bulk.deleting')}
              </>
            ) : (
              t('bulk.deleteSelected')
            )}
          </button>
        )}
      </div>
    </div>
  );
}
