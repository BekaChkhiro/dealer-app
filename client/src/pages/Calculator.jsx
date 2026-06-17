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

function formatModifier(value) {
  if (value == null) return '—';
  const n = Number(value);
  if (n > 0) return `+${n}`;
  return String(n);
}

function Calculator() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role === 'admin';

  const columns = [
    { key: 'auction', label: t('calculator.auction'), sortable: true },
    { key: 'city', label: t('calculator.city'), sortable: true },
    { key: 'state', label: t('calculator.state'), sortable: true },
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
  const [formData, setFormData] = useState({ auction: '', city: '', state: '', destination: '', land_price: '', container_price: '', total_price: '', port: '' });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Vehicle Types state
  const [vtData, setVtData] = useState([]);
  const [vtLoading, setVtLoading] = useState(true);
  const [vtEditModal, setVtEditModal] = useState(false);
  const [vtEditRow, setVtEditRow] = useState(null);
  const [vtFormData, setVtFormData] = useState({ name: '', price_modifier: '', sort_order: '' });
  const [vtSaving, setVtSaving] = useState(false);
  const [vtDeleteConfirm, setVtDeleteConfirm] = useState(null);

  const fetchVehicleTypes = useCallback(async () => {
    try {
      setVtLoading(true);
      const res = await api.get('/vehicle-types');
      setVtData(res.data.data || []);
    } catch (err) {
      console.error('Error fetching vehicle types:', err);
    } finally {
      setVtLoading(false);
    }
  }, []);

  useEffect(() => { fetchVehicleTypes(); }, [fetchVehicleTypes]);

  function handleVtAddNew() {
    setVtEditRow(null);
    setVtFormData({ name: '', price_modifier: '', sort_order: '' });
    setVtEditModal(true);
  }

  function handleVtAction(action, row) {
    if (action === 'edit') {
      setVtEditRow(row);
      setVtFormData({
        name: row.name || '',
        price_modifier: row.price_modifier ?? '',
        sort_order: row.sort_order ?? '',
      });
      setVtEditModal(true);
    } else if (action === 'delete') {
      setVtDeleteConfirm(row);
    }
  }

  function handleVtFormChange(e) {
    const { name, value } = e.target;
    setVtFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleVtFormSubmit(e) {
    e.preventDefault();
    if (!vtFormData.name.trim()) return;

    setVtSaving(true);
    try {
      const payload = {
        name: vtFormData.name,
        price_modifier: Number(vtFormData.price_modifier) || 0,
        sort_order: Number(vtFormData.sort_order) || 0,
      };

      if (vtEditRow) {
        await api.put(`/vehicle-types/${vtEditRow.id}`, payload);
      } else {
        await api.post('/vehicle-types', payload);
      }
      setVtEditModal(false);
      fetchVehicleTypes();
    } catch (err) {
      console.error('Vehicle type save error:', err);
    } finally {
      setVtSaving(false);
    }
  }

  async function handleVtDelete() {
    if (!vtDeleteConfirm) return;
    try {
      await api.delete(`/vehicle-types/${vtDeleteConfirm.id}`);
      setVtDeleteConfirm(null);
      fetchVehicleTypes();
    } catch (err) {
      console.error('Vehicle type delete error:', err);
    }
  }

  const vtColumns = [
    { key: 'name', label: 'ტიპის დასახელება', sortable: false },
    { key: 'price_modifier', label: 'ფასის მოდიფიკატორი', sortable: false, align: 'right', render: (row) => formatModifier(row.price_modifier) },
    { key: 'sort_order', label: 'რიგითობა', sortable: false, align: 'right' },
  ];

  const vtActions = isAdmin
    ? [
        { key: 'edit', label: t('common.edit') },
        { key: 'delete', label: t('common.delete') },
      ]
    : [];

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
    setFormData({ auction: '', city: '', state: '', destination: '', land_price: '', container_price: '', total_price: '', port: '' });
    setEditModal(true);
  }

  function handleAction(action, row) {
    if (action === 'edit') {
      setEditRow(row);
      setFormData({
        auction: row.auction || '',
        city: row.city || '',
        state: row.state || '',
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

      {/* Vehicle Types Section */}
      <div className="mt-5">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h4 className="mb-0">ავტომობილის ტიპები</h4>
          {isAdmin && (
            <button type="button" className="btn btn-primary btn-sm" onClick={handleVtAddNew}>
              + დამატება
            </button>
          )}
        </div>

        <DataTable
          columns={vtColumns}
          data={vtData}
          loading={vtLoading}
          actions={vtActions}
          onAction={handleVtAction}
        />
      </div>

      {/* Vehicle Types – Add/Edit Modal */}
      {vtEditModal && (
        <div className="calc-modal-overlay" onClick={() => setVtEditModal(false)}>
          <div className="calc-modal" onClick={e => e.stopPropagation()}>
            <div className="calc-modal-header">
              <h5>{vtEditRow ? 'ტიპის რედაქტირება' : 'ახალი ტიპის დამატება'}</h5>
              <button className="calc-modal-close" aria-label="დახურვა" onClick={() => setVtEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleVtFormSubmit}>
              <div className="calc-modal-body">
                <div className="mb-3">
                  <label className="form-label" htmlFor="vt-name">
                    ტიპის დასახელება <span className="text-danger">*</span>
                  </label>
                  <input
                    id="vt-name"
                    type="text"
                    className="form-control"
                    name="name"
                    value={vtFormData.name}
                    onChange={handleVtFormChange}
                    required
                  />
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label" htmlFor="vt-price-modifier">ფასის მოდიფიკატორი</label>
                    <input
                      id="vt-price-modifier"
                      type="number"
                      className="form-control"
                      name="price_modifier"
                      value={vtFormData.price_modifier}
                      onChange={handleVtFormChange}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label" htmlFor="vt-sort-order">რიგითობა</label>
                    <input
                      id="vt-sort-order"
                      type="number"
                      className="form-control"
                      name="sort_order"
                      value={vtFormData.sort_order}
                      onChange={handleVtFormChange}
                    />
                  </div>
                </div>
              </div>
              <div className="calc-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setVtEditModal(false)}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={vtSaving}>
                  {vtSaving ? t('common.saving') : (vtEditRow ? t('common.update') : t('common.create'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vehicle Types – Delete Confirmation Modal */}
      {vtDeleteConfirm && (
        <div className="calc-modal-overlay" onClick={() => setVtDeleteConfirm(null)}>
          <div className="calc-modal calc-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="calc-modal-header">
              <h5>ტიპის წაშლა</h5>
              <button className="calc-modal-close" aria-label="დახურვა" onClick={() => setVtDeleteConfirm(null)}>&times;</button>
            </div>
            <div className="calc-modal-body">
              <p>დარწმუნებული ხართ, რომ გსურთ ამ ჩანაწერის წაშლა?</p>
              <p className="text-muted mb-0">{vtDeleteConfirm.name}</p>
            </div>
            <div className="calc-modal-footer">
              <button className="btn btn-secondary" onClick={() => setVtDeleteConfirm(null)}>{t('common.cancel')}</button>
              <button className="btn btn-danger" onClick={handleVtDelete}>{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}

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
                  <div className="col-4">
                    <label className="form-label">{t('calculator.city')}</label>
                    <input type="text" className="form-control" name="city" value={formData.city} onChange={handleFormChange} />
                  </div>
                  <div className="col-4">
                    <label className="form-label">{t('calculator.state')}</label>
                    <input type="text" className="form-control" name="state" value={formData.state} onChange={handleFormChange} />
                  </div>
                  <div className="col-4">
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
