import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import './BoatDetail.css';

const STATUS_KEYS = {
  us_port: 'boats.usPort',
  in_transit: 'boats.inTransit',
  arrived: 'boats.arrived',
  delivered: 'boats.delivered',
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function BoatDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role === 'admin';

  const [boat, setBoat] = useState(null);
  const [containers, setContainers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBoat() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/boats/${id}`);
        const b = res.data.data;
        setBoat(b);

        const [ctRes, bkRes] = await Promise.all([
          api.get('/containers', { params: { boat_id: id, limit: 100 } }).catch(() => ({ data: { data: [] } })),
          api.get('/booking', { params: { boat_id: id, limit: 100 } }).catch(() => ({ data: { data: [] } })),
        ]);
        setContainers(ctRes.data.data || []);
        setBookings(bkRes.data.data || []);
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
    fetchBoat();
  }, [id]);

  if (loading) {
    return (
      <div className="boat-detail-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="boat-detail-error">
        <h3>{error === 'notFound' ? t('boatDetail.notFound') : t('boatDetail.loadError')}</h3>
        <Link to="/boats" className="btn btn-primary">{t('boatDetail.backToBoats')}</Link>
      </div>
    );
  }

  if (!boat) return null;

  const boatName = boat.name || 'Boat';
  const statusLabel = STATUS_KEYS[boat.status] ? t(STATUS_KEYS[boat.status]) : (boat.status || '—');

  // Voyage timeline steps
  const timelineSteps = [
    { key: 'departure_date', label: t('boatDetail.departure') },
    { key: 'estimated_arrival_date', label: t('boatDetail.estArrival') },
    { key: 'arrival_date', label: t('boatDetail.arrival') },
  ];

  let lastCompletedIdx = -1;
  timelineSteps.forEach((step, i) => {
    if (boat[step.key]) lastCompletedIdx = i;
  });

  return (
    <div>
      {/* Back link */}
      <Link to="/boats" className="boat-detail-back">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
        </svg>
        {t('boatDetail.backToBoats')}
      </Link>

      {/* Title bar */}
      <div className="boat-detail-title-bar">
        <div className="boat-detail-title-left">
          <h2>{boatName}</h2>
          <span className={`boat-detail-status-badge boat-detail-status-${boat.status}`}>
            {statusLabel}
          </span>
        </div>
        {isAdmin && (
          <Link to="/boats" className="btn btn-sm btn-outline-primary">
            {t('common.edit')}
          </Link>
        )}
      </div>

      {/* Top row: Boat Info + Voyage Timeline */}
      <div className="boat-detail-top-row">
        {/* Boat Info */}
        <div className="boat-detail-card">
          <div className="boat-detail-card-title">{t('boatDetail.boatInfo')}</div>
          <div className="boat-detail-info-grid">
            <InfoItem label={t('boats.name')} value={boat.name} />
            <InfoItem label={t('boats.identificationCode')} value={boat.identification_code} />
            <InfoItem label={t('boats.status')} value={statusLabel} />
            <InfoItem label={t('boats.estDepartureDate')} value={formatDate(boat.departure_date)} />
            <InfoItem label={t('boats.estArrivalDate')} value={formatDate(boat.estimated_arrival_date)} />
            <InfoItem label={t('boats.arrivalDate')} value={formatDate(boat.arrival_date)} />
          </div>
        </div>

        {/* Voyage Timeline */}
        <div className="boat-detail-card">
          <div className="boat-detail-card-title">{t('boatDetail.voyageTimeline')}</div>
          <div className="boat-detail-timeline">
            {timelineSteps.map((step, i) => {
              const hasDate = !!boat[step.key];
              let stepClass = '';
              if (hasDate && i < lastCompletedIdx) stepClass = 'completed';
              else if (hasDate && i === lastCompletedIdx) stepClass = 'active';
              return (
                <div key={step.key} className={`boat-detail-timeline-step ${stepClass}`}>
                  <div className="boat-detail-timeline-dot" />
                  <div className="boat-detail-timeline-label">{step.label}</div>
                  <div className="boat-detail-timeline-date">
                    {hasDate ? formatDate(boat[step.key]) : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Related Containers */}
      <div className="boat-detail-card">
        <div className="boat-detail-card-title">{t('boatDetail.relatedContainers')}</div>
        {containers.length === 0 ? (
          <div className="boat-detail-empty">{t('boatDetail.noContainers')}</div>
        ) : (
          <table className="boat-detail-table">
            <thead>
              <tr>
                <th>{t('containers.containerNumber')}</th>
                <th>{t('containers.vin')}</th>
                <th>{t('containers.buyer')}</th>
                <th>{t('containers.booking')}</th>
                <th>{t('containers.deliveryLocation')}</th>
                <th>{t('containers.status')}</th>
              </tr>
            </thead>
            <tbody>
              {containers.map((ct) => (
                <tr key={ct.id}>
                  <td>{ct.container_number || '—'}</td>
                  <td>{ct.vin || '—'}</td>
                  <td>{ct.buyer_name || '—'}</td>
                  <td>{ct.booking || '—'}</td>
                  <td>{ct.delivery_location || '—'}</td>
                  <td>{ct.status || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Related Bookings */}
      <div className="boat-detail-card">
        <div className="boat-detail-card-title">{t('boatDetail.relatedBookings')}</div>
        {bookings.length === 0 ? (
          <div className="boat-detail-empty">{t('boatDetail.noBookings')}</div>
        ) : (
          <table className="boat-detail-table">
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

function InfoItem({ label, value }) {
  return (
    <div className="boat-detail-info-item">
      <span className="boat-detail-info-label">{label}</span>
      <span className="boat-detail-info-value">
        {value == null || value === '' ? '—' : value}
      </span>
    </div>
  );
}

export default BoatDetail;
