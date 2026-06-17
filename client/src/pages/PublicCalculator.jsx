// @page: Landing
import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

/* ===========================================================
   CAUCASUS AUTO — Landing (Phase 1: hero + calculator)
   =========================================================== */

// ─── Formatting ────────────────────────────────────────────────────────────────
function formatUSD(v) {
  return '$' + Number(v).toLocaleString('en-US');
}

// distinct preserving first-seen order
function uniq(arr) {
  return Array.from(new Set(arr));
}
const locKey = (city, state) => `${city}|${state || ''}`;

// Approx coordinates [lat, lon] for the US/Canada loading ports and the
// destination ports, so the route can be drawn on a real map (srl.ge style).
const PORT_COORDS = {
  'CA - LOS ANGELES': [33.74, -118.27],
  'CA - OAKLAND': [37.80, -122.30],
  'FL - MIAMI': [25.77, -80.19],
  'GA - SAVANNAH': [32.08, -81.10],
  'IL - CHICAGO': [41.85, -87.65],
  'NJ - NEWARK': [40.69, -74.17],
  'TX - HOUSTON': [29.75, -95.36],
  'VA - NORFOLK': [36.85, -76.29],
  'WA - SEATTLE': [47.61, -122.33],
  'CANADA - MONTREAL': [45.50, -73.55],
  'CANADA - TORONTO': [43.65, -79.38],
  'CANADA - VANCOUVER': [49.28, -123.12],
};
const DEST_COORDS = {
  'GE - Poti / Batumi': [42.15, 41.67],
  'GE - Tbilisi 30 Days': [41.72, 44.78],
  'AM - Gyumri': [40.79, 43.85],
};
// Approx state/province centroids — used to mark the auction location (origin
// of the inland leg) since we don't store per-city coordinates.
const STATE_COORDS = {
  AL: [32.8, -86.8], AK: [63.6, -152.5], AZ: [34.2, -111.7], AR: [34.9, -92.4],
  CA: [37.2, -119.3], CO: [39.0, -105.5], CT: [41.6, -72.7], DE: [39.0, -75.5],
  FL: [28.6, -82.4], GA: [32.9, -83.4], HI: [20.8, -156.3], ID: [44.4, -114.6],
  IL: [40.0, -89.2], IN: [39.9, -86.3], IA: [42.0, -93.5], KS: [38.5, -98.4],
  KY: [37.5, -85.3], LA: [31.0, -92.0], ME: [45.4, -69.2], MD: [39.0, -76.8],
  MA: [42.3, -71.8], MI: [44.3, -85.4], MN: [46.3, -94.3], MS: [32.7, -89.7],
  MO: [38.4, -92.5], MT: [47.0, -109.6], NE: [41.5, -99.8], NV: [39.3, -116.6],
  NH: [43.7, -71.6], NJ: [40.1, -74.7], NM: [34.4, -106.1], NY: [42.9, -75.5],
  NC: [35.5, -79.4], ND: [47.5, -100.5], OH: [40.3, -82.8], OK: [35.6, -97.5],
  OR: [44.0, -120.5], PA: [40.9, -77.8], RI: [41.7, -71.6], SC: [33.9, -80.9],
  SD: [44.4, -100.2], TN: [35.9, -86.4], TX: [31.5, -99.3], UT: [39.3, -111.7],
  VT: [44.1, -72.7], VA: [37.5, -78.9], WA: [47.4, -120.5], WV: [38.6, -80.6],
  WI: [44.6, -89.9], WY: [43.0, -107.5], DC: [38.9, -77.0], PR: [18.2, -66.5],
  ON: [50.0, -85.0], BC: [53.7, -125.0], QC: [52.0, -72.0], AB: [55.0, -115.0],
  MB: [56.4, -98.7], NS: [45.0, -63.0], NB: [46.5, -66.0], SK: [54.0, -106.0],
};
// Vehicle types (from the design) — each adjusts the inland cost.
const VEHICLES = {
  'Sedan': 0,
  'Medium Duty Truck': 150,
  'Quadrocycle': -150,
  'Motorcycles': -180,
  'Bob Cat': 120,
  '3 Cars Cont. (SUV)': 90,
  'Van': 100,
  'Boat': 80,
  'Truck': 200,
  'Heavy Equipment': 300,
};

