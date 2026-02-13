import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import ActionButtons from '../components/ActionButtons';
import './Boats.css';

const STATUS_KEYS = {
  us_port: 'boats.usPort',
  in_transit: 'boats.inTransit',
  arrived: 'boats.arrived',
  delivered: 'boats.delivered',
};

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function StatusBadge({ status, t }) {
  const label = STATUS_KEYS[status] ? t(STATUS_KEYS[status]) : (status || '—');
  return (
    <span className={`boats-status-badge boats-status-${status}`}>
      {label}
    </span>
  );
}

const EMPTY_FORM = {
  name: '',
  identification_code: '',
  departure_date: '',
  estimated_arrival_date: '',
  arrival_date: '',
  status: 'us_port',
};

function Boats() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role === 'admin';

  const STATUS_OPTIONS = [
    { value: 'us_port', label: t('boats.usPort') },
    { value: 'in_transit', label: t('boats.inTransit') },
    { value: 'arrived', label: t('boats.arrived') },
    { value: 'delivered', label: t('boats.delivered') },
  ];

  const columns = [
    { key: 'id', label: t('boats.id'), sortable: true },
    { key: 'name', label: t('boats.name'), sortable: true },
    { key: 'identification_code', label: t('boats.identificationCode'), sortable: true },
    { key: 'departure_date', label: t('boats.estDepartureDate'), sortable: true, render: (row) => formatDate(row.departure_date) },
    { key: 'estimated_arrival_date', label: t('boats.estArrivalDate'), sortable: true, render: (row) => formatDate(row.estimated_arrival_date) },
    { key: 'arrival_date', label: t('boats.arrivalDate'), sortable: true, render: (row) => formatDate(row.arrival_date) },
    { key: 'status', label: t('boats.status'), sortable: true, render: (row) => <StatusBadge status={row.status} t={t} /> },
  ];

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('desc');

  const [editModal, setEditModal] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = { limit, page, asc: sortDir, sort_by: sortBy };
      if (keyword) params.keyword = keyword;
      const res = await api.get('/boats', { params });
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Error fetching boats:', err);
    } finally {
      setLoading(false);
    }
  }, [limit, page, keyword, sortBy, sortDir]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleSearch(value) {
    setKeyword(value);
    setPage(1);
  }

  function handleSort(key, dir) {
    setSortBy(key);
    setSortDir(dir);
    setPage(1);
  }

  function handlePageChange(newPage) {
    setPage(newPage);
  }

  function handleLimitChange(newLimit) {
    setLimit(newLimit);
    setPage(1);
  }

  function handleAddNew() {
    setEditRow(null);
    setFormData(EMPTY_FORM);
    setEditModal(true);
  }

  function handleAction(action, row) {
    if (action === 'edit') {
      setEditRow(row);
      setFormData({
        name: row.name || '',
        identification_code: row.identification_code || '',
        departure_date: row.departure_date ? row.departure_date.slice(0, 10) : '',
        estimated_arrival_date: row.estimated_arrival_date ? row.estimated_arrival_date.slice(0, 10) : '',
        arrival_date: row.arrival_date ? row.arrival_date.slice(0, 10) : '',
        status: row.status || 'us_port',
      });
      setEditModal(true);
    } else if (action === 'delete') {
      setDeleteConfirm(row);
    }
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      const payload = {
        ...formData,
        departure_date: formData.departure_date || null,
        estimated_arrival_date: formData.estimated_arrival_date || null,
        arrival_date: formData.arrival_date || null,
      };

      if (editRow) {
        await api.put(`/boats/${editRow.id}`, payload);
      } else {
        await api.post('/boats', payload);
      }
      setEditModal(false);
      fetchData();
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/boats/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      console.error('Delete error:', err);
    }
  }

  const actions = isAdmin
    ? [
        { key: 'edit', label: t('common.edit') },
        { key: 'delete', label: t('common.delete') },
      ]
    : [];

  return (
    <div>
      <h2 className="mb-4">{t('boats.title')}</h2>

      <ActionButtons
        showAddNew={isAdmin}
        showSearch={true}
        searchValue={keyword}
        onAddNew={handleAddNew}
        onSearch={handleSearch}
      />

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        actions={actions}
        onAction={handleAction}
      />

      <Pagination
        page={page}
        total={total}
        limit={limit}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />

      {/* Add/Edit Modal */}
      {editModal && (
        <div className="boats-modal-overlay" onClick={() => setEditModal(false)}>
          <div className="boats-modal" onClick={e => e.stopPropagation()}>
            <div className="boats-modal-header">
              <h5>{editRow ? t('boats.editBoat') : t('boats.addNewBoat')}</h5>
              <button className="boats-modal-close" onClick={() => setEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="boats-modal-body">
                <div className="mb-3">
                  <label className="form-label">{t('boats.name')} <span className="text-danger">*</span></label>
                  <input type="text" className="form-control" name="name" value={formData.name} onChange={handleFormChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">{t('boats.identificationCode')}</label>
                  <input type="text" className="form-control" name="identification_code" value={formData.identification_code} onChange={handleFormChange} />
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('boats.estDepartureDate')}</label>
                    <input type="date" className="form-control" name="departure_date" value={formData.departure_date} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('boats.estArrivalDate')}</label>
                    <input type="date" className="form-control" name="estimated_arrival_date" value={formData.estimated_arrival_date} onChange={handleFormChange} />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('boats.arrivalDate')}</label>
                    <input type="date" className="form-control" name="arrival_date" value={formData.arrival_date} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('boats.status')}</label>
                    <select className="form-select" name="status" value={formData.status} onChange={handleFormChange}>
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="boats-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditModal(false)}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? t('common.saving') : (editRow ? t('common.update') : t('common.create'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="boats-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="boats-modal boats-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="boats-modal-header">
              <h5>{t('boats.deleteBoat')}</h5>
              <button className="boats-modal-close" onClick={() => setDeleteConfirm(null)}>&times;</button>
            </div>
            <div className="boats-modal-body">
              <p>{t('boats.confirmDeleteBoat')}</p>
              <p className="text-muted mb-0">
                {deleteConfirm.name} — {deleteConfirm.identification_code || t('boats.noId')}
              </p>
            </div>
            <div className="boats-modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>{t('common.cancel')}</button>
              <button className="btn btn-danger" onClick={handleDelete}>{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Boats;
