import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import VinDisplay from '../components/VinDisplay';
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

  // Container assembly (admin) state
  const [assignedVehicles, setAssignedVehicles] = useState([]);
  const [stateFilter, setStateFilter] = useState('');
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [availLoading, setAvailLoading] = useState(false);
  const [availSearched, setAvailSearched] = useState(false);
  const [selectedAvail, setSelectedAvail] = useState(new Set());
  const [assembleBusy, setAssembleBusy] = useState(false);

  async function loadAssignedVehicles() {
    try {
      const res = await api.get(`/containers/${id}/vehicles`);
      setAssignedVehicles(res.data.data || []);
    } catch (err) {
      console.error('Failed to load container vehicles:', err);
    }
  }

  async function loadAvailableVehicles() {
    try {
      setAvailLoading(true);
      const params = {};
      if (stateFilter.trim()) params.state = stateFilter.trim();
      const res = await api.get('/containers/available-vehicles', { params });
      setAvailableVehicles(res.data.data || []);
      setSelectedAvail(new Set());
      setAvailSearched(true);
    } catch (err) {
      console.error('Failed to load available vehicles:', err);
    } finally {
      setAvailLoading(false);
    }
  }

  function toggleAvail(vehicleId) {
    setSelectedAvail(prev => {
      const next = new Set(prev);
      if (next.has(vehicleId)) next.delete(vehicleId);
      else next.add(vehicleId);
      return next;
    });
  }

  async function handleAddSelected() {
    if (selectedAvail.size === 0) return;
    try {
      setAssembleBusy(true);
      await api.post(`/containers/${id}/vehicles`, { vehicle_ids: [...selectedAvail] });
      await Promise.all([loadAssignedVehicles(), loadAvailableVehicles()]);
    } catch (err) {
      console.error('Failed to assign vehicles:', err);
    } finally {
      setAssembleBusy(false);
    }
  }

  async function handleRemoveVehicle(vehicleId) {
    try {
      setAssembleBusy(true);
      await api.delete(`/containers/${id}/vehicles/${vehicleId}`);
      await loadAssignedVehicles();
      if (availSearched) await loadAvailableVehicles();
    } catch (err) {
      console.error('Failed to remove vehicle:', err);
    } finally {
      setAssembleBusy(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    // Reset secondary state before fetching so stale data from prior id is cleared
    setVehicles([]);
    setRelatedBooking(null);
    setAssignedVehicles([]);
    setAvailableVehicles([]);
    setSelectedAvail(new Set());
    setAvailSearched(false);
    setStateFilter('');
    if (isAdmin) loadAssignedVehicles();

    async function fetchContainer() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/containers/${id}`);
        if (ignore) return;
        const c = res.data.data;
        setContainer(c);

        const promises = [];

        // Fetch vehicles in this container by container_number
        if (c.container_number) {
          promises.push(
            api.get('/vehicles', { params: { keyword: c.container_number, limit: 100 } })
              .then(r => { if (!ignore) setVehicles(r.data.data || []); })
              .catch(() => {})
          );
        }

        // Fetch related booking
        if (c.booking) {
          promises.push(
            api.get('/booking', { params: { keyword: c.booking, limit: 1 } })
              .then(r => {
                if (ignore) return;
                const bookings = r.data.data || [];
                if (bookings.length > 0) setRelatedBooking(bookings[0]);
              })
              .catch(() => {})
          );
        }

        await Promise.all(promises);
      } catch (err) {
        if (ignore) return;
        if (err.response?.status === 404) {
          setError('notFound');
        } else if (err.response?.status === 403) {
          setError('forbidden');
        } else {
          setError('loadError');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchContainer();

    return () => { ignore = true; };
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
          <Link to={`/containers?edit=${id}`} className="btn btn-sm btn-outline-primary">
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
            <div className="container-detail-info-item">
              <span className="container-detail-info-label">{t('containers.vin')}</span>
              <VinDisplay vin={container.vin} className="container-detail-info-value" />
            </div>
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

      {/* Assemble container (admin only) */}
      {isAdmin && (
        <div className="container-detail-card">
          <div className="container-detail-card-title">{t('containerAssembly.assemble')}</div>

          {/* State filter */}
          <div className="container-assemble-filter">
            <input
              type="text"
              className="form-control"
              maxLength={2}
              style={{ maxWidth: '140px', textTransform: 'uppercase' }}
              placeholder={t('containerAssembly.filterByState')}
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === 'Enter') loadAvailableVehicles(); }}
            />
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={loadAvailableVehicles}
              disabled={availLoading}
            >
              {t('containerAssembly.filterByState')}
            </button>
          </div>

          {/* Available (unassigned) vehicles */}
          {availSearched && (
            availableVehicles.length === 0 ? (
              <div className="container-detail-empty">{t('containerAssembly.noAvailable')}</div>
            ) : (
              <>
                <table className="container-detail-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>{t('cars.vin')}</th>
                      <th>{t('cars.vehicleName')}</th>
                      <th>{t('cars.state')}</th>
                      <th>{t('cars.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableVehicles.map((v) => (
                      <tr key={v.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedAvail.has(v.id)}
                            onChange={() => toggleAvail(v.id)}
                          />
                        </td>
                        <td><VinDisplay vin={v.vin} /></td>
                        <td>{[v.mark, v.model, v.year].filter(Boolean).join(' ') || '—'}</td>
                        <td>{v.us_state || '—'}</td>
                        <td>{v.current_status?.replace('_', ' ') || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAddSelected}
                    disabled={selectedAvail.size === 0 || assembleBusy}
                  >
                    {t('containerAssembly.addSelected')}{selectedAvail.size > 0 ? ` (${selectedAvail.size})` : ''}
                  </button>
                </div>
              </>
            )
          )}

          {/* Currently assigned vehicles */}
          <div className="container-detail-card-title" style={{ marginTop: '1.25rem' }}>
            {t('containerDetail.vehiclesInContainer')}
          </div>
          {assignedVehicles.length === 0 ? (
            <div className="container-detail-empty">{t('containerDetail.noVehicles')}</div>
          ) : (
            <table className="container-detail-table">
              <thead>
                <tr>
                  <th>{t('cars.vin')}</th>
                  <th>{t('cars.vehicleName')}</th>
                  <th>{t('cars.status')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {assignedVehicles.map((v) => (
                  <tr key={v.id}>
                    <td><VinDisplay vin={v.vin} /></td>
                    <td>{[v.mark, v.model, v.year].filter(Boolean).join(' ') || '—'}</td>
                    <td>{v.current_status?.replace('_', ' ') || '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleRemoveVehicle(v.id)}
                        disabled={assembleBusy}
                      >
                        {t('containerAssembly.remove')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

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
                  <td><VinDisplay vin={v.vin} /></td>
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
