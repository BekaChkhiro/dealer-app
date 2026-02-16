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
import './Cars.css';

const EMPTY_FORM = {
  // Vehicle info
  mark: '', model: '', year: '', vin: '', lot_number: '', auction: '', vehicle_type: '', doc_type: '', is_hybrid: false, is_sublot: false,
  // Buyer / Receiver
  buyer: '', dealer_id: '', receiver_fullname: '', receiver_identity_number: '', receiver_phone: '', buyer_number: '',
  // Location
  us_state: '', us_port: '', destination_port: '',
  // Container / Booking
  container_number: '', line: '', booking: '',
  // Pricing
  vehicle_price: '', total_price: '', payed_amount: '', debt_amount: '', container_cost: '', landing_cost: '', dealer_fee: '', late_car_payment: '',
  // Status / Payment
  current_status: '', status_color: '', is_fully_paid: false, is_partially_paid: false, is_funded: false, is_insured: false,
  // Dates
  purchase_date: '', vehicle_pickup_date: '', warehouse_receive_date: '', container_loading_date: '', estimated_receive_date: '', receive_date: '', container_open_date: '', container_receive_date: '',
  // Checkboxes
  has_key: false, has_auction_image: false, has_transportation_image: false, has_port_image: false, has_poti_image: false, receiver_changed: false,
  // Receiver change
  receiver_change_date: '',
  // Driver
  driver_fullname: '', driver_phone: '', driver_car_license_number: '', driver_company: '',
};

const BOOLEAN_FIELDS = [
  'is_hybrid', 'is_sublot', 'is_fully_paid', 'is_partially_paid', 'is_funded', 'is_insured',
  'has_key', 'has_auction_image', 'has_transportation_image', 'has_port_image', 'has_poti_image', 'receiver_changed',
];

const DATE_FIELDS = [
  'purchase_date', 'vehicle_pickup_date', 'warehouse_receive_date', 'container_loading_date',
  'estimated_receive_date', 'receive_date', 'container_open_date', 'container_receive_date', 'receiver_change_date',
];

