import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import VinDisplay from '../components/VinDisplay';
import './CarDetail.css';

function formatPrice(value) {
  if (value == null) return '—';
  return `$${Number(value).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function CarDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role === 'admin';

  const [vehicle, setVehicle] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentExpanded, setCommentExpanded] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [downloadingTransportInvoice, setDownloadingTransportInvoice] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState(null);

  useEffect(() => {
    async function fetchVehicle() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/vehicles/${id}`);
        const v = res.data.data;
        setVehicle(v);

        // Fetch related data using VIN
        if (v?.vin) {
          const [txRes, bkRes] = await Promise.all([
            api.get('/transactions', { params: { keyword: v.vin, limit: 100 } }).catch(() => ({ data: { data: [] } })),
            api.get('/booking', { params: { keyword: v.vin, limit: 100 } }).catch(() => ({ data: { data: [] } })),
          ]);
          setTransactions(txRes.data.data || []);
          setBookings(bkRes.data.data || []);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setError('notFound');
        } else if (err.response?.status === 403) {
          setError('forbidden');
        } else {
          setError('loadError');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchVehicle();
  }, [id]);

  // Fetch vehicle files
  useEffect(() => {
    async function fetchFiles() {
      try {
        const res = await api.get(`/vehicles/${id}/files`);
        setFiles(res.data.data || []);
      } catch (err) {
        console.error('Error fetching files:', err);
        setFiles([]);
      }
    }
    if (id) {
      fetchFiles();
    }
  }, [id]);

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Maximum size is 10MB');
      event.target.value = '';
      return;
    }

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post(`/vehicles/${id}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setFiles([res.data.data, ...files]);
        event.target.value = '';
        alert('File uploaded successfully');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      alert(err.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  // Handle file delete
  const handleFileDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      setDeletingFileId(fileId);
      await api.delete(`/vehicles/files/${fileId}`);
      setFiles(files.filter(f => f.id !== fileId));
      alert('File deleted successfully');
    } catch (err) {
      console.error('Error deleting file:', err);
      alert(err.response?.data?.message || 'Failed to delete file');
    } finally {
      setDeletingFileId(null);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    if (!fileType) return '📄';
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📕';
    if (fileType.includes('word')) return '📘';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    return '📄';
  };

  if (loading) {
    return (
      <div className="car-detail-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="car-detail-error">
        <h3>{error === 'notFound' ? t('carDetail.notFound') : error === 'forbidden' ? '403 Forbidden' : t('carDetail.loadError')}</h3>
        <p>{error === 'forbidden' ? 'You do not have permission to view this vehicle.' : ''}</p>
        <Link to="/cars" className="btn btn-primary">{t('carDetail.backToCars')}</Link>
      </div>
    );
  }

  if (!vehicle) return null;

  const vehicleName = [vehicle.mark, vehicle.model, vehicle.year].filter(Boolean).join(' ') || 'Vehicle';
  const statusBg = vehicle.status_color || (vehicle.current_status === 'arrived' ? '#198754' : vehicle.current_status === 'in_transit' ? '#ffc107' : '#6c757d');

  // Timeline steps
  const timelineSteps = [
    { key: 'purchase_date', label: t('carDetail.purchase') },
    { key: 'vehicle_pickup_date', label: t('carDetail.pickup') },
    { key: 'warehouse_receive_date', label: t('carDetail.warehouse') },
    { key: 'container_loading_date', label: t('carDetail.loading') },
    { key: 'estimated_receive_date', label: t('carDetail.estimated') },
    { key: 'receive_date', label: t('carDetail.received') },
    { key: 'container_open_date', label: t('carDetail.containerOpen') },
  ];

  // Find last completed step index
  let lastCompletedIdx = -1;
  timelineSteps.forEach((step, i) => {
    if (vehicle[step.key]) lastCompletedIdx = i;
  });

  const hasDriverInfo = vehicle.driver_fullname || vehicle.driver_phone || vehicle.driver_car_license_number || vehicle.driver_id_number || vehicle.driver_company;

  const handleCopyTrackingLink = () => {
    const trackingUrl = `${window.location.origin}/track/${vehicle.vin}`;
    navigator.clipboard.writeText(trackingUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const handleDownloadInvoice = async () => {
    try {
      setDownloadingInvoice(true);
      const response = await api.get(`/vehicles/${id}/invoice`, {
        responseType: 'blob'
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${vehicle.vin}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice. Please try again.');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const handleDownloadTransportInvoice = async () => {
    try {
      setDownloadingTransportInvoice(true);
      const response = await api.get(`/vehicles/${id}/invoice/transport`, {
        responseType: 'blob'
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transport_invoice_${vehicle.vin}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading transport invoice:', error);
      alert('Failed to download transportation invoice. Please try again.');
    } finally {
      setDownloadingTransportInvoice(false);
    }
  };

  return (
    <div>
      {/* Back link */}
      <Link to="/cars" className="car-detail-back">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
        </svg>
        {t('carDetail.backToCars')}
      </Link>

      {/* Title bar */}
      <div className="car-detail-title-bar">
        <h2>{vehicleName}</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {vehicle.vin && (
            <button
              onClick={handleCopyTrackingLink}
              className="btn btn-sm btn-outline-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {linkCopied ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.5 1a1.5 1.5 0 0 1 1.5 1.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 13.5v-11A1.5 1.5 0 0 1 2.5 1h11zm-11-1A2.5 2.5 0 0 0 0 2.5v11A2.5 2.5 0 0 0 2.5 16h11a2.5 2.5 0 0 0 2.5-2.5v-11A2.5 2.5 0 0 0 13.5 0h-11z"/>
                    <path d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z"/>
                  </svg>
                  Share Link
                </>
              )}
            </button>
          )}
          <button
            onClick={handleDownloadInvoice}
            disabled={downloadingInvoice}
            className="btn btn-sm btn-success"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {downloadingInvoice ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Generating...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                  <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                </svg>
                Vehicle Invoice
              </>
            )}
          </button>
          <button
            onClick={handleDownloadTransportInvoice}
            disabled={downloadingTransportInvoice}
            className="btn btn-sm btn-info"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {downloadingTransportInvoice ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Generating...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M0 3.5A1.5 1.5 0 0 1 1.5 2h9A1.5 1.5 0 0 1 12 3.5V5h1.02a1.5 1.5 0 0 1 1.17.563l1.481 1.85a1.5 1.5 0 0 1 .329.938V10.5a1.5 1.5 0 0 1-1.5 1.5H14a2 2 0 1 1-4 0H5a2 2 0 1 1-3.998-.085A1.5 1.5 0 0 1 0 10.5v-7zm1.294 7.456A1.999 1.999 0 0 1 4.732 11h5.536a2.01 2.01 0 0 1 .732-.732V3.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .294.456zM12 10a2 2 0 0 1 1.732 1h.768a.5.5 0 0 0 .5-.5V8.35a.5.5 0 0 0-.11-.312l-1.48-1.85A.5.5 0 0 0 13.02 6H12v4zm-9 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm9 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
                </svg>
                Transport Invoice
              </>
            )}
          </button>
          {isAdmin && (
            <Link to="/cars" className="btn btn-sm btn-outline-primary">
              {t('common.edit')}
            </Link>
          )}
        </div>
      </div>

      {/* Top row: Image + Vehicle Info + Financial */}
      <div className="car-detail-top-row">
        {/* Image */}
        <div className="car-detail-card car-detail-image-card">
          {vehicle.profile_image_url ? (
            <img src={vehicle.profile_image_url} alt={vehicleName} className="car-detail-image" />
          ) : (
            <div className="car-detail-image-placeholder">No Image</div>
          )}
        </div>

        {/* Vehicle Info */}
        <div className="car-detail-card">
          <div className="car-detail-card-title">{t('carDetail.vehicleInfo')}</div>
          <div className="car-detail-info-grid">
            <div className="car-detail-info-item">
              <span className="car-detail-info-label">{t('cars.vin')}</span>
              <VinDisplay vin={vehicle.vin} className="car-detail-info-value" />
            </div>
            <InfoItem label={t('cars.lotNumber')} value={vehicle.lot_number} />
            <InfoItem label={t('cars.auction')} value={vehicle.auction} />
            <InfoItem label={t('cars.vehicleType')} value={vehicle.vehicle_type} />
            <InfoItem label={t('cars.fuelType')} value={vehicle.fuel_type ? vehicle.fuel_type.replace('_', ' ') : null} />
            <InfoItem label={t('cars.docType')} value={vehicle.doc_type} />
            <div className="car-detail-info-item">
              <span className="car-detail-info-label">{t('cars.status')}</span>
              {vehicle.current_status ? (
                <span className="car-detail-status-badge" style={{ backgroundColor: statusBg }}>
                  {vehicle.current_status.replace('_', ' ')}
                </span>
              ) : (
                <span className="car-detail-info-value">—</span>
              )}
            </div>
          </div>
          {/* Boolean flags */}
          <div className="car-detail-badges" style={{ marginTop: 12 }}>
            {vehicle.fuel_type && <span className="car-detail-badge active">{vehicle.fuel_type.replace('_', ' ')}</span>}
            {vehicle.is_hybrid && <span className="car-detail-badge active">{t('cars.isHybrid')}</span>}
            {vehicle.is_sublot && <span className="car-detail-badge active">{t('cars.isSublot')}</span>}
            {vehicle.has_key && <span className="car-detail-badge active">{t('cars.hasKey')}</span>}
            {vehicle.is_funded && <span className="car-detail-badge active">{t('cars.funded')}</span>}
            {vehicle.is_insured && <span className="car-detail-badge active">{t('cars.insured')}</span>}
            {vehicle.insurance_type && vehicle.insurance_type !== 'none' && (
              <span className="car-detail-badge active">
                {vehicle.insurance_type === 'franchise' ? t('cars.insuranceTypeFranchise') : t('cars.insuranceTypeFull')}
              </span>
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="car-detail-card">
          <div className="car-detail-card-title">{t('carDetail.financialSummary')}</div>
          <div className="car-detail-info-grid">
            <InfoItem label={t('cars.vehiclePrice')} value={formatPrice(vehicle.vehicle_price)} />
            <InfoItem label={t('cars.totalPrice')} value={formatPrice(vehicle.total_price)} className="car-detail-amount-total" />
            <InfoItem label={t('cars.paidAmount')} value={formatPrice(vehicle.payed_amount)} className="car-detail-amount-paid" />
            <InfoItem label={t('cars.debtAmount')} value={formatPrice(vehicle.debt_amount)} className={Number(vehicle.debt_amount) > 0 ? 'car-detail-amount-debt' : ''} />
            <InfoItem label={t('cars.containerCost')} value={formatPrice(vehicle.container_cost)} />
            <InfoItem label={t('cars.landingCost')} value={formatPrice(vehicle.landing_cost)} />
            <InfoItem label={t('cars.dealerFee')} value={formatPrice(vehicle.dealer_fee)} />
            <InfoItem label={t('cars.lateCarPayment')} value={formatPrice(vehicle.late_car_payment)} />
          </div>
          {/* Payment status badges */}
          <div className="car-detail-badges" style={{ marginTop: 12 }}>
            {vehicle.is_fully_paid && <span className="car-detail-badge active">{t('cars.fullyPaid')}</span>}
            {vehicle.is_partially_paid && <span className="car-detail-badge active">{t('cars.partiallyPaid')}</span>}
          </div>
        </div>
      </div>

      {/* Two-column: Dealer/Buyer + Shipping */}
      <div className="car-detail-two-col">
        <div className="car-detail-card">
          <div className="car-detail-card-title">{t('carDetail.dealerReceiver')}</div>
          <div className="car-detail-info-grid">
            <InfoItem label={t('cars.dealer')} value={[vehicle.dealer_name, vehicle.dealer_surname].filter(Boolean).join(' ')} className="uppercase" />
            <InfoItem label={t('users.email')} value={vehicle.dealer_email} />
            <InfoItem label={t('users.phone')} value={vehicle.dealer_phone} />
            <InfoItem label={t('cars.receiverFullname')} value={vehicle.receiver_fullname} className="uppercase" />
            <InfoItem label={t('cars.receiverIdNumber')} value={vehicle.receiver_identity_number} />
            <InfoItem label={t('cars.receiverPhone')} value={vehicle.receiver_phone} />
          </div>
        </div>

        <div className="car-detail-card">
          <div className="car-detail-card-title">{t('carDetail.shipping')}</div>
          <div className="car-detail-info-grid">
            <InfoItem
              label={t('cars.containerNumber')}
              value={
                vehicle.container_number && vehicle.container_id ? (
                  <Link
                    to={`/containers/${vehicle.container_id}`}
                    style={{
                      color: '#0D6EFD',
                      textDecoration: 'none',
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                  >
                    {vehicle.container_number}
                  </Link>
                ) : (
                  vehicle.container_number
                )
              }
            />
            <InfoItem label={t('cars.line')} value={vehicle.line} />
            <InfoItem label={t('cars.usState')} value={vehicle.us_state} />
            <InfoItem label={t('cars.usPort')} value={vehicle.us_port} />
            <InfoItem label={t('cars.destinationPort')} value={vehicle.destination_port_name || vehicle.destination_port} />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="car-detail-card">
        <div className="car-detail-card-title">{t('carDetail.timeline')}</div>
        <div className="car-detail-timeline">
          {timelineSteps.map((step, i) => {
            const hasDate = !!vehicle[step.key];
            let stepClass = '';
            if (hasDate && i < lastCompletedIdx) stepClass = 'completed';
            else if (hasDate && i === lastCompletedIdx) stepClass = 'active';
            return (
              <div key={step.key} className={`car-detail-timeline-step ${stepClass}`}>
                <div className="car-detail-timeline-dot" />
                <div className="car-detail-timeline-label">{step.label}</div>
                <div className="car-detail-timeline-date">
                  {hasDate ? formatDate(vehicle[step.key]) : '—'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Driver Info (conditional) */}
      {hasDriverInfo && (
        <div className="car-detail-card">
          <div className="car-detail-card-title">{t('carDetail.driverInfo')}</div>
          <div className="car-detail-info-grid">
            <InfoItem label={t('cars.driverFullname')} value={vehicle.driver_fullname} className="uppercase" />
            <InfoItem label={t('cars.driverPhone')} value={vehicle.driver_phone} />
            <InfoItem label={t('cars.driverIdNumber')} value={vehicle.driver_id_number} className="uppercase" />
            <InfoItem label={t('cars.driverLicenseNumber')} value={vehicle.driver_car_license_number} />
            <InfoItem label={t('cars.driverCompany')} value={vehicle.driver_company} />
          </div>
        </div>
      )}

      {/* Comment (conditional) */}
      {vehicle.comment && (
        <div className="car-detail-card">
          <div className="car-detail-card-title">{t('carDetail.comment')}</div>
          <div className={`car-detail-comment ${commentExpanded ? 'expanded' : ''}`}>
            <p className="car-detail-comment-text">
              {commentExpanded || vehicle.comment.length <= 200
                ? vehicle.comment
                : `${vehicle.comment.substring(0, 200)}...`}
            </p>
            {vehicle.comment.length > 200 && (
              <button
                type="button"
                className="car-detail-comment-toggle"
                onClick={() => setCommentExpanded(!commentExpanded)}
              >
                {commentExpanded ? t('carDetail.showLess') : t('carDetail.showMore')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Related Transactions */}
      <div className="car-detail-card">
        <div className="car-detail-card-title">{t('carDetail.relatedTransactions')}</div>
        {transactions.length === 0 ? (
          <div className="car-detail-empty">{t('carDetail.noTransactions')}</div>
        ) : (
          <table className="car-detail-table">
            <thead>
              <tr>
                <th>{t('transactions.date')}</th>
                <th className="text-right">{t('transactions.amount')}</th>
                <th>{t('transactions.paymentType')}</th>
                <th>{t('transactions.payer')}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{formatDate(tx.create_date)}</td>
                  <td className="text-right">{formatPrice(tx.paid_amount)}</td>
                  <td>{tx.payment_type?.replace('_', ' ') || '—'}</td>
                  <td>{tx.payer || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Related Booking */}
      <div className="car-detail-card">
        <div className="car-detail-card-title">{t('carDetail.relatedBooking')}</div>
        {bookings.length === 0 ? (
          <div className="car-detail-empty">{t('carDetail.noBooking')}</div>
        ) : (
          <table className="car-detail-table">
            <thead>
              <tr>
                <th>{t('booking.bookingNumber')}</th>
                <th>{t('booking.container')}</th>
                <th>{t('booking.line')}</th>
                <th>{t('booking.loadingPort')}</th>
                <th>{t('booking.deliveryLocation')}</th>
                <th>{t('booking.containerLoadedDate')}</th>
                <th>{t('booking.containerReceiveDate')}</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((bk) => (
                <tr key={bk.id}>
                  <td>{bk.booking_number || '—'}</td>
                  <td>
                    {bk.container && bk.container_id ? (
                      <Link
                        to={`/containers/${bk.container_id}`}
                        style={{
                          color: '#0D6EFD',
                          textDecoration: 'none',
                          fontWeight: 500,
                        }}
                        onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                      >
                        {bk.container}
                      </Link>
                    ) : (
                      bk.container || '—'
                    )}
                  </td>
                  <td>{bk.line || '—'}</td>
                  <td>{bk.loading_port || '—'}</td>
                  <td>{bk.delivery_location || '—'}</td>
                  <td>{formatDate(bk.container_loaded_date)}</td>
                  <td>{formatDate(bk.container_receive_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Vehicle Files */}
      <div className="car-detail-card">
        <div className="car-detail-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Vehicle Files & Documents</span>
          {(isAdmin || vehicle?.dealer_id === user?.id) && (
            <div>
              <input
                type="file"
                id="file-upload"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
                disabled={uploadingFile}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
              />
              <label
                htmlFor="file-upload"
                className="btn btn-sm btn-primary"
                style={{
                  cursor: uploadingFile ? 'not-allowed' : 'pointer',
                  opacity: uploadingFile ? 0.6 : 1,
                  marginBottom: 0
                }}
              >
                {uploadingFile ? 'Uploading...' : '+ Upload File'}
              </label>
            </div>
          )}
        </div>
        {files.length === 0 ? (
          <div className="car-detail-empty">
            No files uploaded yet
            {(isAdmin || vehicle?.dealer_id === user?.id) && (
              <div style={{ marginTop: '8px', fontSize: '0.9em', color: '#6C757D' }}>
                Upload documents like invoices, receipts, shipping papers, etc.
              </div>
            )}
          </div>
        ) : (
          <table className="car-detail-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>Type</th>
                <th>File Name</th>
                <th style={{ width: '100px' }}>Size</th>
                <th style={{ width: '150px' }}>Uploaded By</th>
                <th style={{ width: '120px' }}>Date</th>
                <th style={{ width: '150px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id}>
                  <td style={{ fontSize: '1.5em', textAlign: 'center' }}>
                    {getFileIcon(file.file_type)}
                  </td>
                  <td>
                    <div style={{
                      maxWidth: '300px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {file.file_name}
                    </div>
                  </td>
                  <td>{formatFileSize(file.file_size)}</td>
                  <td>{file.uploader_name || '—'}</td>
                  <td>{formatDate(file.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-primary"
                        style={{ fontSize: '0.85em', padding: '4px 12px' }}
                      >
                        View
                      </a>
                      <a
                        href={file.file_url}
                        download={file.file_name}
                        className="btn btn-sm btn-outline-secondary"
                        style={{ fontSize: '0.85em', padding: '4px 12px' }}
                      >
                        Download
                      </a>
                      {(isAdmin || vehicle?.dealer_id === user?.id) && (
                        <button
                          onClick={() => handleFileDelete(file.id)}
                          disabled={deletingFileId === file.id}
                          className="btn btn-sm btn-outline-danger"
                          style={{ fontSize: '0.85em', padding: '4px 12px' }}
                        >
                          {deletingFileId === file.id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{
          marginTop: '12px',
          fontSize: '0.85em',
          color: '#6C757D',
          borderTop: '1px solid #DEE2E6',
          paddingTop: '12px'
        }}>
          <strong>Allowed file types:</strong> PDF, Word (.doc, .docx), Excel (.xls, .xlsx), Images (.jpg, .png, .gif)
          <br />
          <strong>Maximum file size:</strong> 10 MB
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, className }) {
  return (
    <div className="car-detail-info-item">
      <span className="car-detail-info-label">{label}</span>
      <span className={`car-detail-info-value ${className || ''}`}>
        {value == null || value === '' ? '—' : value}
      </span>
    </div>
  );
}

export default CarDetail;
