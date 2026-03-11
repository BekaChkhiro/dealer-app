import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import VinDisplay from '../components/VinDisplay';
import './Invoices.css';

function formatPrice(value) {
  if (value == null) return '—';
  return `$${Number(value).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function Invoices() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role === 'admin';

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    vehicle_id: '',
    invoice_type: '', // 'vehicle', 'transport', or ''
  });

  const [showFilters, setShowFilters] = useState(false);

  const fetchInvoices = () => {
    setLoading(true);
    const params = {
      page,
      limit,
      keyword,
      ...filters,
    };

    api.get('/vehicles/invoices/list', { params })
      .then((res) => {
        const d = res.data;
        setData(d.data || []);
        setTotal(d.total || 0);
      })
      .catch((err) => {
        console.error('Fetch invoices error:', err);
        setData([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, limit, keyword, filters]);

  const handleDownloadInvoice = async (vehicleId, type) => {
    try {
      setDownloadingId(`${vehicleId}-${type}`);
      const endpoint = type === 'vehicle'
        ? `/vehicles/${vehicleId}/invoice`
        : `/vehicles/${vehicleId}/invoice/transport`;

      const response = await api.get(endpoint, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${vehicleId}_${type}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download invoice error:', err);
      alert('Failed to download invoice. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchInvoices();
  };

  const handleResetFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
      vehicle_id: '',
      invoice_type: '',
    });
    setPage(1);
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const columns = [
    {
      label: 'VIN',
      key: 'vin',
      render: (row) => <VinDisplay vin={row.vin} />,
    },
    {
      label: t('invoices.vehicle'),
      key: 'vehicle_name',
    },
    {
      label: t('invoices.receiver'),
      key: 'receiver',
    },
    ...(isAdmin ? [{
      label: t('invoices.dealer'),
      key: 'dealer',
    }] : []),
    {
      label: t('invoices.purchaseDate'),
      key: 'purchase_date',
      render: (row) => formatDate(row.purchase_date),
    },
    {
      label: t('invoices.vehiclePrice'),
      key: 'vehicle_price',
      render: (row) => formatPrice(row.vehicle_price),
    },
    {
      label: t('invoices.total'),
      key: 'total_price',
      render: (row) => formatPrice(row.total_price),
    },
    {
      label: t('invoices.paid'),
      key: 'paid_amount',
      render: (row) => formatPrice(row.paid_amount),
    },
    {
      label: t('invoices.debt'),
      key: 'debt_amount',
      render: (row) => (
        <span style={{ color: row.debt_amount > 0 ? '#DC3545' : '#198754', fontWeight: 'bold' }}>
          {formatPrice(row.debt_amount)}
        </span>
      ),
    },
    {
      label: t('invoices.actions'),
      key: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => handleDownloadInvoice(row.id, 'vehicle')}
            disabled={downloadingId === `${row.id}-vehicle`}
            style={{ fontSize: '11px', padding: '4px 8px' }}
          >
            {downloadingId === `${row.id}-vehicle` ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {t('invoices.vehicleInvoice')}
              </>
            )}
          </button>
          <button
            className="btn btn-sm btn-success"
            onClick={() => handleDownloadInvoice(row.id, 'transport')}
            disabled={downloadingId === `${row.id}-transport`}
            style={{ fontSize: '11px', padding: '4px 8px' }}
          >
            {downloadingId === `${row.id}-transport` ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {t('invoices.transportInvoice')}
              </>
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h2 className="mb-4">{t('invoices.title')}</h2>

      {/* Action Buttons */}
      <div className="action-buttons-container mb-3">
        <div className="left-actions">
          <button
            className={`btn btn-outline-secondary btn-sm ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            {t('common.filters')}
            {activeFilterCount > 0 && <span className="badge bg-primary ms-2">{activeFilterCount}</span>}
          </button>
        </div>
        <div className="right-actions">
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder={t('common.search')}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: '250px' }}
          />
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel mb-3">
          <div className="row g-2">
            <div className="col-md-3">
              <label className="form-label">{t('filters.startDate')}</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">{t('filters.endDate')}</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">{t('invoices.invoiceType')}</label>
              <select
                className="form-select form-select-sm"
                value={filters.invoice_type}
                onChange={(e) => setFilters({ ...filters, invoice_type: e.target.value })}
              >
                <option value="">{t('common.all')}</option>
                <option value="vehicle">{t('invoices.vehicleInvoice')}</option>
                <option value="transport">{t('invoices.transportInvoice')}</option>
              </select>
            </div>
          </div>
          <div className="filter-actions mt-3">
            <button className="btn btn-primary btn-sm" onClick={handleApplyFilters}>
              {t('common.apply')}
            </button>
            <button className="btn btn-secondary btn-sm ms-2" onClick={handleResetFilters}>
              {t('common.reset')}
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data}
            emptyMessage={t('invoices.noInvoices')}
          />
          {total > 0 && (
            <Pagination
              page={page}
              limit={limit}
              total={total}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          )}
        </>
      )}
    </div>
  );
}

export default Invoices;
