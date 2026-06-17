import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';
import './PublicCalculator.css';

function formatUSD(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '$0';
  return '$' + num.toLocaleString('en-US');
}

// distinct preserving first-seen order
function uniq(arr) {
  return Array.from(new Set(arr));
}
const locKey = (city, state) => `${city}|${state || ''}`;

function PublicCalculator() {
  const { t } = useTranslation();

  // Full priced matrix from the backend (rows: auction, city, state, port,
  // destination, land_price, container_price, total_price). The dropdowns
  // cascade off this so every full selection maps to a real priced row.
  const [matrix, setMatrix] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState(false);

  // Form state — location stored as composite "city|state"
  const [auction, setAuction] = useState('');
  const [location, setLocation] = useState('');
  const [port, setPort] = useState('');
  const [destination, setDestination] = useState('');

  // ---- Fetch the full matrix on mount (ignore-flag pattern) --------
  useEffect(() => {
    let ignore = false;
    setOptionsLoading(true);
    setOptionsError(false);

    api.get('/public/calculator/matrix')
      .then(res => {
        if (ignore) return;
        const rows = Array.isArray(res.data?.data) ? res.data.data : [];
        setMatrix(rows);
      })
      .catch(() => {
        if (!ignore) setOptionsError(true);
      })
      .finally(() => {
        if (!ignore) setOptionsLoading(false);
      });

    return () => { ignore = true; };
  }, []);

  // ---- Cascading option lists derived from the matrix --------
  const auctions = useMemo(() => uniq(matrix.map(r => r.auction)).sort(), [matrix]);

  const locations = useMemo(() => {
    const seen = new Map();
    for (const r of matrix) {
      if (r.auction !== auction) continue;
      const k = locKey(r.city, r.state);
      if (!seen.has(k)) seen.set(k, { city: r.city, state: r.state });
    }
    return Array.from(seen.values()).sort((a, b) =>
      (a.city + a.state).localeCompare(b.city + b.state));
  }, [matrix, auction]);

  const ports = useMemo(() => {
    if (!auction || !location) return [];
    const [city, state] = location.split('|');
    return uniq(matrix
      .filter(r => r.auction === auction && r.city === city && (r.state || '') === state)
      .map(r => r.port)).sort();
  }, [matrix, auction, location]);

  const destinations = useMemo(() => {
    if (!auction || !location || !port) return [];
    const [city, state] = location.split('|');
    return uniq(matrix
      .filter(r => r.auction === auction && r.city === city && (r.state || '') === state && r.port === port)
      .map(r => r.destination)).sort();
  }, [matrix, auction, location, port]);

  // ---- Matched row + prices (client-side, instant) --------
  const matchedRow = useMemo(() => {
    if (!auction || !location || !port || !destination) return null;
    const [city, state] = location.split('|');
    return matrix.find(r =>
      r.auction === auction && r.city === city && (r.state || '') === state &&
      r.port === port && r.destination === destination) || null;
  }, [matrix, auction, location, port, destination]);

  const landPrice = matchedRow ? parseFloat(matchedRow.land_price) || 0 : 0;
  const containerPrice = matchedRow ? parseFloat(matchedRow.container_price) || 0 : 0;
  const totalPrice = matchedRow ? parseFloat(matchedRow.total_price) || 0 : 0;
  const allSelected = !!(auction && location && port && destination);
  const notAvailable = allSelected && !matchedRow;

  // ---- Cascading resets when an upstream field changes --------
  const onAuctionChange = (v) => { setAuction(v); setLocation(''); setPort(''); setDestination(''); };
  const onLocationChange = (v) => { setLocation(v); setPort(''); setDestination(''); };
  const onPortChange = (v) => { setPort(v); setDestination(''); };

  const hasOptions = matrix.length > 0;

  // ---- Render loading state --------------------------------
  if (optionsLoading) {
    return (
      <div className="pub-calc">
        <div className="pub-calc-header">
          <div className="pub-calc-logo">
            <h1>Dealer App</h1>
            <p>{t('calculator.publicTitle')}</p>
          </div>
        </div>
        <div className="pub-calc-container">
          <div className="pub-calc-state-card" role="status" aria-live="polite">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // ---- Render error / no-options state --------------------
  if (optionsError || !hasOptions) {
    return (
      <div className="pub-calc">
        <div className="pub-calc-header">
          <div className="pub-calc-logo">
            <h1>Dealer App</h1>
            <p>{t('calculator.publicTitle')}</p>
          </div>
        </div>
        <div className="pub-calc-container">
          <div className="pub-calc-state-card" role="alert">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#6c757d" strokeWidth="1.5" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>{t('calculator.noOptions')}</p>
          </div>
        </div>
      </div>
    );
  }

  // ---- Main render ----------------------------------------
  return (
    <div className="pub-calc">
      {/* Header band */}
      <div className="pub-calc-header">
        <div className="pub-calc-logo">
          <h1>Dealer App</h1>
          <p>{t('calculator.publicTitle')}</p>
        </div>
      </div>

      <div className="pub-calc-container">
        <div className="pub-calc-card">
          {/* Hero */}
          <div className="pub-calc-hero">
            <h2>{t('calculator.publicTitle')}</h2>
            <p>{t('calculator.publicSubtitle')}</p>
          </div>

          {/* Four cascading dropdowns */}
          <div className="pub-calc-fields">
            {/* 1. Auction */}
            <div className="pub-calc-field">
              <label htmlFor="pc-auction">{t('calculator.auction')}</label>
              <select
                id="pc-auction"
                value={auction}
                onChange={e => onAuctionChange(e.target.value)}
              >
                <option value="" disabled>{t('calculator.selectAuction')}</option>
                {auctions.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* 2. Location (depends on auction) */}
            <div className="pub-calc-field">
              <label htmlFor="pc-location">{t('calculator.location')}</label>
              <select
                id="pc-location"
                value={location}
                onChange={e => onLocationChange(e.target.value)}
                disabled={!auction}
              >
                <option value="" disabled>{t('calculator.selectLocation')}</option>
                {locations.map((loc) => (
                  <option key={locKey(loc.city, loc.state)} value={locKey(loc.city, loc.state)}>
                    {loc.state ? `${loc.city}, ${loc.state}` : loc.city}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Loading Port (depends on location) */}
            <div className="pub-calc-field">
              <label htmlFor="pc-port">{t('calculator.loadingPort')}</label>
              <select
                id="pc-port"
                value={port}
                onChange={e => onPortChange(e.target.value)}
                disabled={!location}
              >
                <option value="" disabled>{t('calculator.selectLoadingPort')}</option>
                {ports.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* 4. Destination Port (depends on port) */}
            <div className="pub-calc-field">
              <label htmlFor="pc-destination">{t('calculator.destination')}</label>
              <select
                id="pc-destination"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                disabled={!port}
              >
                <option value="" disabled>{t('calculator.selectDestination')}</option>
                {destinations.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Results */}
          <div className="pub-calc-results" aria-live="polite">
            <div className="pub-calc-results-grid">
              <div className="pub-calc-result-item">
                <div className="pub-calc-result-label">{t('calculator.inlandCost')}</div>
                <div className="pub-calc-result-value">{formatUSD(landPrice)}</div>
              </div>
              <div className="pub-calc-result-item">
                <div className="pub-calc-result-label">{t('calculator.oceanCost')}</div>
                <div className="pub-calc-result-value">{formatUSD(containerPrice)}</div>
              </div>
              <div className="pub-calc-result-item pub-calc-result-item--total">
                <div className="pub-calc-result-label">{t('calculator.total')}</div>
                <div className="pub-calc-result-value">{formatUSD(totalPrice)}</div>
              </div>
            </div>

            {notAvailable && (
              <div className="pub-calc-not-available" role="alert">
                {t('calculator.notAvailable')}
              </div>
            )}
          </div>
        </div>

        {/* Footer note */}
        <div className="pub-calc-footer">
          <span>{t('calculator.dealersOnlyNote')}</span>
          <Link to="/login">{t('calculator.dealerLogin')}</Link>
        </div>
      </div>
    </div>
  );
}

export default PublicCalculator;
