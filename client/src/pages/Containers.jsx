import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import ActionButtons from '../components/ActionButtons';
import FilterPanel, { ActiveFilters } from '../components/FilterPanel';
import BulkActionBar from '../components/BulkActionBar';
import { exportToCSV } from '../utils/export';
import './Containers.css';

const EMPTY_FORM = {
  container_number: '', vin: '', purchase_date: '', manufacturer: '', model: '',
  manufacturer_year: '', buyer_name: '', booking: '', delivery_location: '',
  container_open_date: '', line: '', personal_number: '', lot_number: '',
  loading_port: '', container_loaded_date: '', container_receive_date: '',
  boat_id: '', boat_name: '', status: 'booked',
};

const DATE_FIELDS = [
  'purchase_date', 'container_open_date', 'container_loaded_date', 'container_receive_date',
];

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function Containers() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role === 'admin';

  const columns = [
    { key: 'vin', label: t('containers.vin'), sortable: true },
    { key: 'container_number', label: t('containers.containerHash'), sortable: true },
    { key: 'purchase_date', label: t('containers.purchaseDate'), sortable: true, render: (row) => formatDate(row.purchase_date) },
    { key: 'vehicle_name', label: t('containers.vehicleName'), render: (row) => [row.manufacturer, row.model, row.manufacturer_year].filter(Boolean).join(' ') || '—' },
    { key: 'buyer_name', label: t('containers.buyer'), sortable: true },
    { key: 'booking', label: t('containers.booking'), sortable: true },
    { key: 'delivery_location', label: t('containers.deliveryLocation'), sortable: true },
    { key: 'container_open_date', label: t('containers.containerOpenDate'), sortable: true, render: (row) => formatDate(row.container_open_date) },
    { key: 'line', label: t('containers.lines'), sortable: true },
    { key: 'personal_number', label: t('containers.personalNumber') },
    { key: 'lot_number', label: t('containers.lotStock') },
    { key: 'loading_port', label: t('containers.loadingPort'), sortable: true },
    { key: 'container_loaded_date', label: t('containers.containerLoadedDate'), sortable: true, render: (row) => formatDate(row.container_loaded_date) },
    { key: 'container_receive_date', label: t('containers.containerReceiveDate'), sortable: true, render: (row) => formatDate(row.container_receive_date) },
  ];

  const filterFields = [
    { type: 'date-range', label: t('containers.date'), startKey: 'start_date', endKey: 'end_date' },
    { type: 'select', key: 'status', label: t('containers.status'), options: [
      { value: 'booked', label: t('containers.booked') },
      { value: 'in_transit', label: t('containers.inTransit') },
      { value: 'arrived', label: t('containers.arrived') },
      { value: 'delivered', label: t('containers.delivered') },
    ]},
  ];

  const actions = isAdmin
    ? [
        { key: 'edit', label: t('common.edit') },
        { key: 'delete', label: t('common.delete') },
      ]
    : [];

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('desc');
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    status: '',
  });

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Bulk operations state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [vinCodes, setVinCodes] = useState([]);
  const [boats, setBoats] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = { limit, page, asc: sortDir, sort_by: sortBy };
      if (keyword) params.keyword = keyword;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.status) params.status = filters.status;
      const res = await api.get('/containers', { params });
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Error fetching containers:', err);
    } finally {
      setLoading(false);
    }
  }, [limit, page, keyword, sortBy, sortDir, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Clear selection when data parameters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, limit, keyword, sortBy, sortDir, filters]);

  useEffect(() => {
    async function fetchDropdowns() {
      try {
        const [vRes, bRes] = await Promise.all([
          api.get('/vin-codes/booking'),
          api.get('/boats', { params: { limit: 500 } }),
        ]);
        setVinCodes(vRes.data.data || []);
        setBoats(bRes.data.data || []);
      } catch (err) {
        console.error('Error fetching dropdown data:', err);
      }
    }
    fetchDropdowns();
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

  function handleFilter() {
    setShowFilterPanel(true);
  }

  function handleApplyFilters(newFilters) {
    setFilters(newFilters);
    setPage(1);
    setShowFilterPanel(false);
  }

  function handleClearFilters() {
    setFilters({ start_date: '', end_date: '', status: '' });
    setPage(1);
    setShowFilterPanel(false);
  }

  function handleRemoveFilter(key) {
    setFilters((prev) => ({ ...prev, [key]: '' }));
    setPage(1);
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  async function handleExport() {
    if (exporting) return;
    try {
      setExporting(true);
      const params = { limit: 100000, page: 1, asc: sortDir, sort_by: sortBy };
      if (keyword) params.keyword = keyword;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.status) params.status = filters.status;
      const res = await api.get('/containers', { params });
      const rows = res.data.data || [];
      exportToCSV(rows, columns, 'containers');
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  }

  function handleAddNew() {
    setEditRow(null);
    setFormData(EMPTY_FORM);
    setFormError('');
    setEditModal(true);
  }

  function handleAction(action, row) {
    if (action === 'edit') {
      setEditRow(row);
      const populated = { ...EMPTY_FORM };
      for (const key of Object.keys(EMPTY_FORM)) {
        if (DATE_FIELDS.includes(key)) {
          populated[key] = row[key] ? String(row[key]).slice(0, 10) : '';
        } else {
          populated[key] = row[key] != null ? String(row[key]) : '';
        }
      }
      setFormData(populated);
      setFormError('');
      setEditModal(true);
    } else if (action === 'delete') {
      setDeleteConfirm(row);
    }
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  function handleBoatChange(e) {
    const boatId = e.target.value;
    const selected = boats.find(b => String(b.id) === boatId);
    setFormData(prev => ({
      ...prev,
      boat_id: boatId,
      boat_name: selected ? selected.boat_name || selected.name || '' : '',
    }));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const payload = {};
      for (const key of Object.keys(EMPTY_FORM)) {
        if (DATE_FIELDS.includes(key)) {
          payload[key] = formData[key] || null;
        } else {
          payload[key] = formData[key] || null;
        }
      }
      if (payload.boat_id) payload.boat_id = Number(payload.boat_id);

      if (editRow) {
        await api.put(`/containers/${editRow.id}`, payload);
      } else {
        await api.post('/containers', payload);
      }
      setEditModal(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to save container';
      setFormError(typeof msg === 'string' ? msg : 'Failed to save container');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/containers/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      console.error('Delete error:', err);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    try {
      await api.post('/containers/bulk-delete', { ids: [...selectedIds] });
      setSelectedIds(new Set());
      setBulkDeleteConfirm(false);
      fetchData();
    } catch (err) {
      console.error('Bulk delete error:', err);
    } finally {
      setBulkDeleting(false);
    }
  }

  function handleExportSelected() {
    const selectedRows = data.filter(row => selectedIds.has(row.id));
    if (selectedRows.length === 0) return;
    exportToCSV(selectedRows, columns, `containers_selected`);
  }

  return (
    <div>
      <h2 className="mb-4">{t('containers.title')}</h2>

      <ActionButtons
        showFilters={true}
        showExport={true}
        showAddNew={isAdmin}
        showSearch={true}
        searchValue={keyword}
        activeFilterCount={activeFilterCount}
        exportLoading={exporting}
        onFilter={handleFilter}
        onExport={handleExport}
        onAddNew={handleAddNew}
        onSearch={handleSearch}
      />

      <ActiveFilters
        fields={filterFields}
        values={filters}
        onRemove={handleRemoveFilter}
      />

      {isAdmin && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          onBulkDelete={() => setBulkDeleteConfirm(true)}
          onExportSelected={handleExportSelected}
          onDeselectAll={() => setSelectedIds(new Set())}
          bulkDeleting={bulkDeleting}
        />
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
        selectable={isAdmin}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      <Pagination
        page={page}
        total={total}
        limit={limit}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />

      <FilterPanel
        open={showFilterPanel}
        title={t('containers.filterContainers')}
        fields={filterFields}
        values={filters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        onClose={() => setShowFilterPanel(false)}
      />

      {/* Add/Edit Modal */}
      {editModal && (
        <div className="containers-modal-overlay" onClick={() => setEditModal(false)}>
          <div className="containers-modal containers-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="containers-modal-header">
              <h5>{editRow ? t('containers.editContainer') : t('containers.addNewContainer')}</h5>
              <button className="containers-modal-close" onClick={() => setEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="containers-modal-body">
                {formError && (
                  <div className="alert alert-danger py-2 mb-3">{formError}</div>
                )}
                {/* Row 1: VIN | Container Number */}
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('containers.vin')}</label>
                    <select className="form-select" name="vin" value={formData.vin} onChange={handleFormChange}>
                      <option value="">— Select VIN —</option>
                      {vinCodes.map(v => (
                        <option key={v.vin || v} value={v.vin || v}>{v.vin || v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('containers.containerNumber')}</label>
                    <input type="text" className="form-control" name="container_number" value={formData.container_number} onChange={handleFormChange} />
                  </div>
                </div>
                {/* Row 2: Manufacturer | Model */}
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('containers.manufacturer')}</label>
                    <input type="text" className="form-control" name="manufacturer" value={formData.manufacturer} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('containers.model')}</label>
                    <input type="text" className="form-control" name="model" value={formData.model} onChange={handleFormChange} />
                  </div>
                </div>
                {/* Row 3: Manufacturer Year | Buyer Name */}
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('containers.manufacturerYear')}</label>
                    <input type="number" className="form-control" name="manufacturer_year" value={formData.manufacturer_year} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('containers.buyerName')}</label>
                    <input type="text" className="form-control" name="buyer_name" value={formData.buyer_name} onChange={handleFormChange} />
                  </div>
                </div>
                {/* Row 4: Booking | Personal Number */}
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('containers.booking')}</label>
                    <input type="text" className="form-control" name="booking" value={formData.booking} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('containers.personalNumberField')}</label>
                    <input type="text" className="form-control" name="personal_number" value={formData.personal_number} onChange={handleFormChange} />
                  </div>
                </div>
                {/* Row 5: Delivery Location | Line */}
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('containers.deliveryLocation')}</label>
                    <input type="text" className="form-control" name="delivery_location" value={formData.delivery_location} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('containers.line')}</label>
                    <select className="form-select" name="line" value={formData.line} onChange={handleFormChange}>
                      <option value="">— Select Line —</option>
                      <option value="MSC">{t('lines.msc')}</option>
                      <option value="Maersk">{t('lines.maersk')}</option>
                      <option value="ZIM">{t('lines.zim')}</option>
                    </select>
                  </div>
                </div>
                {/* Row 6: Loading Port | Lot Number */}
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('containers.loadingPort')}</label>
                    <select className="form-select" name="loading_port" value={formData.loading_port} onChange={handleFormChange}>
                      <option value="">— Select Port —</option>
                      <option value="New York">{t('ports.newYork')}</option>
                      <option value="Savannah">{t('ports.savannah')}</option>
                      <option value="Houston">{t('ports.houston')}</option>
                      <option value="Los Angeles">{t('ports.losAngeles')}</option>
                      <option value="New Jersey">{t('ports.newJersey')}</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('containers.lotNumber')}</label>
                    <input type="text" className="form-control" name="lot_number" value={formData.lot_number} onChange={handleFormChange} />
                  </div>
                </div>
                {/* Row 7: Purchase Date | Container Open Date */}
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('containers.purchaseDate')}</label>
                    <input type="date" className="form-control" name="purchase_date" value={formData.purchase_date} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('containers.containerOpenDate')}</label>
                    <input type="date" className="form-control" name="container_open_date" value={formData.container_open_date} onChange={handleFormChange} />
                  </div>
                </div>
                {/* Row 8: Container Loaded Date | Container Receive Date */}
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('containers.containerLoadedDate')}</label>
                    <input type="date" className="form-control" name="container_loaded_date" value={formData.container_loaded_date} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('containers.containerReceiveDate')}</label>
                    <input type="date" className="form-control" name="container_receive_date" value={formData.container_receive_date} onChange={handleFormChange} />
                  </div>
                </div>
                {/* Row 9: Boat | Status */}
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('containers.boat')}</label>
                    <select className="form-select" name="boat_id" value={formData.boat_id} onChange={handleBoatChange}>
                      <option value="">— Select Boat —</option>
                      {boats.map(b => (
                        <option key={b.id} value={b.id}>{b.boat_name || b.name || `Boat #${b.id}`}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('containers.status')}</label>
                    <select className="form-select" name="status" value={formData.status} onChange={handleFormChange}>
                      <option value="booked">{t('containers.booked')}</option>
                      <option value="in_transit">{t('containers.inTransit')}</option>
                      <option value="arrived">{t('containers.arrived')}</option>
                      <option value="delivered">{t('containers.delivered')}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="containers-modal-footer">
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
        <div className="containers-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="containers-modal containers-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="containers-modal-header">
              <h5>{t('containers.deleteContainer')}</h5>
              <button className="containers-modal-close" onClick={() => setDeleteConfirm(null)}>&times;</button>
            </div>
            <div className="containers-modal-body">
              <p>{t('containers.confirmDeleteContainer')}</p>
              <p className="text-muted mb-0">
                {deleteConfirm.container_number && `#${deleteConfirm.container_number}`}
                {deleteConfirm.vin && ` — ${deleteConfirm.vin}`}
              </p>
            </div>
            <div className="containers-modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>{t('common.cancel')}</button>
              <button className="btn btn-danger" onClick={handleDelete}>{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteConfirm && (
        <div className="containers-modal-overlay" onClick={() => setBulkDeleteConfirm(false)}>
          <div className="containers-modal containers-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="containers-modal-header">
              <h5>{t('bulk.bulkDelete')}</h5>
              <button className="containers-modal-close" onClick={() => setBulkDeleteConfirm(false)}>&times;</button>
            </div>
            <div className="containers-modal-body">
              <p>{t('bulk.confirmBulkDelete')}</p>
              <p className="text-muted mb-0">{selectedIds.size} {t('bulk.selected')} — {t('bulk.cannotUndo')}</p>
            </div>
            <div className="containers-modal-footer">
              <button className="btn btn-secondary" onClick={() => setBulkDeleteConfirm(false)}>{t('common.cancel')}</button>
              <button className="btn btn-danger" onClick={handleBulkDelete} disabled={bulkDeleting}>
                {bulkDeleting ? t('bulk.deleting') : t('bulk.deleteItems')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Containers;
