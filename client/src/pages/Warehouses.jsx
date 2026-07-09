import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import DataTable from '../components/DataTable';
import './Warehouses.css';

function ActiveBadge({ isActive, t }) {
  return (
    <span className={`badge ${isActive ? 'bg-success' : 'bg-secondary'}`}>
      {isActive ? t('warehouses.active') : t('warehouses.inactive')}
    </span>
  );
}

const EMPTY_FORM = { name: '', code: '', location: '', is_active: true, sort_order: '' };

function Warehouses() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role === 'admin';

  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchWarehouses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/warehouses');
      setWarehouses(res.data.data || []);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWarehouses(); }, [fetchWarehouses]);

  function handleAddNew() {
    setEditRow(null);
    setFormData(EMPTY_FORM);
    setFormError('');
    setEditModal(true);
  }

  function handleAction(action, row) {
    if (action === 'edit') {
      setEditRow(row);
      setFormData({
        name: row.name || '',
        code: row.code || '',
        location: row.location || '',
        is_active: row.is_active !== false,
        sort_order: row.sort_order ?? '',
      });
      setFormError('');
      setEditModal(true);
    } else if (action === 'delete') {
      setDeleteConfirm(row);
    }
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    setFormError('');
    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code || null,
        location: formData.location || null,
        is_active: formData.is_active,
        sort_order: Number(formData.sort_order) || 0,
      };

      if (editRow) {
        await api.put(`/warehouses/${editRow.id}`, payload);
      } else {
        await api.post('/warehouses', payload);
      }
      setEditModal(false);
      fetchWarehouses();
    } catch (err) {
      console.error('Warehouse save error:', err);
      setFormError(err.response?.data?.message || t('warehouses.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/warehouses/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      fetchWarehouses();
    } catch (err) {
      console.error('Warehouse delete error:', err);
    }
  }

  const columns = [
    { key: 'name', label: t('warehouses.name'), sortable: false },
    { key: 'code', label: t('warehouses.code'), sortable: false },
    { key: 'location', label: t('warehouses.location'), sortable: false },
    { key: 'is_active', label: t('warehouses.active'), sortable: false, render: (row) => <ActiveBadge isActive={row.is_active} t={t} /> },
    { key: 'sort_order', label: t('warehouses.sortOrder'), sortable: false, align: 'right' },
  ];

  const actions = isAdmin
    ? [
        { key: 'edit', label: t('common.edit') },
        { key: 'delete', label: t('common.delete') },
      ]
    : [];

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h2 className="mb-0">{t('warehouses.title')}</h2>
        {isAdmin && (
          <button type="button" className="btn btn-primary btn-sm" onClick={handleAddNew}>
            {t('warehouses.addNew')}
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={warehouses}
        loading={loading}
        actions={actions}
        onAction={handleAction}
      />

      {/* Add/Edit Modal */}
      {editModal && (
        <div className="wh-modal-overlay" onClick={() => setEditModal(false)}>
          <div className="wh-modal" onClick={e => e.stopPropagation()}>
            <div className="wh-modal-header">
              <h5>{editRow ? t('warehouses.editWarehouse') : t('warehouses.addNewWarehouse')}</h5>
              <button className="wh-modal-close" aria-label={t('common.close')} onClick={() => setEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="wh-modal-body">
                {formError && (
                  <div className="alert alert-danger py-2 mb-3">{formError}</div>
                )}
                <div className="mb-3">
                  <label className="form-label" htmlFor="wh-name">
                    {t('warehouses.name')} <span className="text-danger">*</span>
                  </label>
                  <input
                    id="wh-name"
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label" htmlFor="wh-code">{t('warehouses.code')}</label>
                    <input
                      id="wh-code"
                      type="text"
                      className="form-control"
                      name="code"
                      value={formData.code}
                      onChange={handleFormChange}
                      placeholder="e.g., POTI-1"
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label" htmlFor="wh-sort-order">{t('warehouses.sortOrder')}</label>
                    <input
                      id="wh-sort-order"
                      type="number"
                      className="form-control"
                      name="sort_order"
                      value={formData.sort_order}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="wh-location">{t('warehouses.location')}</label>
                  <input
                    id="wh-location"
                    type="text"
                    className="form-control"
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="wh-is-active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleFormChange}
                    />
                    <label className="form-check-label" htmlFor="wh-is-active">
                      {t('warehouses.active')}
                    </label>
                  </div>
                </div>
              </div>
              <div className="wh-modal-footer">
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
        <div className="wh-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="wh-modal wh-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="wh-modal-header">
              <h5>{t('warehouses.deleteWarehouse')}</h5>
              <button className="wh-modal-close" aria-label={t('common.close')} onClick={() => setDeleteConfirm(null)}>&times;</button>
            </div>
            <div className="wh-modal-body">
              <p>{t('warehouses.confirmDeleteWarehouse')}</p>
              <p className="text-muted mb-0">{deleteConfirm.name}</p>
            </div>
            <div className="wh-modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>{t('common.cancel')}</button>
              <button className="btn btn-danger" onClick={handleDelete}>{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Warehouses;
