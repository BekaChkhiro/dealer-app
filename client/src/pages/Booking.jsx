import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import ActionButtons from '../components/ActionButtons';
import FilterPanel, { ActiveFilters } from '../components/FilterPanel';
import BulkActionBar from '../components/BulkActionBar';
import { exportToCSV } from '../utils/export';
import './Booking.css';

const EMPTY_FORM = {
  vin: '', buyer_fullname: '', booking_number: '', booking_paid: false,
  container: '', container_loaded_date: '', container_receiver: '',
  container_receive_date: '', container_released: false,
  delivery_location: '', estimated_arrival_date: '', line: '',
  open_date: '', est_opening_date: '', loading_port: '', terminal: '',
  car_details: '', lot_number: '', boat_id: '', boat_name: '',
};

const DATE_FIELDS = [
  'container_loaded_date', 'container_receive_date', 'estimated_arrival_date',
  'open_date', 'est_opening_date',
];

const BOOLEAN_FIELDS = ['booking_paid', 'container_released'];

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function Booking() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

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
    loading_port: '',
    line: '',
  });

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [editModal, setEditModal] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [exporting, setExporting] = useState(false);

  // Bulk operations state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [vinCodes, setVinCodes] = useState([]);
  const [containersList, setContainersList] = useState([]);
  const [boats, setBoats] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = { limit, page, asc: sortDir, sort_by: sortBy };
      if (keyword) params.keyword = keyword;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.loading_port) params.loading_port = filters.loading_port;
      if (filters.line) params.line = filters.line;
      const res = await api.get('/booking', { params });
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Error fetching bookings:', err);
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
        const [vRes, cRes, bRes] = await Promise.all([
          api.get('/vin-codes/booking'),
          api.get('/containers-list/booking'),
          api.get('/boats', { params: { limit: 500 } }),
        ]);
        setVinCodes(vRes.data.data || []);
        setContainersList(cRes.data.data || []);
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
    setFilters({ start_date: '', end_date: '', loading_port: '', line: '' });
    setPage(1);
    setShowFilterPanel(false);
  }

  function handleRemoveFilter(key) {
    setFilters((prev) => ({ ...prev, [key]: '' }));
    setPage(1);
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const columns = [
    { key: 'vin', label: t('booking.vin'), sortable: true },
    { key: 'buyer_fullname', label: t('booking.buyer'), sortable: true },
    { key: 'booking_number', label: t('booking.title'), sortable: true },
    { key: 'line', label: t('booking.line'), sortable: true },
    { key: 'container', label: t('booking.container'), sortable: true },
    { key: 'delivery_location', label: t('booking.deliveryLocation'), sortable: true },
    { key: 'loading_port', label: t('booking.loadingPort'), sortable: true },
    { key: 'container_loaded_date', label: t('booking.containerLoadedDate'), sortable: true, render: (row) => formatDate(row.container_loaded_date) },
    { key: 'container_receive_date', label: t('booking.containerReceiveDate'), sortable: true, render: (row) => formatDate(row.container_receive_date) },
    { key: 'terminal', label: t('booking.terminal'), sortable: true },
    { key: 'est_opening_date', label: t('booking.estimatedOpeningDate'), sortable: true, render: (row) => formatDate(row.est_opening_date) },
    { key: 'open_date', label: t('booking.openingDate'), sortable: true, render: (row) => formatDate(row.open_date) },
  ];

  const filterFields = [
    { type: 'date-range', label: t('booking.date'), startKey: 'start_date', endKey: 'end_date' },
    { type: 'select', key: 'loading_port', label: t('booking.loadingPort'), options: [
      { value: 'New York', label: t('ports.newYork') },
      { value: 'Savannah', label: t('ports.savannah') },
      { value: 'Houston', label: t('ports.houston') },
      { value: 'Los Angeles', label: t('ports.losAngeles') },
      { value: 'New Jersey', label: t('ports.newJersey') },
    ]},
    { type: 'select', key: 'line', label: t('booking.line'), options: [
      { value: 'MSC', label: t('lines.msc') },
      { value: 'Maersk', label: t('lines.maersk') },
      { value: 'ZIM', label: t('lines.zim') },
    ]},
  ];

  async function handleExport() {
    if (exporting) return;
    try {
      setExporting(true);
      const params = { limit: 100000, page: 1, asc: sortDir, sort_by: sortBy };
      if (keyword) params.keyword = keyword;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.loading_port) params.loading_port = filters.loading_port;
      if (filters.line) params.line = filters.line;
      const res = await api.get('/booking', { params });
      const rows = res.data.data || [];
      const today = new Date().toISOString().slice(0, 10);
      exportToCSV(rows, columns, `booking_${today}`);
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
    if (action === 'view') {
      navigate(`/booking/${row.id}`);
      return;
    }
    if (action === 'edit') {
      setEditRow(row);
      const populated = { ...EMPTY_FORM };
      for (const key of Object.keys(EMPTY_FORM)) {
        if (BOOLEAN_FIELDS.includes(key)) {
          populated[key] = !!row[key];
        } else if (DATE_FIELDS.includes(key)) {
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

  function handleCheckboxChange(e) {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
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
        if (BOOLEAN_FIELDS.includes(key)) {
          payload[key] = formData[key];
        } else if (DATE_FIELDS.includes(key)) {
          payload[key] = formData[key] || null;
        } else {
          payload[key] = formData[key] || null;
        }
      }
      if (payload.boat_id) payload.boat_id = Number(payload.boat_id);

      if (editRow) {
        await api.put(`/booking/${editRow.id}`, payload);
      } else {
        await api.post('/booking', payload);
      }
      setEditModal(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to save booking';
      setFormError(typeof msg === 'string' ? msg : 'Failed to save booking');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/booking/${deleteConfirm.id}`);
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
      await api.post('/booking/bulk-delete', { ids: [...selectedIds] });
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
    const today = new Date().toISOString().slice(0, 10);
    exportToCSV(selectedRows, columns, `booking_selected_${today}`);
  }

  const actions = isAdmin
    ? [
        { key: 'view', label: t('bookingDetail.view') },
        { key: 'edit', label: t('common.edit') },
        { key: 'delete', label: t('common.delete') },
      ]
    : [
        { key: 'view', label: t('bookingDetail.view') },
      ];

  return (
    <div>
      <h2 className="mb-4">{t('booking.title')}</h2>

      <ActionButtons
        showFilters={true}
        showExport={true}
        showAddNew={isAdmin}
        showSearch={true}
        searchValue={keyword}
        activeFilterCount={activeFilterCount}
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
        title={t('booking.filterBookings')}
        fields={filterFields}
        values={filters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        onClose={() => setShowFilterPanel(false)}
      />

      {/* Add/Edit Modal */}
      {editModal && (
        <div className="booking-modal-overlay" onClick={() => setEditModal(false)}>
          <div className="booking-modal booking-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="booking-modal-header">
              <h5>{editRow ? t('booking.editBooking') : t('booking.addNewBooking')}</h5>
              <button className="booking-modal-close" onClick={() => setEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="booking-modal-body">
                {formError && (
                  <div className="alert alert-danger py-2 mb-3">{formError}</div>
                )}
                {/* Row 1: VIN | Buyer */}
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('booking.vin')}</label>
                    <select className="form-select" name="vin" value={formData.vin} onChange={handleFormChange}>
                      <option value="">— Select VIN —</option>
                      {vinCodes.map(v => (
                        <option key={v.vin || v} value={v.vin || v}>{v.vin || v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('booking.buyerFullname')}</label>
                    <input type="text" className="form-control" name="buyer_fullname" value={formData.buyer_fullname} onChange={handleFormChange} />
                  </div>
                </div>
                {/* Row 2: Booking Number | Line */}
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('booking.bookingNumber')}</label>
                    <input type="text" className="form-control" name="booking_number" value={formData.booking_number} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('booking.line')}</label>
                    <select className="form-select" name="line" value={formData.line} onChange={handleFormChange}>
                      <option value="">— Select Line —</option>
                      <option value="MSC">{t('lines.msc')}</option>
                      <option value="Maersk">{t('lines.maersk')}</option>
                      <option value="ZIM">{t('lines.zim')}</option>
                    </select>
                  </div>
                </div>
                {/* Row 3: Container | Loading Port */}
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('booking.container')}</label>
                    <select className="form-select" name="container" value={formData.container} onChange={handleFormChange}>
                      <option value="">— Select Container —</option>
                      {containersList.map(c => (
                        <option key={c.container || c} value={c.container || c}>{c.container || c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('booking.loadingPort')}</label>
                    <select className="form-select" name="loading_port" value={formData.loading_port} onChange={handleFormChange}>
                      <option value="">— Select Port —</option>
                      <option value="New York">{t('ports.newYork')}</option>
                      <option value="Savannah">{t('ports.savannah')}</option>
                      <option value="Houston">{t('ports.houston')}</option>
                      <option value="Los Angeles">{t('ports.losAngeles')}</option>
                      <option value="New Jersey">{t('ports.newJersey')}</option>
                    </select>
                  </div>
                </div>
                {/* Row 4: Delivery Location | Terminal */}
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('booking.deliveryLocation')}</label>
                    <input type="text" className="form-control" name="delivery_location" value={formData.delivery_location} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('booking.terminal')}</label>
                    <input type="text" className="form-control" name="terminal" value={formData.terminal} onChange={handleFormChange} />
                  </div>
                </div>
                {/* Row 5: Boat | Lot Number */}
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('booking.boat')}</label>
                    <select className="form-select" name="boat_id" value={formData.boat_id} onChange={handleBoatChange}>
                      <option value="">— Select Boat —</option>
                      {boats.map(b => (
                        <option key={b.id} value={b.id}>{b.boat_name || b.name || `Boat #${b.id}`}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('booking.lotNumber')}</label>
                    <input type="text" className="form-control" name="lot_number" value={formData.lot_number} onChange={handleFormChange} />
                  </div>
                </div>
                {/* Row 6: Container Loaded Date | Container Receive Date */}
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('booking.containerLoadedDate')}</label>
                    <input type="date" className="form-control" name="container_loaded_date" value={formData.container_loaded_date} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('booking.containerReceiveDate')}</label>
                    <input type="date" className="form-control" name="container_receive_date" value={formData.container_receive_date} onChange={handleFormChange} />
                  </div>
                </div>
                {/* Row 7: Est. Arrival Date | Est. Opening Date */}
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('booking.estArrivalDate')}</label>
                    <input type="date" className="form-control" name="estimated_arrival_date" value={formData.estimated_arrival_date} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('booking.estOpeningDate')}</label>
                    <input type="date" className="form-control" name="est_opening_date" value={formData.est_opening_date} onChange={handleFormChange} />
                  </div>
                </div>
                {/* Row 8: Opening Date | Container Receiver */}
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('booking.openingDate')}</label>
                    <input type="date" className="form-control" name="open_date" value={formData.open_date} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('booking.containerReceiver')}</label>
                    <input type="text" className="form-control" name="container_receiver" value={formData.container_receiver} onChange={handleFormChange} />
                  </div>
                </div>
                {/* Row 9: Booking Paid | Container Released */}
                <div className="row mb-3">
                  <div className="col-6">
                    <div className="form-check mt-4">
                      <input type="checkbox" className="form-check-input" id="booking_paid" name="booking_paid" checked={formData.booking_paid} onChange={handleCheckboxChange} />
                      <label className="form-check-label" htmlFor="booking_paid">{t('booking.bookingPaid')}</label>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-check mt-4">
                      <input type="checkbox" className="form-check-input" id="container_released" name="container_released" checked={formData.container_released} onChange={handleCheckboxChange} />
                      <label className="form-check-label" htmlFor="container_released">{t('booking.containerReleased')}</label>
                    </div>
                  </div>
                </div>
                {/* Row 10: Car Details (full width) */}
                <div className="row mb-3">
                  <div className="col-12">
                    <label className="form-label">{t('booking.carDetails')}</label>
                    <textarea className="form-control" name="car_details" value={formData.car_details} onChange={handleFormChange} rows={3} />
                  </div>
                </div>
              </div>
              <div className="booking-modal-footer">
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
        <div className="booking-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="booking-modal booking-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="booking-modal-header">
              <h5>{t('booking.deleteBooking')}</h5>
              <button className="booking-modal-close" onClick={() => setDeleteConfirm(null)}>&times;</button>
            </div>
            <div className="booking-modal-body">
              <p>{t('booking.confirmDeleteBooking')}</p>
              <p className="text-muted mb-0">
                {deleteConfirm.booking_number && `#${deleteConfirm.booking_number}`}
                {deleteConfirm.vin && ` — ${deleteConfirm.vin}`}
              </p>
            </div>
            <div className="booking-modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>{t('common.cancel')}</button>
              <button className="btn btn-danger" onClick={handleDelete}>{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteConfirm && (
        <div className="booking-modal-overlay" onClick={() => setBulkDeleteConfirm(false)}>
          <div className="booking-modal booking-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="booking-modal-header">
              <h5>{t('bulk.bulkDelete')}</h5>
              <button className="booking-modal-close" onClick={() => setBulkDeleteConfirm(false)}>&times;</button>
            </div>
            <div className="booking-modal-body">
              <p>{t('bulk.confirmBulkDelete')}</p>
              <p className="text-muted mb-0">{selectedIds.size} {t('bulk.selected')} — {t('bulk.cannotUndo')}</p>
            </div>
            <div className="booking-modal-footer">
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

export default Booking;
