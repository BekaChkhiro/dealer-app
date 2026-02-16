import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
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

  const hasDriverInfo = vehicle.driver_fullname || vehicle.driver_phone || vehicle.driver_car_license_number || vehicle.driver_company;

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
        {isAdmin && (
          <Link to="/cars" className="btn btn-sm btn-outline-primary">
            {t('common.edit')}
          </Link>
        )}
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
            <InfoItem label={t('cars.vin')} value={vehicle.vin} />
            <InfoItem label={t('cars.lotNumber')} value={vehicle.lot_number} />
            <InfoItem label={t('cars.auction')} value={vehicle.auction} />
            <InfoItem label={t('cars.vehicleType')} value={vehicle.vehicle_type} />
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
            {vehicle.is_hybrid && <span className="car-detail-badge active">{t('cars.isHybrid')}</span>}
            {vehicle.is_sublot && <span className="car-detail-badge active">{t('cars.isSublot')}</span>}
            {vehicle.has_key && <span className="car-detail-badge active">{t('cars.hasKey')}</span>}
            {vehicle.is_funded && <span className="car-detail-badge active">{t('cars.funded')}</span>}
            {vehicle.is_insured && <span className="car-detail-badge active">{t('cars.insured')}</span>}
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
          <div className="car-detail-card-title">{t('carDetail.dealerBuyer')}</div>
          <div className="car-detail-info-grid">
            <InfoItem label={t('cars.dealer')} value={[vehicle.dealer_name, vehicle.dealer_surname].filter(Boolean).join(' ') || vehicle.buyer} />
            <InfoItem label={t('users.email')} value={vehicle.dealer_email} />
            <InfoItem label={t('users.phone')} value={vehicle.dealer_phone} />
            <InfoItem label={t('cars.buyer')} value={vehicle.buyer} />
            <InfoItem label={t('cars.receiverFullname')} value={vehicle.receiver_fullname} />
            <InfoItem label={t('cars.receiverIdNumber')} value={vehicle.receiver_identity_number} />
            <InfoItem label={t('cars.receiverPhone')} value={vehicle.receiver_phone} />
            <InfoItem label={t('cars.buyerNumber')} value={vehicle.buyer_number} />
          </div>
        </div>

        <div className="car-detail-card">
          <div className="car-detail-card-title">{t('carDetail.shipping')}</div>
          <div className="car-detail-info-grid">
            <InfoItem label={t('cars.containerNumber')} value={vehicle.container_number} />
            <InfoItem label={t('cars.booking')} value={vehicle.booking} />
            <InfoItem label={t('cars.line')} value={vehicle.line} />
            <InfoItem label={t('cars.usState')} value={vehicle.us_state} />
            <InfoItem label={t('cars.usPort')} value={vehicle.us_port} />
            <InfoItem label={t('cars.destinationPort')} value={vehicle.destination_port} />
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
            <InfoItem label={t('cars.driverFullname')} value={vehicle.driver_fullname} />
            <InfoItem label={t('cars.driverPhone')} value={vehicle.driver_phone} />
            <InfoItem label={t('cars.driverLicenseNumber')} value={vehicle.driver_car_license_number} />
            <InfoItem label={t('cars.driverCompany')} value={vehicle.driver_company} />
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
                  <td>{bk.container || '—'}</td>
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
