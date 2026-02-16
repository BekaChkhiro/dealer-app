import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import './ContainerDetail.css';

const STATUS_KEYS = {
  booked: 'containers.booked',
  in_transit: 'containers.inTransit',
  arrived: 'containers.arrived',
  delivered: 'containers.delivered',
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function ContainerDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role === 'admin';

  const [container, setContainer] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [relatedBooking, setRelatedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchContainer() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/containers/${id}`);
        const c = res.data.data;
        setContainer(c);

        const promises = [];

        // Fetch vehicles in this container by container_number
        if (c.container_number) {
          promises.push(
            api.get('/vehicles', { params: { keyword: c.container_number, limit: 100 } })
              .then(r => setVehicles(r.data.data || []))
              .catch(() => {})
          );
        }

        // Fetch related booking
        if (c.booking) {
          promises.push(
            api.get('/booking', { params: { keyword: c.booking, limit: 1 } })
              .then(r => {
                const bookings = r.data.data || [];
                if (bookings.length > 0) setRelatedBooking(bookings[0]);
              })
              .catch(() => {})
          );
        }

        await Promise.all(promises);
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
    fetchContainer();
  }, [id]);

  if (loading) {
    return (
      <div className="container-detail-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-detail-error">
        <h3>
          {error === 'notFound' ? t('containerDetail.notFound')
            : error === 'forbidden' ? '403 Forbidden'
            : t('containerDetail.loadError')}
        </h3>
        <Link to="/containers" className="btn btn-primary">{t('containerDetail.backToContainers')}</Link>
      </div>
    );
  }

  if (!container) return null;

  const title = container.container_number || `Container #${container.id}`;
  const statusLabel = STATUS_KEYS[container.status] ? t(STATUS_KEYS[container.status]) : (container.status || '—');
  const vehicleName = [container.manufacturer, container.model, container.manufacturer_year].filter(Boolean).join(' ');

  // Timeline steps
  const timelineSteps = [
    { key: 'purchase_date', label: t('containerDetail.booked') },
    { key: 'container_loaded_date', label: t('containerDetail.loaded') },
    { key: 'container_receive_date', label: t('containerDetail.received') },
    { key: 'container_open_date', label: t('containerDetail.opened') },
  ];

  let lastCompletedIdx = -1;
  timelineSteps.forEach((step, i) => {
    if (container[step.key]) lastCompletedIdx = i;
  });

  return (
    <div>
      {/* Back link */}
      <Link to="/containers" className="container-detail-back">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
        </svg>
        {t('containerDetail.backToContainers')}
      </Link>

      {/* Title bar */}
      <div className="container-detail-title-bar">
        <div className="container-detail-title-left">
          <h2>{title}</h2>
          <span className={`container-detail-status-badge container-detail-status-${container.status}`}>
            {statusLabel}
          </span>
        </div>
        {isAdmin && (
          <Link to="/containers" className="btn btn-sm btn-outline-primary">
            {t('common.edit')}
          </Link>
        )}
      </div>

      {/* Top row: Container Info + Shipping Route */}
      <div className="container-detail-top-row">
        {/* Container Info */}
        <div className="container-detail-card">
          <div className="container-detail-card-title">{t('containerDetail.containerInfo')}</div>
          <div className="container-detail-info-grid">
            <InfoItem label={t('containers.containerNumber')} value={container.container_number} />
            <InfoItem label={t('containers.vin')} value={container.vin} />
            <InfoItem label={t('containers.buyer')} value={container.buyer_name} />
            <InfoItem label={t('containers.personalNumber')} value={container.personal_number} />
            <InfoItem label={t('containers.vehicleName')} value={vehicleName} />
            <InfoItem label={t('containers.lotStock')} value={container.lot_number} />
            <InfoItem label={t('containers.booking')} value={container.booking} />
            <InfoItem label={t('containers.status')} value={statusLabel} />
          </div>
        </div>

        {/* Shipping Route */}
        <div className="container-detail-card">
          <div className="container-detail-card-title">{t('containerDetail.shippingRoute')}</div>
          <div className="container-detail-info-grid">
            <InfoItem label={t('containers.loadingPort')} value={container.loading_port} />
            <InfoItem label={t('containers.deliveryLocation')} value={container.delivery_location} />
            <InfoItem label={t('containers.lines')} value={container.line} />
            <InfoItem label={t('containers.containerLoadedDate')} value={formatDate(container.container_loaded_date)} />
            <InfoItem label={t('containers.containerReceiveDate')} value={formatDate(container.container_receive_date)} />
            <InfoItem label={t('containers.containerOpenDate')} value={formatDate(container.container_open_date)} />
          </div>
          {/* Boat info */}
          {(container.boat_name || container.boat_name_full) && (
            <div className="container-detail-boat-info">
              <InfoItem label={t('containerDetail.boatName')} value={container.boat_name_full || container.boat_name} />
              {container.boat_code && (
                <InfoItem label={t('boats.identificationCode')} value={container.boat_code} />
              )}
              {container.boat_id && (
                <Link to={`/boats/${container.boat_id}`} className="container-detail-related-link">
                  {t('containerDetail.viewBoat')} &rarr;
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="container-detail-card">
        <div className="container-detail-card-title">{t('containerDetail.timeline')}</div>
        <div className="container-detail-timeline">
          {timelineSteps.map((step, i) => {
            const hasDate = !!container[step.key];
            let stepClass = '';
            if (hasDate && i < lastCompletedIdx) stepClass = 'completed';
            else if (hasDate && i === lastCompletedIdx) stepClass = 'active';
            return (
              <div key={step.key} className={`container-detail-timeline-step ${stepClass}`}>
                <div className="container-detail-timeline-dot" />
                <div className="container-detail-timeline-label">{step.label}</div>
                <div className="container-detail-timeline-date">
                  {hasDate ? formatDate(container[step.key]) : '—'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vehicles in this container */}
      <div className="container-detail-card">
        <div className="container-detail-card-title">{t('containerDetail.vehiclesInContainer')}</div>
        {vehicles.length === 0 ? (
          <div className="container-detail-empty">{t('containerDetail.noVehicles')}</div>
        ) : (
          <table className="container-detail-table">
            <thead>
              <tr>
                <th>{t('cars.vin')}</th>
                <th>{t('cars.vehicleName')}</th>
                <th>{t('cars.buyer')}</th>
                <th>{t('cars.status')}</th>
                <th>{t('cars.purchaseDate')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td>{v.vin || '—'}</td>
                  <td>{[v.mark, v.model, v.year].filter(Boolean).join(' ') || '—'}</td>
                  <td>{v.buyer || '—'}</td>
                  <td>{v.current_status?.replace('_', ' ') || '—'}</td>
                  <td>{formatDate(v.purchase_date)}</td>
                  <td>
                    <Link to={`/cars/${v.id}`} className="container-detail-related-link">
                      {t('containerDetail.view')} &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Related Booking */}
      <div className="container-detail-card">
        <div className="container-detail-card-title">{t('containerDetail.relatedBooking')}</div>
        {relatedBooking ? (
          <div>
            <div className="container-detail-info-grid">
              <InfoItem label={t('booking.bookingNumber')} value={relatedBooking.booking_number} />
              <InfoItem label={t('booking.line')} value={relatedBooking.line} />
              <InfoItem label={t('booking.loadingPort')} value={relatedBooking.loading_port} />
              <InfoItem label={t('booking.deliveryLocation')} value={relatedBooking.delivery_location} />
            </div>
            <Link to={`/booking/${relatedBooking.id}`} className="container-detail-related-link">
              {t('containerDetail.viewBooking')} &rarr;
            </Link>
          </div>
        ) : (
          <div className="container-detail-empty">{t('containerDetail.noBooking')}</div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="container-detail-info-item">
      <span className="container-detail-info-label">{label}</span>
      <span className="container-detail-info-value">
        {value == null || value === '' ? '—' : value}
      </span>
    </div>
  );
}

export default ContainerDetail;
