import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import DataTable from '../components/DataTable';
import { formatDate } from '../utils/formatDate';

function Trash() {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const fetchTrash = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/vehicles/trash', { params: { limit: 200 } });
      setData(res.data.data || []);
    } catch (err) {
      console.error('Error fetching trash:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTrash(); }, [fetchTrash]);

  async function handleRestore(row) {
    try {
      setBusyId(row.id);
      await api.post(`/vehicles/${row.id}/restore`);
      setData((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to restore');
    } finally {
      setBusyId(null);
    }
  }

  async function handlePermanentDelete() {
    if (!confirmDelete) return;
    try {
      setBusyId(confirmDelete.id);
      await api.delete(`/vehicles/${confirmDelete.id}/permanent`);
      setData((prev) => prev.filter((r) => r.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    } finally {
      setBusyId(null);
    }
  }

  const columns = [
    { key: 'profile_image_url', label: 'Image', type: 'image', width: '80px' },
    { key: 'mark', label: t('cars.vehicleName'), render: (row) => [row.year, row.mark, row.model].filter(Boolean).join(' ') || '—' },
    { key: 'vin', label: t('cars.vin') },
    { key: 'dealer_id', label: t('cars.dealer'), render: (row) => (
      <span>{row.dealer_name || '—'}{row.dealer_id ? ` (ID: ${row.dealer_id})` : ''}</span>
    )},
    { key: 'deleted_at', label: t('trash.deletedAt'), render: (row) => formatDate(row.deleted_at) },
    { key: 'days_left', label: t('trash.daysLeft'), align: 'center', render: (row) => {
      const d = parseInt(row.days_left);
      return <span style={{ color: d <= 5 ? '#DC3545' : '#6c757d', fontWeight: 600 }}>{isNaN(d) ? '—' : `${d} ${t('trash.days')}`}</span>;
    }},
  ];

  const actions = [
    { key: 'restore', label: t('trash.restore') },
    { key: 'delete', label: t('trash.deleteForever') },
  ];

  function onAction(action, row) {
    if (action === 'restore') handleRestore(row);
    else if (action === 'delete') setConfirmDelete(row);
  }

  return (
    <div>
      <h2 className="mb-2">{t('trash.title')}</h2>
      <p className="text-muted mb-4">{t('trash.hint')}</p>

      <DataTable
        columns={columns}
        data={data}
        loading={loading || busyId != null}
        actions={actions}
        onAction={onAction}
      />

      {confirmDelete && (
        <div className="cars-modal-overlay">
          <div className="cars-modal cars-modal-sm">
            <div className="cars-modal-header">
              <h5>{t('trash.deleteForever')}</h5>
              <button className="cars-modal-close" onClick={() => setConfirmDelete(null)}>&times;</button>
            </div>
            <div className="cars-modal-body">
              <p>{t('trash.confirmForever')}</p>
              <p><strong>{[confirmDelete.year, confirmDelete.mark, confirmDelete.model].filter(Boolean).join(' ')}</strong> — {confirmDelete.vin}</p>
            </div>
            <div className="cars-modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>{t('common.cancel')}</button>
              <button className="btn btn-danger" onClick={handlePermanentDelete}>{t('trash.deleteForever')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Trash;
