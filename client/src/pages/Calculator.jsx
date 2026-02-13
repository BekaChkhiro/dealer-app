import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import ActionButtons from '../components/ActionButtons';
import './Calculator.css';

function formatPrice(value) {
  if (value == null) return '—';
  return `$${Number(value).toLocaleString()}`;
}

function Calculator() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role === 'admin';

  const columns = [
    { key: 'auction', label: t('calculator.auction'), sortable: true },
    { key: 'city', label: t('calculator.city'), sortable: true },
    { key: 'destination', label: t('calculator.destination'), sortable: true },
    { key: 'land_price', label: t('calculator.landPrice'), sortable: true, align: 'right', render: (row) => formatPrice(row.land_price) },
    { key: 'container_price', label: t('calculator.containerPrice'), sortable: true, align: 'right', render: (row) => formatPrice(row.container_price) },
    { key: 'total_price', label: t('calculator.total'), sortable: true, align: 'right', render: (row) => formatPrice(row.total_price) },
    { key: 'port', label: t('calculator.port'), sortable: true },
  ];

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('desc');
  const [portFilter, setPortFilter] = useState('');
  const [ports, setPorts] = useState([]);
  const [showPortDropdown, setShowPortDropdown] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [formData, setFormData] = useState({ auction: '', city: '', destination: '', land_price: '', container_price: '', total_price: '', port: '' });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = { limit, page, asc: sortDir, sort_by: sortBy };
      if (keyword) params.keyword = keyword;
      if (portFilter) params.port = portFilter;
      const res = await api.get('/calculator', { params });
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Error fetching calculator:', err);
    } finally {
      setLoading(false);
    }
  }, [limit, page, keyword, sortBy, sortDir, portFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch unique ports for "Price By Port" filter
  useEffect(() => {
    api.get('/calculator', { params: { limit: 500, page: 1 } })
      .then(res => {
        const allPorts = (res.data.data || []).map(r => r.port).filter(Boolean);
        setPorts([...new Set(allPorts)].sort());
      })
      .catch(() => {});
  }, []);

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

  function handlePriceByPort() {
    setShowPortDropdown(prev => !prev);
  }

  function selectPort(port) {
    setPortFilter(port);
    setShowPortDropdown(false);
    setPage(1);
  }

  function clearPortFilter() {
    setPortFilter('');
    setShowPortDropdown(false);
    setPage(1);
  }

  function handleAddNew() {
    setEditRow(null);
    setFormData({ auction: '', city: '', destination: '', land_price: '', container_price: '', total_price: '', port: '' });
    setEditModal(true);
  }

  function handleAction(action, row) {
    if (action === 'edit') {
      setEditRow(row);
      setFormData({
        auction: row.auction || '',
        city: row.city || '',
        destination: row.destination || '',
        land_price: row.land_price ?? '',
        container_price: row.container_price ?? '',
        total_price: row.total_price ?? '',
        port: row.port || '',
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
    if (!formData.auction.trim()) return;

    setSaving(true);
    try {
      const payload = {
        ...formData,
        land_price: Number(formData.land_price) || 0,
        container_price: Number(formData.container_price) || 0,
        total_price: Number(formData.total_price) || 0,
      };

      if (editRow) {
        await api.put(`/calculator/${editRow.id}`, payload);
      } else {
        await api.post('/calculator', payload);
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
      await api.delete(`/calculator/${deleteConfirm.id}`);
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
      <h2 className="mb-4">{t('calculator.title')}</h2>

      <div className="calc-action-row">
        <ActionButtons
          showPriceByPort={true}
          showAddNew={isAdmin}
          showSearch={true}
          searchValue={keyword}
          onPriceByPort={handlePriceByPort}
          onAddNew={handleAddNew}
          onSearch={handleSearch}
        />

        {showPortDropdown && (
          <div className="calc-port-dropdown">
            <button
              className={`calc-port-item ${!portFilter ? 'active' : ''}`}
              onClick={clearPortFilter}
            >
              {t('calculator.allPorts')}
            </button>
            {ports.map(p => (
              <button
                key={p}
                className={`calc-port-item ${portFilter === p ? 'active' : ''}`}
                onClick={() => selectPort(p)}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {portFilter && (
        <div className="calc-active-filter">
          <span>{t('calculator.portLabel')} <strong>{portFilter}</strong></span>
          <button className="calc-clear-filter" onClick={clearPortFilter}>&times;</button>
        </div>
      )}

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
        <div className="calc-modal-overlay" onClick={() => setEditModal(false)}>
          <div className="calc-modal" onClick={e => e.stopPropagation()}>
            <div className="calc-modal-header">
              <h5>{editRow ? t('calculator.editEntry') : t('calculator.addNewEntry')}</h5>
              <button className="calc-modal-close" onClick={() => setEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="calc-modal-body">
                <div className="mb-3">
                  <label className="form-label">{t('calculator.auction')} <span className="text-danger">*</span></label>
                  <input type="text" className="form-control" name="auction" value={formData.auction} onChange={handleFormChange} required />
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('calculator.city')}</label>
                    <input type="text" className="form-control" name="city" value={formData.city} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('calculator.destination')}</label>
                    <input type="text" className="form-control" name="destination" value={formData.destination} onChange={handleFormChange} />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-4">
                    <label className="form-label">{t('calculator.landPrice')}</label>
                    <input type="number" className="form-control" name="land_price" value={formData.land_price} onChange={handleFormChange} />
                  </div>
                  <div className="col-4">
                    <label className="form-label">{t('calculator.containerPrice')}</label>
                    <input type="number" className="form-control" name="container_price" value={formData.container_price} onChange={handleFormChange} />
                  </div>
                  <div className="col-4">
                    <label className="form-label">{t('calculator.total')}</label>
                    <input type="number" className="form-control" name="total_price" value={formData.total_price} onChange={handleFormChange} />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">{t('calculator.port')}</label>
                  <input type="text" className="form-control" name="port" value={formData.port} onChange={handleFormChange} />
                </div>
              </div>
              <div className="calc-modal-footer">
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
        <div className="calc-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="calc-modal calc-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="calc-modal-header">
              <h5>{t('calculator.deleteEntry')}</h5>
              <button className="calc-modal-close" onClick={() => setDeleteConfirm(null)}>&times;</button>
            </div>
            <div className="calc-modal-body">
              <p>{t('calculator.confirmDeleteEntry')}</p>
              <p className="text-muted mb-0">
                {deleteConfirm.auction} — {deleteConfirm.city} — {deleteConfirm.port}
              </p>
            </div>
            <div className="calc-modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>{t('common.cancel')}</button>
              <button className="btn btn-danger" onClick={handleDelete}>{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calculator;