/* ---------- small inline icons ---------- */
const IconTruck = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M5 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0m10 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0" />
    <path d="M5 17H3V6a1 1 0 0 1 1-1h9v12m-4 0h6m4 0h2v-6h-8m0-5h5l3 5" />
  </svg>
);
const IconShip = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M2 21c1.3.1 2.4-1 3.3-1s2.5 1 3.4 1c1 0 2.2-1 3.3-1s2.3 1 3.3 1c1.3.1 2.4-1 3.4-1s2.5 1 3.3 1" />
    <path d="M6 20.5c-1.4-1.8-2.4-4-2.8-5.2c-.2-.5 0-.7.5-.9l7.5-3.3c.4-.2.6-.3.8-.3s.4.1.8.3l7.5 3.3c.5.2.6.4.5.9c-.4 1.2-1.4 3.4-2.8 5.2" />
    <path d="m6 13l.2-2.8c.1-1.7.2-2.6.8-3.2c.6-.5 1.4-.5 3.2-.5h3.6c1.8 0 2.6 0 3.2.5c.6.6.6 1.5.8 3.2L21 13" />
    <path d="M12 3v8" />
  </svg>
);
const IconPin = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const IconChevron = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="m6 9 6 6 6-6" /></svg>
);
const IconArrow = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14m-6-7 7 7-7 7" /></svg>
);
const IconShield = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="m9 12 2 2 4-4" /></svg>
);

/* ---------- vehicle-type icons ---------- */
const IconCar = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 11l1.6-4a2 2 0 0 1 1.9-1.3h7a2 2 0 0 1 1.9 1.3L19 11" /><path d="M3 16v-3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3h-3" /><path d="M6 16H3" /><circle cx="7.5" cy="16.5" r="1.6" /><circle cx="16.5" cy="16.5" r="1.6" /></svg>
);
const IconSuv = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 12l1.4-4.4A2 2 0 0 1 6.3 6h11.4a2 2 0 0 1 1.9 1.6L21 12" /><path d="M2 16v-2.5a1.5 1.5 0 0 1 1.5-1.5h17a1.5 1.5 0 0 1 1.5 1.5V16h-2.5" /><path d="M6 16H2" /><circle cx="7.5" cy="16.5" r="1.6" /><circle cx="16.5" cy="16.5" r="1.6" /></svg>
);
const IconVan = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 6h11l5 5v5h-2" /><path d="M5 16H3V6" /><path d="M9 16h5" /><path d="M14 8v3h5" /><circle cx="7" cy="16.5" r="1.6" /><circle cx="16.5" cy="16.5" r="1.6" /></svg>
);
const IconMoto = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="5" cy="16" r="3" /><circle cx="19" cy="16" r="3" /><path d="M8 16h5l3-5h3" /><path d="M13 11l-2-3H8" /><path d="M16 11l-3 5" /></svg>
);
const IconQuad = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="5" cy="17" r="2.5" /><circle cx="19" cy="17" r="2.5" /><path d="M5 17h2l2-5h6l1 5h3" /><path d="M9 12l1-3h4" /></svg>
);
const IconBoat = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 18c1 .8 2 1 3 1s2.5-1 4-1 3 1 4 1 2-.2 3-1" /><path d="M5 15l1-5h11l-2 5" /><path d="M9 10V5l6 5" /></svg>
);
const IconExcavator = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 19h11v-3H5l-2 3z" /><path d="M7 16v-3h5v3" /><path d="M12 13l4-6 4 1" /><path d="M20 8l1 4-3 .5" /><circle cx="5.5" cy="19" r="1" /><circle cx="9" cy="19" r="1" /><circle cx="12.5" cy="19" r="1" /></svg>
);

// maps each vehicle type to an icon
const VEHICLE_ICONS = {
  'Sedan': IconCar,
  'Medium Duty Truck': IconTruck,
  'Quadrocycle': IconQuad,
  'Motorcycles': IconMoto,
  'Bob Cat': IconExcavator,
  '3 Cars Cont. (SUV)': IconSuv,
  'Van': IconVan,
  'Boat': IconBoat,
  'Truck': IconTruck,
  'Heavy Equipment': IconExcavator,
};

/* ---------- reusable bits ---------- */
function Mark({ className }) {
  return (
    <svg viewBox="0 0 48 28" className={className} fill="none">
      <path className="fill-brand-600" d="M24 24C15 23 6 18 1 8c8 5 16 7 23 8z" />
      <path className="fill-brand-700" d="M24 24c9-1 18-6 23-16-8 5-16 7-23 8z" />
      <path className="fill-brand-400" d="M24 15C17 14 10 11 6 4c6 4 12 6 18 6z" />
      <path className="fill-brand-500" d="M24 15c7-1 14-4 18-11-4 5-11 7-18 6z" />
    </svg>
  );
}
function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <Mark className="h-8 w-12 shrink-0" />
      <div className="flex flex-col leading-none">
        <span className="font-display text-xl font-800 tracking-[0.04em] text-ink-50">SRL</span>
        <span className="mt-1 font-mono text-[9px] font-500 tracking-[0.4em] text-ink-400">SORELI</span>
      </div>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-400">
        {icon}{label}
      </span>
      {children}
    </label>
  );
}

