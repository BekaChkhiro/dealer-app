import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';
import './PublicCalculator.css';

const DEFAULT_OPTIONS = { auctions: [], locations: [], ports: [], destinations: [] };

function formatUSD(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '$0';
  return '$' + num.toLocaleString('en-US');
}

function PublicCalculator() {
  const { t } = useTranslation();

  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState(false);

  // Form state — location stored as index into options.locations
  const [auction, setAuction] = useState('');
  const [locationIdx, setLocationIdx] = useState('');
  const [port, setPort] = useState('');
  const [destination, setDestination] = useState('');

  // Quote state
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [landPrice, setLandPrice] = useState(0);
  const [containerPrice, setContainerPrice] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [notAvailable, setNotAvailable] = useState(false);

  // Latest-request-wins guard
  const quoteSeqRef = useRef(0);

  // ---- Fetch options on mount (ignore-flag pattern) --------
  useEffect(() => {
    let ignore = false;
    setOptionsLoading(true);
    setOptionsError(false);

    api.get('/public/calculator/options')
      .then(res => {
        if (ignore) return;
        const data = res.data?.data ?? DEFAULT_OPTIONS;
        setOptions({
          auctions: Array.isArray(data.auctions) ? data.auctions : [],
          locations: Array.isArray(data.locations) ? data.locations : [],
          ports: Array.isArray(data.ports) ? data.ports : [],
          destinations: Array.isArray(data.destinations) ? data.destinations : [],
        });
      })
      .catch(() => {
        if (!ignore) setOptionsError(true);
      })
      .finally(() => {
        if (!ignore) setOptionsLoading(false);
      });

    return () => { ignore = true; };
  }, []);

  // ---- All four selected? ----------------------------------
  const allSelected =
    auction !== '' &&
    locationIdx !== '' &&
    port !== '' &&
    destination !== '';

  // ---- Fetch quote ----------------------------------------
  function handleCalculate() {
    if (!allSelected || quoteLoading) return;

    const loc = options.locations[Number(locationIdx)];
    if (!loc) return;

    const seq = ++quoteSeqRef.current;
    setQuoteLoading(true);
    setNotAvailable(false);

    api.get('/public/calculator/quote', {
      params: {
        auction,
        city: loc.city,
        state: loc.state || '',
        port,
        destination,
      },
    })
      .then(res => {
        if (seq !== quoteSeqRef.current) return; // stale response
        const d = res.data?.data ?? {};
        if (d.found === false) {
          setNotAvailable(true);
          setLandPrice(0);
          setContainerPrice(0);
          setTotalPrice(0);
        } else {
          setNotAvailable(false);
          setLandPrice(parseFloat(d.land_price) || 0);
          setContainerPrice(parseFloat(d.container_price) || 0);
          setTotalPrice(parseFloat(d.total_price) || 0);
        }
      })
      .catch(() => {
        if (seq !== quoteSeqRef.current) return;
        setNotAvailable(true);
        setLandPrice(0);
        setContainerPrice(0);
        setTotalPrice(0);
      })
      .finally(() => {
        if (seq === quoteSeqRef.current) setQuoteLoading(false);
      });
  }

  // ---- Determine whether we have any usable options --------
  const hasOptions =
    options.auctions.length > 0 ||
    options.locations.length > 0 ||
    options.ports.length > 0 ||
    options.destinations.length > 0;

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
  const locationLabel = (loc) => {
    if (!loc) return '';
    return loc.state ? `${loc.city}, ${loc.state}` : loc.city;
  };

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

          {/* Four dropdowns */}
          <div className="pub-calc-fields">
            {/* 1. Auction */}
            <div className="pub-calc-field">
              <label htmlFor="pc-auction">{t('calculator.auction')}</label>
              <select
                id="pc-auction"
                value={auction}
                onChange={e => setAuction(e.target.value)}
              >
                <option value="" disabled>{t('calculator.selectAuction')}</option>
                {options.auctions.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* 2. Location */}
            <div className="pub-calc-field">
              <label htmlFor="pc-location">{t('calculator.location')}</label>
              <select
                id="pc-location"
                value={locationIdx}
                onChange={e => setLocationIdx(e.target.value)}
              >
                <option value="" disabled>{t('calculator.selectLocation')}</option>
                {options.locations.map((loc, i) => (
                  <option key={i} value={i}>{locationLabel(loc)}</option>
                ))}
              </select>
            </div>

            {/* 3. Loading Port */}
            <div className="pub-calc-field">
              <label htmlFor="pc-port">{t('calculator.loadingPort')}</label>
              <select
                id="pc-port"
                value={port}
                onChange={e => setPort(e.target.value)}
              >
                <option value="" disabled>{t('calculator.selectLoadingPort')}</option>
                {options.ports.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* 4. Destination Port */}
            <div className="pub-calc-field">
              <label htmlFor="pc-destination">{t('calculator.destination')}</label>
              <select
                id="pc-destination"
                value={destination}
                onChange={e => setDestination(e.target.value)}
              >
                <option value="" disabled>{t('calculator.selectDestination')}</option>
                {options.destinations.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Calculate button */}
          <div className="pub-calc-btn-row">
            <button
              className="pub-calc-btn"
              onClick={handleCalculate}
              disabled={!allSelected || quoteLoading}
              aria-busy={quoteLoading}
            >
              {quoteLoading
                ? '...'
                : t('calculator.calculate')}
            </button>
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