function formatPrice(value) {
  if (value == null) return '—';
  return `$${Number(value).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function Cars() {
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
    auction: '',
    line: '',
    status: '',
    paid: '',
  });

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Bulk operations state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Add/Edit form state
  const [editModal, setEditModal] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [dealers, setDealers] = useState([]);
  const [cities, setCities] = useState([]);

  const FILTER_FIELDS = [
    { type: 'date-range', label: t('cars.purchaseDate'), startKey: 'start_date', endKey: 'end_date' },
    { type: 'select', key: 'auction', label: t('cars.auction'), options: [{ value: 'Copart', label: 'Copart' }, { value: 'IAAI', label: 'IAAI' }] },
    { type: 'select', key: 'line', label: t('cars.line'), options: [{ value: 'MSC', label: 'MSC' }, { value: 'Maersk', label: 'Maersk' }, { value: 'ZIM', label: 'ZIM' }] },
    { type: 'select', key: 'status', label: t('cars.status'), options: [{ value: 'arrived', label: 'Arrived' }, { value: 'in_transit', label: 'In Transit' }, { value: 'booked', label: 'Booked' }] },
    { type: 'select', key: 'paid', label: t('cars.paid'), options: [{ value: 'paid', label: 'Paid' }, { value: 'unpaid', label: 'Unpaid' }, { value: 'partial', label: 'Partial' }] },
  ];

  const columns = [
    { key: 'profile_image_url', label: 'Image', type: 'image', width: '80px' },
    { key: 'buyer', label: t('cars.dealer'), sortable: true },
    { key: 'purchase_date', label: t('cars.purchaseDate'), sortable: true, render: (row) => formatDate(row.purchase_date) },
    { key: 'mark', label: t('cars.vehicleName'), sortable: true, render: (row) => {
      const name = [row.mark, row.model, row.year].filter(Boolean).join(' ') || '—';
      return <a href={`/cars/${row.id}`} onClick={(e) => { e.preventDefault(); navigate(`/cars/${row.id}`); }} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>{name}</a>;
    }},
    { key: 'vin', label: t('cars.vin'), sortable: true },
    { key: 'receiver_fullname', label: t('cars.buyer'), sortable: true },
    { key: 'receiver_identity_number', label: t('cars.personalNumber') },
    { key: 'receiver_phone', label: t('cars.phone') },
    { key: 'container_number', label: t('cars.container') },
    { key: 'booking', label: t('cars.booking') },
    { key: 'line', label: t('cars.line') },
    { key: 'auction', label: t('cars.auction'), sortable: true },
    { key: 'us_state', label: t('cars.state'), sortable: true },
    { key: 'payed_amount', label: t('cars.paid'), sortable: true, align: 'right', render: (row) => formatPrice(row.payed_amount) },
    { key: 'total_price', label: t('cars.total'), sortable: true, align: 'right', render: (row) => formatPrice(row.total_price) },
    { key: 'debt_amount', label: t('cars.debt'), sortable: true, align: 'right', render: (row) => formatPrice(row.debt_amount) },
  ];

  const actions = isAdmin
    ? [
        { key: 'view', label: t('carDetail.view') },
        { key: 'edit', label: t('common.edit') },
        { key: 'delete', label: t('common.delete') },
      ]
    : [
        { key: 'view', label: t('carDetail.view') },
      ];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = { limit, page, asc: sortDir, sort_by: sortBy };
      if (keyword) params.keyword = keyword;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.auction) params.auction = filters.auction;
      if (filters.line) params.line = filters.line;
      if (filters.status) params.status = filters.status;
      if (filters.paid) params.paid = filters.paid;
      const res = await api.get('/vehicles', { params });
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    } finally {
      setLoading(false);
    }
  }, [limit, page, keyword, sortBy, sortDir, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Clear selection when data parameters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, limit, keyword, sortBy, sortDir, filters]);

  // Fetch dropdown data on mount
  useEffect(() => {
    async function fetchDropdowns() {
      try {
        const [usersRes, citiesRes] = await Promise.all([
          api.get('/users', { params: { limit: 500 } }),
          api.get('/cities'),
        ]);
        setDealers(usersRes.data.data || []);
        setCities(citiesRes.data.data || []);
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
    setFilters({ start_date: '', end_date: '', auction: '', line: '', status: '', paid: '' });
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
      if (filters.auction) params.auction = filters.auction;
      if (filters.line) params.line = filters.line;
      if (filters.status) params.status = filters.status;
      if (filters.paid) params.paid = filters.paid;
      const res = await api.get('/vehicles', { params });
      const rows = res.data.data || [];

      const exportColumns = [
        { key: 'buyer', label: t('cars.dealer') },
        { key: 'purchase_date', label: t('cars.purchaseDate'), render: (row) => formatDate(row.purchase_date) },
        { key: 'mark', label: t('cars.vehicleName'), render: (row) => [row.mark, row.model, row.year].filter(Boolean).join(' ') || '' },
        { key: 'vin', label: t('cars.vin') },
        { key: 'receiver_fullname', label: t('cars.buyer') },
        { key: 'receiver_identity_number', label: t('cars.personalNumber') },
        { key: 'receiver_phone', label: t('cars.phone') },
        { key: 'container_number', label: t('cars.container') },
        { key: 'booking', label: t('cars.booking') },
        { key: 'line', label: t('cars.line') },
        { key: 'auction', label: t('cars.auction') },
        { key: 'us_state', label: t('cars.state') },
        { key: 'payed_amount', label: t('cars.paid'), render: (row) => row.payed_amount != null ? row.payed_amount : '' },
        { key: 'total_price', label: t('cars.total'), render: (row) => row.total_price != null ? row.total_price : '' },
        { key: 'debt_amount', label: t('cars.debt'), render: (row) => row.debt_amount != null ? row.debt_amount : '' },
      ];

      const today = new Date().toISOString().slice(0, 10);
      exportToCSV(rows, exportColumns, `vehicles_${today}`);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  }

  function handleAddNew() {
    setEditRow(null);
    setFormData(EMPTY_FORM);
    setImageFile(null);
    setImagePreview(null);
    setFormError('');
    setEditModal(true);
  }

  function handleAction(action, row) {
    if (action === 'view') {
      navigate(`/cars/${row.id}`);
      return;
    }
    if (action === 'edit') {
      setEditRow(row);
      const populated = { ...EMPTY_FORM };
      // Copy string/number fields
      for (const key of Object.keys(EMPTY_FORM)) {
        if (BOOLEAN_FIELDS.includes(key)) {
          populated[key] = !!row[key];
        } else if (DATE_FIELDS.includes(key)) {
          populated[key] = row[key] ? row[key].slice(0, 10) : '';
        } else {
          populated[key] = row[key] != null ? String(row[key]) : '';
        }
      }
      setFormData(populated);
      setImageFile(null);
      setImagePreview(row.profile_image_url || null);
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

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    try {
      const fd = new FormData();

      for (const [key, value] of Object.entries(formData)) {
        if (BOOLEAN_FIELDS.includes(key)) {
          fd.append(key, value ? 'true' : 'false');
        } else {
          fd.append(key, value);
        }
      }

      if (imageFile) {
        fd.append('profile_image', imageFile);
      }

      if (editRow) {
        await api.put(`/vehicles/${editRow.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/vehicles', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      setEditModal(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to save vehicle';
      setFormError(typeof msg === 'string' ? msg : 'Failed to save vehicle');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/vehicles/${deleteConfirm.id}`);
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
      await api.post('/vehicles/bulk-delete', { ids: [...selectedIds] });
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
    const exportColumns = [
      { key: 'buyer', label: t('cars.dealer') },
      { key: 'purchase_date', label: t('cars.purchaseDate'), render: (row) => formatDate(row.purchase_date) },
      { key: 'mark', label: t('cars.vehicleName'), render: (row) => [row.mark, row.model, row.year].filter(Boolean).join(' ') || '' },
      { key: 'vin', label: t('cars.vin') },
      { key: 'receiver_fullname', label: t('cars.buyer') },
      { key: 'receiver_identity_number', label: t('cars.personalNumber') },
      { key: 'receiver_phone', label: t('cars.phone') },
      { key: 'container_number', label: t('cars.container') },
      { key: 'booking', label: t('cars.booking') },
      { key: 'line', label: t('cars.line') },
      { key: 'auction', label: t('cars.auction') },
      { key: 'us_state', label: t('cars.state') },
      { key: 'payed_amount', label: t('cars.paid'), render: (row) => row.payed_amount != null ? row.payed_amount : '' },
      { key: 'total_price', label: t('cars.total'), render: (row) => row.total_price != null ? row.total_price : '' },
      { key: 'debt_amount', label: t('cars.debt'), render: (row) => row.debt_amount != null ? row.debt_amount : '' },
    ];
    const today = new Date().toISOString().slice(0, 10);
    exportToCSV(selectedRows, exportColumns, `vehicles_selected_${today}`);
  }

  return (
    <div>
      <h2 className="mb-4">{t('cars.title')}</h2>

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
        fields={FILTER_FIELDS}
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
        title={t('cars.filterCars')}
        fields={FILTER_FIELDS}
        values={filters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        onClose={() => setShowFilterPanel(false)}
      />

      {/* Add/Edit Modal */}
      {editModal && (
        <div className="cars-modal-overlay" onClick={() => setEditModal(false)}>
          <div className="cars-modal cars-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="cars-modal-header">
              <h5>{editRow ? t('cars.editVehicle') : t('cars.addNewVehicle')}</h5>
              <button className="cars-modal-close" onClick={() => setEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="cars-modal-body">
                {formError && (
                  <div className="alert alert-danger py-2 mb-3">{formError}</div>
                )}

                {/* Section 1 — Vehicle Image */}
                <h6 className="cars-section-heading">{t('cars.vehicleImage')}</h6>
                <div className="mb-3">
                  {imagePreview && (
                    <img src={imagePreview} alt="Vehicle preview" className="cars-image-preview" />
                  )}
                  <input type="file" className="form-control" accept="image/*" onChange={handleImageChange} />
                </div>

                <hr />

                {/* Section 2 — Vehicle Info */}
                <h6 className="cars-section-heading">{t('cars.vehicleInfo')}</h6>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('cars.mark')} <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="mark" value={formData.mark} onChange={handleFormChange} required />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('cars.model')} <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="model" value={formData.model} onChange={handleFormChange} required />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('cars.year')}</label>
                    <input type="text" className="form-control" name="year" value={formData.year} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('cars.vin')} <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="vin" value={formData.vin} onChange={handleFormChange} required />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('cars.lotNumber')}</label>
                    <input type="text" className="form-control" name="lot_number" value={formData.lot_number} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('cars.auction')}</label>
                    <select className="form-select" name="auction" value={formData.auction} onChange={handleFormChange}>
                      <option value="">Select...</option>
                      <option value="Copart">Copart</option>
                      <option value="IAAI">IAAI</option>
                    </select>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('cars.vehicleType')}</label>
                    <input type="text" className="form-control" name="vehicle_type" value={formData.vehicle_type} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('cars.docType')}</label>
                    <input type="text" className="form-control" name="doc_type" value={formData.doc_type} onChange={handleFormChange} />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6 d-flex align-items-center gap-3">
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" name="is_hybrid" id="is_hybrid" checked={formData.is_hybrid} onChange={handleFormChange} />
                      <label className="form-check-label" htmlFor="is_hybrid">{t('cars.isHybrid')}</label>
                    </div>
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" name="is_sublot" id="is_sublot" checked={formData.is_sublot} onChange={handleFormChange} />
                      <label className="form-check-label" htmlFor="is_sublot">{t('cars.isSublot')}</label>
                    </div>
                  </div>
                </div>

                <hr />

                {/* Section 3 — Dealer & Receiver */}
                <h6 className="cars-section-heading">{t('cars.dealerReceiver')}</h6>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('cars.dealer')}</label>
                    <select className="form-select" name="dealer_id" value={formData.dealer_id} onChange={handleFormChange}>
                      <option value="">Select...</option>
                      {dealers.map(d => (
                        <option key={d.id} value={d.id}>{[d.name, d.surname].filter(Boolean).join(' ') || d.username}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('cars.buyer')}</label>
                    <input type="text" className="form-control" name="buyer" value={formData.buyer} onChange={handleFormChange} />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('cars.receiverFullname')}</label>
                    <input type="text" className="form-control" name="receiver_fullname" value={formData.receiver_fullname} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('cars.receiverIdNumber')}</label>
                    <input type="text" className="form-control" name="receiver_identity_number" value={formData.receiver_identity_number} onChange={handleFormChange} />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('cars.receiverPhone')}</label>
                    <input type="text" className="form-control" name="receiver_phone" value={formData.receiver_phone} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('cars.buyerNumber')}</label>
                    <input type="text" className="form-control" name="buyer_number" value={formData.buyer_number} onChange={handleFormChange} />
                  </div>
                </div>

                <hr />

                {/* Section 4 — Location */}
                <h6 className="cars-section-heading">{t('cars.location')}</h6>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('cars.usState')}</label>
                    <input type="text" className="form-control" name="us_state" value={formData.us_state} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('cars.usPort')}</label>
                    <input type="text" className="form-control" name="us_port" value={formData.us_port} onChange={handleFormChange} />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('cars.destinationPort')}</label>
                    <select className="form-select" name="destination_port" value={formData.destination_port} onChange={handleFormChange}>
                      <option value="">Select...</option>
                      {cities.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <hr />

                {/* Section 5 — Container & Booking */}
                <h6 className="cars-section-heading">{t('cars.containerBooking')}</h6>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('cars.containerNumber')}</label>
                    <input type="text" className="form-control" name="container_number" value={formData.container_number} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('cars.line')}</label>
                    <select className="form-select" name="line" value={formData.line} onChange={handleFormChange}>
                      <option value="">Select...</option>
                      <option value="MSC">MSC</option>
                      <option value="Maersk">Maersk</option>
                      <option value="ZIM">ZIM</option>
                    </select>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('cars.booking')}</label>
                    <input type="text" className="form-control" name="booking" value={formData.booking} onChange={handleFormChange} />
                  </div>
                </div>

                <hr />

                {/* Section 6 — Pricing */}
                <h6 className="cars-section-heading">{t('cars.pricing')}</h6>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('cars.vehiclePrice')}</label>
                    <input type="number" className="form-control" name="vehicle_price" value={formData.vehicle_price} onChange={handleFormChange} step="0.01" min="0" />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('cars.totalPrice')}</label>
                    <input type="number" className="form-control" name="total_price" value={formData.total_price} onChange={handleFormChange} step="0.01" min="0" />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('cars.paidAmount')}</label>
                    <input type="number" className="form-control" name="payed_amount" value={formData.payed_amount} onChange={handleFormChange} step="0.01" min="0" />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('cars.debtAmount')}</label>
                    <input type="number" className="form-control" name="debt_amount" value={formData.debt_amount} onChange={handleFormChange} step="0.01" min="0" />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('cars.containerCost')}</label>
                    <input type="number" className="form-control" name="container_cost" value={formData.container_cost} onChange={handleFormChange} step="0.01" min="0" />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('cars.landingCost')}</label>
                    <input type="number" className="form-control" name="landing_cost" value={formData.landing_cost} onChange={handleFormChange} step="0.01" min="0" />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('cars.dealerFee')}</label>
                    <input type="number" className="form-control" name="dealer_fee" value={formData.dealer_fee} onChange={handleFormChange} step="0.01" min="0" />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('cars.lateCarPayment')}</label>
                    <input type="number" className="form-control" name="late_car_payment" value={formData.late_car_payment} onChange={handleFormChange} step="0.01" min="0" />
                  </div>
                </div>

                <hr />

                {/* Section 7 — Status */}
                <h6 className="cars-section-heading">{t('cars.status')}</h6>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('cars.currentStatus')}</label>
                    <select className="form-select" name="current_status" value={formData.current_status} onChange={handleFormChange}>
                      <option value="">Select...</option>
                      <option value="arrived">Arrived</option>
                      <option value="in_transit">In Transit</option>
                      <option value="booked">Booked</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('cars.statusColor')}</label>
                    <input type="text" className="form-control" name="status_color" value={formData.status_color} onChange={handleFormChange} />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6 d-flex align-items-center gap-3 flex-wrap">
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" name="is_fully_paid" id="is_fully_paid" checked={formData.is_fully_paid} onChange={handleFormChange} />
                      <label className="form-check-label" htmlFor="is_fully_paid">{t('cars.fullyPaid')}</label>
                    </div>
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" name="is_partially_paid" id="is_partially_paid" checked={formData.is_partially_paid} onChange={handleFormChange} />
                      <label className="form-check-label" htmlFor="is_partially_paid">{t('cars.partiallyPaid')}</label>
                    </div>
                  </div>
                  <div className="col-6 d-flex align-items-center gap-3 flex-wrap">
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" name="is_funded" id="is_funded" checked={formData.is_funded} onChange={handleFormChange} />
                      <label className="form-check-label" htmlFor="is_funded">{t('cars.funded')}</label>
                    </div>
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" name="is_insured" id="is_insured" checked={formData.is_insured} onChange={handleFormChange} />
                      <label className="form-check-label" htmlFor="is_insured">{t('cars.insured')}</label>
                    </div>
                  </div>
                </div>

                <hr />

                {/* Section 8 — Dates */}
                <h6 className="cars-section-heading">{t('cars.dates')}</h6>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('cars.purchaseDate')}</label>
                    <input type="date" className="form-control" name="purchase_date" value={formData.purchase_date} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('cars.vehiclePickupDate')}</label>
                    <input type="date" className="form-control" name="vehicle_pickup_date" value={formData.vehicle_pickup_date} onChange={handleFormChange} />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('cars.warehouseReceiveDate')}</label>
                    <input type="date" className="form-control" name="warehouse_receive_date" value={formData.warehouse_receive_date} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('cars.containerLoadingDate')}</label>
                    <input type="date" className="form-control" name="container_loading_date" value={formData.container_loading_date} onChange={handleFormChange} />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('cars.estimatedReceiveDate')}</label>
                    <input type="date" className="form-control" name="estimated_receive_date" value={formData.estimated_receive_date} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('cars.receiveDate')}</label>
                    <input type="date" className="form-control" name="receive_date" value={formData.receive_date} onChange={handleFormChange} />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('cars.containerOpenDate')}</label>
                    <input type="date" className="form-control" name="container_open_date" value={formData.container_open_date} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('cars.containerReceiveDate')}</label>
                    <input type="date" className="form-control" name="container_receive_date" value={formData.container_receive_date} onChange={handleFormChange} />
                  </div>
                </div>

                <hr />

                {/* Section 9 — Additional */}
                <h6 className="cars-section-heading">{t('cars.additional')}</h6>
                <div className="row mb-3">
                  <div className="col-12 d-flex align-items-center gap-3 flex-wrap">
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" name="has_key" id="has_key" checked={formData.has_key} onChange={handleFormChange} />
                      <label className="form-check-label" htmlFor="has_key">{t('cars.hasKey')}</label>
                    </div>
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" name="has_auction_image" id="has_auction_image" checked={formData.has_auction_image} onChange={handleFormChange} />
                      <label className="form-check-label" htmlFor="has_auction_image">{t('cars.auctionImage')}</label>
                    </div>
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" name="has_transportation_image" id="has_transportation_image" checked={formData.has_transportation_image} onChange={handleFormChange} />
                      <label className="form-check-label" htmlFor="has_transportation_image">{t('cars.transportationImage')}</label>
                    </div>
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" name="has_port_image" id="has_port_image" checked={formData.has_port_image} onChange={handleFormChange} />
                      <label className="form-check-label" htmlFor="has_port_image">{t('cars.portImage')}</label>
                    </div>
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" name="has_poti_image" id="has_poti_image" checked={formData.has_poti_image} onChange={handleFormChange} />
                      <label className="form-check-label" htmlFor="has_poti_image">{t('cars.potiImage')}</label>
                    </div>
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" name="receiver_changed" id="receiver_changed" checked={formData.receiver_changed} onChange={handleFormChange} />
                      <label className="form-check-label" htmlFor="receiver_changed">{t('cars.receiverChanged')}</label>
                    </div>
                  </div>
                </div>
                {formData.receiver_changed && (
                  <div className="row mb-3">
                    <div className="col-6">
                      <label className="form-label">{t('cars.receiverChangeDate')}</label>
                      <input type="date" className="form-control" name="receiver_change_date" value={formData.receiver_change_date} onChange={handleFormChange} />
                    </div>
                  </div>
                )}

                <hr />

                {/* Section 10 — Driver Info */}
                <h6 className="cars-section-heading">{t('cars.driverInfo')}</h6>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('cars.driverFullname')}</label>
                    <input type="text" className="form-control" name="driver_fullname" value={formData.driver_fullname} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('cars.driverPhone')}</label>
                    <input type="text" className="form-control" name="driver_phone" value={formData.driver_phone} onChange={handleFormChange} />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('cars.driverLicenseNumber')}</label>
                    <input type="text" className="form-control" name="driver_car_license_number" value={formData.driver_car_license_number} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('cars.driverCompany')}</label>
                    <input type="text" className="form-control" name="driver_company" value={formData.driver_company} onChange={handleFormChange} />
                  </div>
                </div>
              </div>
              <div className="cars-modal-footer">
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
        <div className="cars-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="cars-modal cars-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="cars-modal-header">
              <h5>{t('cars.deleteVehicle')}</h5>
              <button className="cars-modal-close" onClick={() => setDeleteConfirm(null)}>&times;</button>
            </div>
            <div className="cars-modal-body">
              <p>{t('cars.confirmDeleteVehicle')}</p>
              <p className="text-muted mb-0">
                {[deleteConfirm.mark, deleteConfirm.model, deleteConfirm.year].filter(Boolean).join(' ')}
                {deleteConfirm.vin && ` — ${deleteConfirm.vin}`}
              </p>
            </div>
            <div className="cars-modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>{t('common.cancel')}</button>
              <button className="btn btn-danger" onClick={handleDelete}>{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteConfirm && (
        <div className="cars-modal-overlay" onClick={() => setBulkDeleteConfirm(false)}>
          <div className="cars-modal cars-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="cars-modal-header">
              <h5>{t('bulk.bulkDelete')}</h5>
              <button className="cars-modal-close" onClick={() => setBulkDeleteConfirm(false)}>&times;</button>
            </div>
            <div className="cars-modal-body">
              <p>{t('bulk.confirmBulkDelete')}</p>
              <p className="text-muted mb-0">{selectedIds.size} {t('bulk.selected')} — {t('bulk.cannotUndo')}</p>
            </div>
            <div className="cars-modal-footer">
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

export default Cars;