// Custom searchable single-select. Same props/contract as a native select:
// onChange is called with an event-like { target: { value } }.
function Select({ value, onChange, options, disabled }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  const norm = (o) => (typeof o === 'object' ? o : { value: o, label: o });
  const all = options.map(norm);
  const placeholder = (all.find((o) => o.value === '')?.label) || 'აირჩიეთ...';
  const real = all.filter((o) => o.value !== '');
  const current = real.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const filtered = query
    ? real.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : real;

  const pick = (v) => { onChange({ target: { value: v } }); setOpen(false); setQuery(''); };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-11 w-full items-center justify-between rounded-field border bg-ink-900 px-3.5 text-sm font-500 outline-none transition-colors ${disabled ? 'cursor-not-allowed border-ink-700 opacity-40' : 'border-ink-700 hover:border-ink-500'} ${open ? 'border-brand-500 ring-2 ring-brand-500/30' : ''} ${current ? 'text-ink-100' : 'text-ink-500'}`}
      >
        <span className="truncate">{current ? current.label : placeholder}</span>
        <IconChevron className={`ml-2 h-4 w-4 shrink-0 text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && !disabled && (
        <div className="absolute z-[1000] mt-1.5 w-full overflow-hidden rounded-field border border-ink-700 bg-ink-900 shadow-pop">
          <div className="border-b border-ink-800 p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ძებნა..."
              className="h-9 w-full rounded-[6px] border border-ink-700 bg-ink-950 px-3 text-sm text-ink-100 placeholder:text-ink-500 outline-none focus:border-brand-500"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3.5 py-2.5 text-sm text-ink-500">ვერ მოიძებნა</li>
            ) : (
              filtered.map((o) => {
                const sel = o.value === value;
                return (
                  <li key={o.value}>
                    <button
                      type="button"
                      onClick={() => pick(o.value)}
                      className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-sm transition-colors ${sel ? 'bg-brand-600/15 text-brand-400' : 'text-ink-200 hover:bg-ink-800'}`}
                    >
                      <span className="truncate">{o.label}</span>
                      {sel && (
                        <svg viewBox="0 0 24 24" className="ml-2 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg>
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function PublicCalculator() {
  // ── Matrix state ─────────────────────────────────────────────────────────────
  const [matrix, setMatrix] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState(false);

  // ── Calculator form state ─────────────────────────────────────────────────────
  const [auction, setAuction] = useState('');
  const [location, setLocation] = useState('');   // "city|state"
  const [port, setPort] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicle, setVehicle] = useState('Sedan');

  // ── FAQ accordion ─────────────────────────────────────────────────────────────
  const [faq, setFaq] = useState(null);

  // ── Fetch matrix on mount ────────────────────────────────────────────────────
  useEffect(() => {
    let ignore = false;
    setOptionsLoading(true);
    setOptionsError(false);

    api.get('/public/calculator/matrix')
      .then((res) => {
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

  // ── Cascading option lists ───────────────────────────────────────────────────
  const auctions = useMemo(() => uniq(matrix.map((r) => r.auction)).sort(), [matrix]);

  const locations = useMemo(() => {
    const seen = new Map();
    for (const r of matrix) {
      if (r.auction !== auction) continue;
      const k = locKey(r.city, r.state);
      if (!seen.has(k)) seen.set(k, { city: r.city, state: r.state });
    }
    return Array.from(seen.values()).sort((a, b) =>
      (a.city + a.state).localeCompare(b.city + b.state)
    );
  }, [matrix, auction]);

  const ports = useMemo(() => {
    if (!auction || !location) return [];
    const [city, state] = location.split('|');
    return uniq(
      matrix
        .filter((r) => r.auction === auction && r.city === city && (r.state || '') === state)
        .map((r) => r.port)
    ).sort();
  }, [matrix, auction, location]);

  const destinations = useMemo(() => {
    if (!auction || !location || !port) return [];
    const [city, state] = location.split('|');
    return uniq(
      matrix
        .filter(
          (r) =>
            r.auction === auction &&
            r.city === city &&
            (r.state || '') === state &&
            r.port === port
        )
        .map((r) => r.destination)
    ).sort();
  }, [matrix, auction, location, port]);

  const matchedRow = useMemo(() => {
    if (!auction || !location || !port || !destination) return null;
    const [city, state] = location.split('|');
    return (
      matrix.find(
        (r) =>
          r.auction === auction &&
          r.city === city &&
          (r.state || '') === state &&
          r.port === port &&
          r.destination === destination
      ) || null
    );
  }, [matrix, auction, location, port, destination]);

  const containerPrice = matchedRow ? parseFloat(matchedRow.container_price) || 0 : 0;
  // vehicle type adjusts the inland cost (Sedan = 0)
  const landPrice = matchedRow ? Math.max(0, (parseFloat(matchedRow.land_price) || 0) + (VEHICLES[vehicle] || 0)) : 0;
  const totalPrice = matchedRow ? landPrice + containerPrice : 0;

  const onAuctionChange = (v) => { setAuction(v); setLocation(''); setPort(''); setDestination(''); };
  const onLocationChange = (v) => { setLocation(v); setPort(''); setDestination(''); };
  const onPortChange = (v) => { setPort(v); setDestination(''); };

  const hasOptions = matrix.length > 0;

  // Derive display labels for the route map
  const originLabel = location ? location.split('|')[0] : '';

  // ─── Leaflet route map ───────────────────────────────────
  const mapEl = useRef(null);
  const mapObj = useRef(null);
  const routeLayer = useRef(null);

  // init the map once the calculator is mounted
  useEffect(() => {
    if (!hasOptions || mapObj.current || !mapEl.current) return;
    const map = L.map(mapEl.current, {
      zoomControl: false, attributionControl: false, scrollWheelZoom: false, worldCopyJump: true,
    }).setView([40, -30], 2);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 10, subdomains: 'abcd',
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    routeLayer.current = L.layerGroup().addTo(map);
    mapObj.current = map;
    setTimeout(() => map.invalidateSize(), 200);
  }, [hasOptions]);

  // cleanup
  useEffect(() => () => { if (mapObj.current) { mapObj.current.remove(); mapObj.current = null; } }, []);

  // draw the route when a port + destination are chosen
  useEffect(() => {
    const map = mapObj.current, group = routeLayer.current;
    if (!map || !group) return;
    group.clearLayers();
    const port_ = PORT_COORDS[port], dest_ = DEST_COORDS[destination];
    if (!port_ || !dest_) { map.setView([40, -30], 2); return; }
    const state = location ? location.split('|')[1] : '';
    const origin = STATE_COORDS[state] || null; // auction location (inland origin)
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const pin = (cls) => L.divIcon({ className: '', html: `<span class="pc-map-pin ${cls}"></span>`, iconSize: [18, 18], iconAnchor: [9, 9] });
    const pill = (text, cls) => L.divIcon({ className: '', html: `<span class="pc-map-pill ${cls}">${text}</span>`, iconSize: [0, 0], iconAnchor: [0, 0] });

    // inland leg: auction location -> loading port (solid)
    if (origin) {
      L.polyline([origin, port_], { color: '#e26009', weight: 2.5, opacity: 0.9 }).addTo(group);
      L.marker(origin, { icon: pin('pc-map-pin--origin') }).addTo(group);
      if (landPrice > 0) L.marker(mid(origin, port_), { icon: pill(formatUSD(landPrice), 'pc-map-pill--land') }).addTo(group);
    } else if (landPrice > 0) {
      L.marker(port_, { icon: pill(formatUSD(landPrice), 'pc-map-pill--land') }).addTo(group);
    }

    // loading port (transit point)
    L.marker(port_, { icon: pin('pc-map-pin--port') }).addTo(group);

    // ocean leg: loading port -> destination (dashed)
    L.polyline([port_, dest_], { color: '#59a3ff', weight: 2.5, dashArray: '6 8', opacity: 0.9 }).addTo(group);
    if (containerPrice > 0) L.marker(mid(port_, dest_), { icon: pill(formatUSD(containerPrice), 'pc-map-pill--ocean') }).addTo(group);

    // destination
    L.marker(dest_, { icon: pin('pc-map-pin--dest') }).addTo(group);

    map.fitBounds(origin ? [origin, port_, dest_] : [port_, dest_], { padding: [60, 60], maxZoom: 5 });
    setTimeout(() => map.invalidateSize(), 100);
  }, [location, port, destination, landPrice, containerPrice]);

  // Select option arrays
  const auctionOptions = [{ value: '', label: 'აირჩიეთ...' }, ...auctions.map((a) => ({ value: a, label: a }))];
  const locationOptions = [
    { value: '', label: 'აირჩიეთ...' },
    ...locations.map((loc) => ({
      value: locKey(loc.city, loc.state),
      label: loc.state ? `${loc.city}, ${loc.state}` : loc.city,
    })),
  ];
  const portOptions = [{ value: '', label: 'აირჩიეთ...' }, ...ports.map((p) => ({ value: p, label: p }))];
  const destOptions = [{ value: '', label: 'აირჩიეთ...' }, ...destinations.map((d) => ({ value: d, label: d }))];
  const vehicleOptions = Object.keys(VEHICLES).map((v) => ({ value: v, label: v }));

  return (
    <div className="srl-scope w-full bg-ink-900 font-sans text-ink-100 antialiased [&_a]:no-underline [&_button]:no-underline">

      {/* ============ NAV ============ */}
      <header className="sticky top-0 z-30 border-b border-ink-700/80 bg-ink-900/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <Logo />
          <nav className="hidden items-center gap-8 lg:flex">
            {[['ლოტები', '#'], ['კალკულატორი', '#calc'], ['როგორ მუშაობს', '#how'], ['ბლოგი', '#'], ['კონტაქტი', '#']].map(([n, h], i) => (
              <a key={n} href={h}
                className={`text-sm font-500 transition-colors ${i === 1 ? 'text-ink-50' : 'text-ink-400 hover:text-ink-100'}`}>{n}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="inline-flex h-10 items-center rounded-btn border border-ink-700 px-4 text-sm font-display font-600 uppercase tracking-wide text-ink-100 transition-colors hover:border-ink-500 hover:bg-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              შესვლა
            </Link>
          </div>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden border-b border-ink-700">
        {/* dark base */}
        <div className="absolute inset-0 bg-ink-900" />
        {/* container photo — right half */}
        <div className="absolute inset-y-0 right-0 w-full lg:w-[58%]">
          <img
            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80"
            alt="კონტეინერები პორტში"
            className="h-full w-full object-cover object-center"
          />
          {/* fade left edge into dark */}
          <div className="absolute inset-0 bg-gradient-to-r from-ink-900 via-ink-900/70 to-transparent" />
          {/* fade top & bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-transparent to-ink-900/60" />
        </div>

        {/* floating container badge */}
        <div className="pointer-events-none absolute bottom-20 right-[8%] hidden lg:flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 rounded-card border border-ink-700/60 bg-ink-800/80 px-4 py-3 backdrop-blur-md shadow-pop">
            <svg className="h-5 w-5 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <rect x="2" y="7" width="20" height="14" rx="1" />
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              <line x1="12" y1="12" x2="12" y2="16" />
              <line x1="10" y1="14" x2="14" y2="14" />
            </svg>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-400">კონტეინერი</div>
              <div className="font-display text-sm font-700 text-ink-100">40HC · Savannah → Poti</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-card border border-ink-700/60 bg-ink-800/80 px-4 py-3 backdrop-blur-md shadow-pop">
            <svg className="h-5 w-5 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-400">ჩამოსვლა</div>
              <div className="font-display text-sm font-700 text-success-400">ETA: 18 დღე</div>
            </div>
          </div>
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-12">
          <div className="max-w-xl">
            <h1 className="mt-6 font-display text-4xl font-900 uppercase leading-[0.92] tracking-tight text-ink-50 sm:text-5xl lg:text-[3.75rem]">
              შენი მანქანა<br />
              <span className="text-brand-500">ამერიკიდან</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-300">
              ვყიდულობთ, ვაზიდავთ და გავაბაჟებთ ავტომობილებს Copart-სა და IAAI-დან — ლოტის შერჩევიდან ფოთის პორტამდე, ერთ სივრცეში.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#calc"
                className="inline-flex h-14 items-center gap-2 rounded-btn bg-brand-600 px-8 font-display text-sm font-700 uppercase tracking-widest text-white shadow-[0_10px_30px_-8px_rgba(226,96,9,0.7)] transition-colors hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                გამოთვალე ღირებულება <IconArrow className="h-5 w-5" />
              </a>
              <button
                type="button"
                className="inline-flex h-14 items-center gap-2 rounded-btn border border-ink-600 bg-ink-800/60 px-8 font-display text-sm font-700 uppercase tracking-widest text-ink-100 backdrop-blur transition-colors hover:border-ink-400 hover:bg-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                ნახე ლოტები
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CALCULATOR ============ */}
      <section id="calc" className="relative border-b border-ink-700 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand-500">ტრანსპორტირების კალკულატორი</span>
              <h2 className="mt-2 font-display text-4xl font-800 uppercase tracking-tight text-ink-50 sm:text-5xl">
                გამოთვალე მიწოდება<br className="hidden sm:block" /> პორტამდე
              </h2>
            </div>
            <p className="max-w-xs text-sm text-ink-400">
              აირჩიე აუქციონი და ლოკაცია — ვაჩვენებთ სრულ ღირებულებას და სავარაუდო ვადას ფოთამდე.
            </p>
          </div>

          {/* Loading state */}
          {optionsLoading && (
            <div className="mt-10 flex flex-col items-center justify-center gap-4 py-20" role="status" aria-live="polite">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink-700 border-t-brand-500" />
              <p className="text-sm text-ink-400">იტვირთება...</p>
            </div>
          )}

          {/* Error / empty state — shows message but preserves layout */}
          {!optionsLoading && (optionsError || !hasOptions) && (
            <div className="mt-10 rounded-card border border-ink-700 bg-ink-800 p-10 text-center" role="alert">
              <svg className="mx-auto mb-4 h-10 w-10 text-ink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-sm text-ink-400">
                {optionsError ? 'კალკულატორის ჩატვირთვა ვერ მოხერხდა. სცადეთ თავიდან.' : 'ფასები ვერ მოიძებნა.'}
              </p>
            </div>
          )}

          {/* Calculator content */}
          {!optionsLoading && hasOptions && (
            <div className="mt-10 grid gap-6 lg:grid-cols-12 lg:items-stretch">
              {/* ---- LEFT: form + breakdown ---- */}
              <div className="flex flex-col gap-6 lg:col-span-5">
                {/* form */}
                <div className="rounded-card border border-ink-700 bg-ink-800 p-6">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Field label="აუქციონი" icon={<IconShield className="h-3.5 w-3.5" />}>
                      <Select
                        value={auction}
                        onChange={(e) => onAuctionChange(e.target.value)}
                        options={auctionOptions}
                      />
                    </Field>
                    <Field label="აუქციონის ლოკაცია" icon={<IconPin className="h-3.5 w-3.5" />}>
                      <Select
                        value={location}
                        onChange={(e) => onLocationChange(e.target.value)}
                        options={locationOptions}
                        disabled={!auction}
                      />
                    </Field>
                    <Field label="დანიშნულების პორტი" icon={<IconShip className="h-3.5 w-3.5" />}>
                      <Select
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        options={destOptions}
                        disabled={!port}
                      />
                    </Field>
                    <Field label="ჩატვირთვის პორტი" icon={<IconShip className="h-3.5 w-3.5" />}>
                      <Select
                        value={port}
                        onChange={(e) => onPortChange(e.target.value)}
                        options={portOptions}
                        disabled={!location}
                      />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="ავტომობილის ტიპი" icon={<IconTruck className="h-3.5 w-3.5" />}>
                        <Select
                          value={vehicle}
                          onChange={(e) => setVehicle(e.target.value)}
                          options={vehicleOptions}
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-3 rounded-btn border border-ink-700 bg-ink-900 px-4 py-3">
                    <IconShield className="h-5 w-5 shrink-0 text-brand-500" />
                    <p className="text-xs leading-snug text-ink-400">ფასი მოიცავს დაზღვევას და ლოტის გატანას. საბაჟო/აქციზი იანგარიშება ცალკე.</p>
                  </div>
                </div>

                {/* breakdown + total */}
                <div className="rounded-card border border-ink-700 bg-ink-800 p-6">
                  <div className="grid gap-y-1" aria-live="polite">
                    {[
                      ['შიდა', landPrice],
                      ['საზღვაო', containerPrice],
                      ['სულ', totalPrice],
                    ].map(([l, v]) => (
                      <div key={l} className="flex items-center justify-between border-b border-ink-800 py-2.5 last:border-0">
                        <span className="text-sm text-ink-400">{l}</span>
                        <span className="font-mono text-sm font-600 tabular-nums text-ink-100">{formatUSD(v)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-col gap-4 rounded-btn bg-ink-900 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="font-display text-4xl font-700 tabular-nums text-brand-500">{formatUSD(totalPrice)}</div>
                    <Link
                      to="/login"
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-btn bg-brand-600 px-6 font-display text-sm font-600 uppercase tracking-wide text-white shadow-[0_8px_24px_-8px_rgba(226,96,9,0.7)] transition-colors hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    >
                      შეუკვეთე გადაზიდვა <IconArrow className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* ---- RIGHT: real geographic route map (full height) ---- */}
              <div className="lg:col-span-7">
                <div className="relative flex h-full min-h-[440px] flex-col overflow-hidden rounded-card border border-ink-700 bg-ink-900">
                  <div className="flex items-center justify-between px-6 pt-5 pb-3">
                    <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-400">მარშრუტი</span>
                    <span className="font-mono text-[11px] uppercase tracking-wide text-ink-300">
                      {originLabel || '—'} → {destination || '—'}
                    </span>
                  </div>
                  <div ref={mapEl} className="w-full flex-1" />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how" className="border-b border-ink-700 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand-500">როგორ მუშაობს</span>
              <h2 className="mt-2 font-display text-4xl font-800 uppercase tracking-tight text-ink-50 sm:text-5xl">
                იმპორტი<br />4 ნაბიჯად
              </h2>
              <p className="mt-5 max-w-sm text-ink-300">
                ლოტის შერჩევიდან ეზოში მიყვანამდე — ყველა ეტაპს ჩვენ ვუძღვებით. შენ მხოლოდ აკონტროლებ პროცესს ერთი ანგარიშიდან.
              </p>
              <Link
                to="/login"
                className="mt-7 inline-flex h-12 items-center gap-2 rounded-btn border border-ink-700 px-6 font-display text-sm font-600 uppercase tracking-wide text-ink-100 transition-colors hover:border-ink-500 hover:bg-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                დაიწყე იმპორტი <IconArrow className="h-4 w-4" />
              </Link>
            </div>

            <div className="lg:col-span-8">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ['01', 'აირჩიე ლოტი', 'იპოვე მანქანა Copart-სა და IAAI-ზე ან გამოგვიგზავნე ლოტის ნომერი — ჩვენ შევამოწმებთ ისტორიას.', true],
                  ['02', 'ჩვენ ვყიდულობთ', 'ვაბრუნებთ ფსონს შენი ლიმიტით და ვიხდით აუქციონზე ლიცენზირებული დილერის სტატუსით.', false],
                  ['03', 'ტრანსპორტი პორტამდე', 'სახმელეთო გადაზიდვა აუქციონიდან პორტამდე, შემდეგ კონტეინერით ფოთის ან ბათუმის ტერმინალამდე.', false],
                  ['04', 'გაბაჟება და მიწოდება', 'ვაფორმებთ საბაჟო პროცედურებს და მანქანას მზად, დარეგისტრირებულს გადმოგცემთ.', false],
                ].map(([n, t, d, hot]) => (
                  <div key={n} className={`rounded-card border p-6 transition-colors ${hot ? 'border-brand-500/40 bg-brand-600/[0.07]' : 'border-ink-700 bg-ink-800 hover:border-ink-600'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-display text-3xl font-800 tabular-nums ${hot ? 'text-brand-500' : 'text-ink-600'}`}>{n}</span>
                      {hot && <span className="rounded-pill bg-brand-600/15 px-2.5 py-1 font-mono text-[10px] font-600 uppercase tracking-wider text-brand-400 ring-1 ring-brand-500/25">აქ იწყება</span>}
                    </div>
                    <h3 className="mt-4 font-display text-lg font-700 uppercase tracking-wide text-ink-50">{t}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-400">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ WHY US ============ */}
      <section className="border-b border-ink-700 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              [<IconShield key="s" className="h-6 w-6" />, 'ლიცენზირებული დილერი', 'პირდაპირი წვდომა Copart-სა და IAAI-ზე — ვაჭრობ რეალურ დილერულ ფასებში, შუამავლის ზედნადებ გარეშე.'],
              [<IconShip key="h" className="h-6 w-6" />, 'გამჭვირვალე ლოგისტიკა', 'ფიქსირებული ფრახტი და რეალური ETA. ყველა ეტაპი თვალყურის დევნებით — აუქციონიდან ფოთამდე.'],
              [<IconTruck key="t" className="h-6 w-6" />, 'სრული მომსახურება', 'შემოწმება, ყიდვა, ტრანსპორტი, დაზღვევა და გაბაჟება — ერთ ხელშეკრულებაში, ერთ გუნდთან.'],
            ].map(([ic, t, d]) => (
              <div key={t} className="rounded-card border border-ink-700 bg-ink-800 p-7">
                <span className="grid h-12 w-12 place-items-center rounded-btn bg-brand-600/15 text-brand-500">{ic}</span>
                <h3 className="mt-5 font-display text-lg font-700 uppercase tracking-wide text-ink-50">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-400">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="border-b border-ink-700 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand-500">ხშირი კითხვები</span>
              <h2 className="mt-2 font-display text-4xl font-800 uppercase tracking-tight text-ink-50 sm:text-5xl">გაქვს კითხვა?</h2>
              <p className="mt-5 max-w-sm text-ink-300">ვერ იპოვე პასუხი? დაგვიკავშირდი — ჩვენი გუნდი ორ საათში გიპასუხებს.</p>
              <button
                type="button"
                className="mt-7 inline-flex h-12 items-center gap-2 rounded-btn bg-brand-600 px-6 font-display text-sm font-600 uppercase tracking-wide text-white shadow-[0_8px_24px_-8px_rgba(226,96,9,0.7)] transition-colors hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                დაგვიკავშირდი
              </button>
            </div>

            <div className="lg:col-span-8">
              <div className="divide-y divide-ink-700 overflow-hidden rounded-card border border-ink-700 bg-ink-800">
                {[
                  ['რა შედის ტრანსპორტირების ფასში?', 'ფასი მოიცავს სახმელეთო გადაზიდვას აუქციონიდან პორტამდე, საზღვაო ფრახტს, დაზღვევას და ლოტის გატანას. საბაჟო და აქციზი იანგარიშება ცალკე, ავტომობილის ასაკისა და ძრავის მიხედვით.'],
                  ['რამდენი ხანი სჭირდება მიწოდებას?', 'საშუალოდ 30-45 დღე აუქციონზე ყიდვიდან ფოთის პორტამდე. ზუსტი ETA დამოკიდებულია გასვლის პორტსა და კონტეინერის გრაფიკზე.'],
                  ['შემიძლია თვითონ ვაჭრო აუქციონზე?', 'დიახ. ჩვენი პლატფორმიდან აყენებ ლიმიტს და ჩვენ ვაბრუნებთ ფსონს შენი სახელით ლიცენზირებული დილერის სტატუსით.'],
                  ['როგორ ხდება გადახდა?', 'დეპოზიტი ლოტის მოგების შემდეგ, დანარჩენი — ტრანსპორტირების ეტაპებზე. ყველა გადარიცხვა ფიქსირდება შენს ანგარიშზე.'],
                ].map(([q, a], i) => (
                  <div key={q}>
                    <button
                      type="button"
                      onClick={() => setFaq(faq === i ? null : i)}
                      aria-expanded={faq === i}
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-ink-800/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
                    >
                      <span className="font-display text-base font-600 uppercase tracking-wide text-ink-50">{q}</span>
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-all ${faq === i ? 'rotate-180 border-brand-500 bg-brand-600/15 text-brand-500' : 'border-ink-700 text-ink-400'}`}>
                        <IconChevron className="h-4 w-4" />
                      </span>
                    </button>
                    {faq === i && (
                      <div className="px-6 pb-6 pr-16">
                        <p className="text-sm leading-relaxed text-ink-400">{a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA BAND ============ */}
      <section className="border-b border-ink-700 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="relative overflow-hidden rounded-card border border-brand-500/30 bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-14 lg:px-16 lg:py-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.25)_1px,transparent_1.5px)] bg-[length:22px_22px] opacity-40" />
            <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <h2 className="font-display text-4xl font-800 uppercase leading-[0.95] tracking-tight text-white sm:text-5xl">
                  მზად ხარ შენი მანქანის<br />იმპორტისთვის?
                </h2>
                <p className="mt-4 max-w-lg text-base text-brand-50">
                  დაარეგისტრირდი წუთებში და მიიღე წვდომა მილიონ ლოტზე დილერულ ფასებში.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-3">
                <Link
                  to="/login"
                  className="inline-flex h-14 items-center gap-2 rounded-btn bg-ink-900 px-8 font-display text-sm font-700 uppercase tracking-widest text-white transition-colors hover:bg-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  დაიწყე ახლა <IconArrow className="h-5 w-5" />
                </Link>
                <button
                  type="button"
                  className="inline-flex h-14 items-center gap-2 rounded-btn border border-white/30 bg-white/10 px-8 font-display text-sm font-700 uppercase tracking-widest text-white backdrop-blur transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  დაგვირეკე
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="bg-ink-900 pt-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid gap-10 pb-14 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Logo />
              <p className="mt-4 max-w-xs text-sm text-ink-400">
                ამერიკული აუქციონებიდან ავტომობილების იმპორტი და ტრანსპორტირება საქართველოში. 2004 წლიდან.
              </p>
              <div className="mt-6 flex gap-3">
                {['IN', 'FB', 'TG'].map((s) => (
                  <button key={s} type="button" className="grid h-10 w-10 place-items-center rounded-btn border border-ink-700 font-mono text-[11px] text-ink-400 transition-colors hover:border-ink-600 hover:text-ink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">{s}</button>
                ))}
              </div>
            </div>
            {[
              ['პლატფორმა', ['ლოტების ძებნა', 'კალკულატორი', 'როგორ მუშაობს', 'ფასები']],
              ['კომპანია', ['ჩვენ შესახებ', 'ბლოგი', 'კარიერა', 'კონტაქტი']],
              ['დახმარება', ['ხშირი კითხვები', 'გაბაჟება', 'პირობები', 'კონფიდენციალურობა']],
            ].map(([title, links]) => (
              <div key={title} className="lg:col-span-2">
                <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-500">{title}</div>
                <ul className="mt-4 space-y-3">
                  {links.map((l) => (
                    <li key={l}><a href="#" className="text-sm text-ink-300 transition-colors hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="lg:col-span-2">
              <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-500">კონტაქტი</div>
              <ul className="mt-4 space-y-3 text-sm text-ink-300">
                <li className="font-mono tabular-nums">+995 32 2 00 00 00</li>
                <li>info@soreli.ge</li>
                <li className="text-ink-400">თბილისი, დ. აღმაშენებლის 154</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-ink-700 py-6 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">© 2026 SRL Soreli. ყველა უფლება დაცულია.</span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">Copart · IAAI · Manheim ოფიციალური წვდომა</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
