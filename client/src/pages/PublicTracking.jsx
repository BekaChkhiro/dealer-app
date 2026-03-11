import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import VinDisplay from '../components/VinDisplay';
import './PublicTracking.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function PublicTracking() {
  const { vin } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchVehicle() {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`${API_BASE_URL}/public/track/${vin}`);
        setVehicle(res.data.data);
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
    if (vin) {
      fetchVehicle();
    }
  }, [vin]);

  if (loading) {
    return (
      <div className="public-tracking">
        <div className="public-tracking-container">
          <div className="public-tracking-loading">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading vehicle information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-tracking">
        <div className="public-tracking-container">
          <div className="public-tracking-error">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h3>{error === 'notFound' ? 'Vehicle Not Found' : 'Unable to Load Vehicle'}</h3>
            <p>{error === 'notFound' ? 'We could not find a vehicle with this VIN.' : 'Please try again later.'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!vehicle) return null;

  const vehicleName = [vehicle.mark, vehicle.model, vehicle.year].filter(Boolean).join(' ') || 'Vehicle';
  const statusBg = vehicle.status_color || (vehicle.current_status === 'arrived' ? '#198754' : vehicle.current_status === 'in_transit' ? '#ffc107' : '#6c757d');

  // Timeline steps
  const timelineSteps = [
    { key: 'purchase_date', label: 'Purchased', icon: '🏷️' },
    { key: 'vehicle_pickup_date', label: 'Picked Up', icon: '🚗' },
    { key: 'warehouse_receive_date', label: 'At Warehouse', icon: '🏭' },
    { key: 'container_loading_date', label: 'Loaded in Container', icon: '📦' },
    { key: 'estimated_receive_date', label: 'Estimated Arrival', icon: '📅' },
    { key: 'receive_date', label: 'Received at Port', icon: '⚓' },
    { key: 'container_open_date', label: 'Container Opened', icon: '🔓' },
  ];

  // Find last completed step index
  let lastCompletedIdx = -1;
  timelineSteps.forEach((step, i) => {
    if (vehicle[step.key]) lastCompletedIdx = i;
  });

  return (
    <div className="public-tracking">
      {/* Header */}
      <div className="public-tracking-header">
        <div className="public-tracking-logo">
          <h1>Dealer App</h1>
          <p>Vehicle Tracking</p>
        </div>
      </div>

      <div className="public-tracking-container">
        {/* Title */}
        <div className="public-tracking-title">
          <h2>{vehicleName}</h2>
          <div className="public-tracking-status" style={{ backgroundColor: statusBg }}>
            {vehicle.current_status?.replace('_', ' ') || 'Unknown'}
          </div>
        </div>

        {/* Main Content */}
        <div className="public-tracking-content">
          {/* Vehicle Image */}
          {vehicle.profile_image_url && (
            <div className="public-tracking-image-card">
              <img src={vehicle.profile_image_url} alt={vehicleName} />
            </div>
          )}

          {/* Vehicle Info */}
          <div className="public-tracking-card">
            <h3>Vehicle Information</h3>
            <div className="public-tracking-info-grid">
              <InfoItem label="VIN">
                <VinDisplay vin={vehicle.vin} />
              </InfoItem>
              <InfoItem label="Lot Number" value={vehicle.lot_number} />
              <InfoItem label="Auction" value={vehicle.auction} />
              <InfoItem label="Vehicle Type" value={vehicle.vehicle_type} />
              <InfoItem label="Fuel Type" value={vehicle.fuel_type?.replace('_', ' ')} />
              <InfoItem label="Doc Type" value={vehicle.doc_type} />
            </div>
          </div>

          {/* Shipping Info */}
          <div className="public-tracking-card">
            <h3>Shipping Information</h3>
            <div className="public-tracking-info-grid">
              <InfoItem label="Container Number" value={vehicle.container_number} />
              <InfoItem label="Line" value={vehicle.line} />
              <InfoItem label="From" value={[vehicle.us_state, vehicle.us_port].filter(Boolean).join(', ')} />
              <InfoItem label="To" value={vehicle.destination_port_name || vehicle.destination_port} />
            </div>
          </div>

          {/* Receiver Info */}
          {vehicle.receiver_fullname && (
            <div className="public-tracking-card">
              <h3>Receiver</h3>
              <div className="public-tracking-receiver">
                {vehicle.receiver_fullname}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="public-tracking-card public-tracking-timeline-card">
            <h3>Shipping Timeline</h3>
            <div className="public-tracking-timeline">
              {timelineSteps.map((step, i) => {
                const hasDate = !!vehicle[step.key];
                let stepClass = '';
                if (hasDate && i < lastCompletedIdx) stepClass = 'completed';
                else if (hasDate && i === lastCompletedIdx) stepClass = 'active';
                return (
                  <div key={step.key} className={`public-tracking-timeline-step ${stepClass}`}>
                    <div className="public-tracking-timeline-icon">{step.icon}</div>
                    <div className="public-tracking-timeline-content">
                      <div className="public-tracking-timeline-label">{step.label}</div>
                      <div className="public-tracking-timeline-date">
                        {hasDate ? formatDate(vehicle[step.key]) : 'Pending'}
                      </div>
                    </div>
                    {i < timelineSteps.length - 1 && <div className="public-tracking-timeline-line" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="public-tracking-footer">
          <p>For more information, please contact your dealer.</p>
          <p className="public-tracking-footer-note">
            This is a limited public view. Financial information is not displayed.
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, children }) {
  return (
    <div className="public-tracking-info-item">
      <span className="public-tracking-info-label">{label}</span>
      <span className="public-tracking-info-value">
        {children || (value == null || value === '' ? '—' : value)}
      </span>
    </div>
  );
}

export default PublicTracking;
