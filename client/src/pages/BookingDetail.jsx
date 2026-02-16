import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import './BookingDetail.css';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function BookingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role === 'admin';

  const [booking, setBooking] = useState(null);
  const [relatedVehicle, setRelatedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBooking() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/booking/${id}`);
        const b = res.data.data;
        setBooking(b);

        // Fetch related vehicle if VIN exists
        if (b.vin) {
          try {
            const vRes = await api.get('/vehicles', { params: { keyword: b.vin, limit: 1 } });
            const vehicles = vRes.data.data || [];
            if (vehicles.length > 0) {
              setRelatedVehicle(vehicles[0]);
            }
          } catch {
            // Ignore - vehicle lookup is optional
          }
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setError('notFound');
        } else {
          setError('loadError');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchBooking();
  }, [id]);

  if (loading) {
    return (
      <div className="booking-detail-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="booking-detail-error">
        <h3>{error === 'notFound' ? t('bookingDetail.notFound') : t('bookingDetail.loadError')}</h3>
        <Link to="/booking" className="btn btn-primary">{t('bookingDetail.backToBooking')}</Link>
      </div>
    );
  }

  if (!booking) return null;

  const title = booking.booking_number || `Booking #${booking.id}`;

  // Shipping timeline steps
  const timelineSteps = [
    { key: 'container_loaded_date', label: t('bookingDetail.containerLoaded') },
    { key: 'estimated_arrival_date', label: t('bookingDetail.estArrival') },
    { key: 'container_receive_date', label: t('bookingDetail.containerReceived') },
    { key: 'est_opening_date', label: t('bookingDetail.estOpening') },
    { key: 'open_date', label: t('bookingDetail.opened') },
  ];

  let lastCompletedIdx = -1;
  timelineSteps.forEach((step, i) => {
    if (booking[step.key]) lastCompletedIdx = i;
  });

  return (
    <div>
      {/* Back link */}
      <Link to="/booking" className="booking-detail-back">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
        </svg>
        {t('bookingDetail.backToBooking')}
      </Link>

      {/* Title bar */}
      <div className="booking-detail-title-bar">
        <div className="booking-detail-title-left">
          <h2>{title}</h2>
        </div>
        {isAdmin && (
          <Link to="/booking" className="btn btn-sm btn-outline-primary">
            {t('common.edit')}
          </Link>
        )}
      </div>

      {/* Top row: 3 cards */}
      <div className="booking-detail-top-row">
        {/* Booking Info */}
        <div className="booking-detail-card">
          <div className="booking-detail-card-title">{t('bookingDetail.bookingInfo')}</div>
          <div className="booking-detail-info-grid">
            <InfoItem label={t('booking.bookingNumber')} value={booking.booking_number} />
            <InfoItem label={t('booking.vin')} value={booking.vin} />
            <InfoItem label={t('booking.buyer')} value={booking.buyer_fullname} />
            <InfoItem label={t('booking.line')} value={booking.line} />
            <InfoItem label={t('booking.lotNumber')} value={booking.lot_number} />
          </div>
        </div>

        {/* Container Info */}
        <div className="booking-detail-card">
          <div className="booking-detail-card-title">{t('bookingDetail.containerInfo')}</div>
          <div className="booking-detail-info-grid">
            <InfoItem label={t('booking.container')} value={booking.container} />
            <InfoItem label={t('booking.containerReceiver')} value={booking.container_receiver} />
            <InfoItem label={t('booking.loadingPort')} value={booking.loading_port} />
            <InfoItem label={t('booking.deliveryLocation')} value={booking.delivery_location} />
            <InfoItem label={t('booking.terminal')} value={booking.terminal} />
          </div>
        </div>

        {/* Status */}
        <div className="booking-detail-card">
          <div className="booking-detail-card-title">{t('bookingDetail.status')}</div>
          <div className="booking-detail-info-grid">
            <div className="booking-detail-info-item">
              <span className="booking-detail-info-label">{t('booking.bookingPaid')}</span>
              <span className={`booking-detail-badge booking-detail-badge-${booking.booking_paid ? 'yes' : 'no'}`}>
                {booking.booking_paid ? t('common.yes') : t('common.no')}
              </span>
            </div>
            <div className="booking-detail-info-item">
              <span className="booking-detail-info-label">{t('booking.containerReleased')}</span>
              <span className={`booking-detail-badge booking-detail-badge-${booking.container_released ? 'yes' : 'no'}`}>
                {booking.container_released ? t('common.yes') : t('common.no')}
              </span>
            </div>
            <InfoItem label={t('booking.carDetails')} value={booking.car_details} />
          </div>
        </div>
      </div>

      {/* Shipping Timeline */}
      <div className="booking-detail-card">
        <div className="booking-detail-card-title">{t('bookingDetail.shippingTimeline')}</div>
        <div className="booking-detail-timeline">
          {timelineSteps.map((step, i) => {
            const hasDate = !!booking[step.key];
            let stepClass = '';
            if (hasDate && i < lastCompletedIdx) stepClass = 'completed';
            else if (hasDate && i === lastCompletedIdx) stepClass = 'active';
            return (
              <div key={step.key} className={`booking-detail-timeline-step ${stepClass}`}>
                <div className="booking-detail-timeline-dot" />
                <div className="booking-detail-timeline-label">{step.label}</div>
                <div className="booking-detail-timeline-date">
                  {hasDate ? formatDate(booking[step.key]) : '—'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Related sections */}
      <div className="booking-detail-related-row">
        {/* Related Vehicle */}
        <div className="booking-detail-card">
          <div className="booking-detail-card-title">{t('bookingDetail.relatedVehicle')}</div>
          {relatedVehicle ? (
            <div>
              <div className="booking-detail-info-grid">
                <InfoItem label={t('cars.vehicleName')} value={relatedVehicle.vehicle_name || `${relatedVehicle.mark || ''} ${relatedVehicle.model || ''}`.trim()} />
                <InfoItem label={t('cars.vin')} value={relatedVehicle.vin} />
                <InfoItem label={t('cars.buyer')} value={relatedVehicle.buyer_fullname} />
                <InfoItem label={t('cars.status')} value={relatedVehicle.status} />
              </div>
              <Link to={`/cars/${relatedVehicle.id}`} className="booking-detail-related-link">
                {t('bookingDetail.viewVehicle')} &rarr;
              </Link>
            </div>
          ) : (
            <div className="booking-detail-empty">{t('bookingDetail.noVehicle')}</div>
          )}
        </div>

        {/* Related Boat */}
        <div className="booking-detail-card">
          <div className="booking-detail-card-title">{t('bookingDetail.relatedBoat')}</div>
          {booking.boat_id ? (
            <div>
              <div className="booking-detail-info-grid">
                <InfoItem label={t('boats.name')} value={booking.boat_name_full || booking.boat_name} />
                <InfoItem label={t('boats.identificationCode')} value={booking.boat_code} />
                <InfoItem label={t('boats.status')} value={booking.boat_status} />
              </div>
              <Link to={`/boats/${booking.boat_id}`} className="booking-detail-related-link">
                {t('bookingDetail.viewBoat')} &rarr;
              </Link>
            </div>
          ) : (
            <div className="booking-detail-empty">{t('bookingDetail.noBoat')}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="booking-detail-info-item">
      <span className="booking-detail-info-label">{label}</span>
      <span className="booking-detail-info-value">
        {value == null || value === '' ? '—' : value}
      </span>
    </div>
  );
}

export default BookingDetail;
