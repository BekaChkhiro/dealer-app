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
const POTI = 'GE - Poti / Batumi';

function PublicCalculator() {
  const { t } = useTranslation();

  const [tab, setTab] = useState('calc'); // 'calc' | 'lot'

  // Full priced matrix (rows: auction, city, state, port, destination, prices).
  const [matrix, setMatrix] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState(false);

  // ---- Calculator tab form state — location stored as composite "city|state"
  const [auction, setAuction] = useState('');
  const [location, setLocation] = useState('');
  const [port, setPort] = useState('');
  const [destination, setDestination] = useState('');

  // ---- Lot-search tab state
  const [lotAuction, setLotAuction] = useState('Copart');
  const [lotNumber, setLotNumber] = useState('');
  const [lotLoading, setLotLoading] = useState(false);
  const [lotError, setLotError] = useState('');
  const [lotResult, setLotResult] = useState(null);
  const [lotPort, setLotPort] = useState('');

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

  const onAuctionChange = (v) => { setAuction(v); setLocation(''); setPort(''); setDestination(''); };
  const onLocationChange = (v) => { setLocation(v); setPort(''); setDestination(''); };
  const onPortChange = (v) => { setPort(v); setDestination(''); };

  // ---- Lot search: ports (to Poti, real ocean routes) from the result -------
  const lotPotiPorts = useMemo(() => {
    if (!lotResult) return [];
    return lotResult.routes
      .filter(r => r.destination === POTI && parseFloat(r.container_price) > 0)
      .map(r => ({ port: r.port, total: parseFloat(r.total_price), inland: parseFloat(r.land_price), ocean: parseFloat(r.container_price) }))
      .sort((a, b) => a.total - b.total);
  }, [lotResult]);

  const lotSelected = lotPotiPorts.find(p => p.port === lotPort) || lotPotiPorts[0] || null;

  async function handleLotSearch(e) {
    e?.preventDefault();
    if (!lotNumber.trim() || lotLoading) return;
    setLotLoading(true);
    setLotError('');
    setLotResult(null);
    setLotPort('');
    try {
      const res = await api.get('/public/calculator/lot-quote', {
        params: { auction: lotAuction, lot: lotNumber.trim() },
      });
      const data = res.data?.data;
      if (!data) { setLotError(t('calculator.lotNotFound')); return; }
      setLotResult(data);
      const cheapest = data.routes
        .filter(r => r.destination === POTI && parseFloat(r.container_price) > 0)
        .sort((a, b) => parseFloat(a.total_price) - parseFloat(b.total_price))[0];
      if (cheapest) setLotPort(cheapest.port);
    } catch (err) {
      setLotError(err.response?.data?.message || t('calculator.lotNotFound'));
    } finally {
      setLotLoading(false);
    }
  }

  const hasOptions = matrix.length > 0;

  const Shell = (children) => (
    <div className="pub-calc">
      <div className="pub-calc-header">
        <div className="pub-calc-logo">
          <h1>Dealer App</h1>
          <p>{t('calculator.publicTitle')}</p>
        </div>
      </div>
      <div className="pub-calc-container">{children}</div>
    </div>
  );

  if (optionsLoading) {
    return Shell(
      <div className="pub-calc-state-card" role="status" aria-live="polite">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading...</p>
      </div>
    );
  }

  if (optionsError || !hasOptions) {
    return Shell(
      <div className="pub-calc-state-card" role="alert">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#6c757d" strokeWidth="1.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p>{t('calculator.noOptions')}</p>
      </div>
    );
  }

  return Shell(
    <>
      <div className="pub-calc-card">
        {/* Tabs */}
        <div className="pub-calc-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'calc'}
            className={`pub-calc-tab ${tab === 'calc' ? 'active' : ''}`} onClick={() => setTab('calc')}>
            {t('calculator.tabCalculator')}
          </button>
          <button type="button" role="tab" aria-selected={tab === 'lot'}
            className={`pub-calc-tab ${tab === 'lot' ? 'active' : ''}`} onClick={() => setTab('lot')}>
            {t('calculator.tabLotSearch')}
          </button>
        </div>

        {tab === 'calc' && (
          <>
            <div className="pub-calc-hero">
              <h2>{t('calculator.publicTitle')}</h2>
              <p>{t('calculator.publicSubtitle')}</p>
            </div>

            <div className="pub-calc-fields">
              <div className="pub-calc-field">
                <label htmlFor="pc-auction">{t('calculator.auction')}</label>
                <select id="pc-auction" value={auction} onChange={e => onAuctionChange(e.target.value)}>
                  <option value="" disabled>{t('calculator.selectAuction')}</option>
                  {auctions.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="pub-calc-field">
                <label htmlFor="pc-location">{t('calculator.location')}</label>
                <select id="pc-location" value={location} onChange={e => onLocationChange(e.target.value)} disabled={!auction}>
                  <option value="" disabled>{t('calculator.selectLocation')}</option>
                  {locations.map((loc) => (
                    <option key={locKey(loc.city, loc.state)} value={locKey(loc.city, loc.state)}>
                      {loc.state ? `${loc.city}, ${loc.state}` : loc.city}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pub-calc-field">
                <label htmlFor="pc-port">{t('calculator.loadingPort')}</label>
                <select id="pc-port" value={port} onChange={e => onPortChange(e.target.value)} disabled={!location}>
                  <option value="" disabled>{t('calculator.selectLoadingPort')}</option>
                  {ports.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="pub-calc-field">
                <label htmlFor="pc-destination">{t('calculator.destination')}</label>
                <select id="pc-destination" value={destination} onChange={e => setDestination(e.target.value)} disabled={!port}>
                  <option value="" disabled>{t('calculator.selectDestination')}</option>
                  {destinations.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

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
                <div className="pub-calc-not-available" role="alert">{t('calculator.notAvailable')}</div>
              )}
            </div>
          </>
        )}

        {tab === 'lot' && (
          <>
            <div className="pub-calc-hero">
              <h2>{t('calculator.tabLotSearch')}</h2>
              <p>{t('calculator.lotSubtitle')}</p>
            </div>

            <form className="pub-calc-fields" onSubmit={handleLotSearch}>
              <div className="pub-calc-field">
                <label htmlFor="lc-auction">{t('calculator.auction')}</label>
                <select id="lc-auction" value={lotAuction} onChange={e => setLotAuction(e.target.value)}>
                  <option value="Copart">Copart</option>
                  <option value="IAAI">IAAI</option>
                </select>
              </div>
              <div className="pub-calc-field">
                <label htmlFor="lc-lot">{t('calculator.lotNumber')}</label>
                <input id="lc-lot" type="text" inputMode="numeric" placeholder="53069776"
                  value={lotNumber} onChange={e => setLotNumber(e.target.value)} />
              </div>
              <div className="pub-calc-field pub-calc-field--btn">
                <button type="submit" className="pub-calc-btn" disabled={!lotNumber.trim() || lotLoading} aria-busy={lotLoading}>
                  {lotLoading ? t('calculator.searching') : t('calculator.search')}
                </button>
              </div>
            </form>

            {lotError && <div className="pub-calc-not-available" role="alert">{lotError}</div>}

            {lotResult && (
              <div className="pub-calc-lot-result" aria-live="polite">
                <div className="pub-calc-lot-vehicle">
                  <div className="pub-calc-lot-name">{lotResult.vehicle || '—'}</div>
                  <div className="pub-calc-lot-meta">
                    <span><strong>{t('calculator.location')}:</strong> {lotResult.location.city}, {lotResult.location.state}</span>
                    {lotResult.vin && <span><strong>VIN:</strong> {lotResult.vin}</span>}
                    {lotResult.odometer && <span><strong>{t('calculator.odometer')}:</strong> {lotResult.odometer}</span>}
                    <span><strong>{t('calculator.auction')}:</strong> {lotResult.auction}</span>
                  </div>
                </div>

                {lotPotiPorts.length === 0 ? (
                  <div className="pub-calc-not-available">{t('calculator.notAvailable')}</div>
                ) : (
                  <>
                    <div className="pub-calc-field">
                      <label htmlFor="lc-port">{t('calculator.loadingPort')}</label>
                      <select id="lc-port" value={lotSelected?.port || ''} onChange={e => setLotPort(e.target.value)}>
                        {lotPotiPorts.map(p => (
                          <option key={p.port} value={p.port}>{p.port} — {formatUSD(p.total)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="pub-calc-results">
                      <div className="pub-calc-results-grid">
                        <div className="pub-calc-result-item">
                          <div className="pub-calc-result-label">{t('calculator.inlandCost')}</div>
                          <div className="pub-calc-result-value">{formatUSD(lotSelected?.inland)}</div>
                        </div>
                        <div className="pub-calc-result-item">
                          <div className="pub-calc-result-label">{t('calculator.oceanCost')}</div>
                          <div className="pub-calc-result-value">{formatUSD(lotSelected?.ocean)}</div>
                        </div>
                        <div className="pub-calc-result-item pub-calc-result-item--total">
                          <div className="pub-calc-result-label">{t('calculator.costToPoti')}</div>
                          <div className="pub-calc-result-value">{formatUSD(lotSelected?.total)}</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="pub-calc-footer">
        <span>{t('calculator.dealersOnlyNote')}</span>
        <Link to="/login">{t('calculator.dealerLogin')}</Link>
      </div>
    </>
  );
}

export default PublicCalculator;
