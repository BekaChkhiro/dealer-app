import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import ImageLightbox from '../components/ImageLightbox';
import { useTranslation } from '../context/LanguageContext';
import { getVehicleStatusLabelKey } from '../utils/vehicleStatuses';

/* Public vehicle tracking — /track/:vin, in the SRL theme (same tokens as
   PublicCalculator). Shows the car and where it is now; never any money. */

const PHOTO_CATEGORIES = ['auction', 'pickup', 'port', 'port_opening', 'other'];

// Milestones in travel order. The estimated arrival is a forecast, not an
// event, so it never counts as a reached step.
const STEPS = [
  { key: 'purchase_date', labelKey: 'stepPurchased', icon: 'tag' },
  { key: 'vehicle_pickup_date', labelKey: 'stepPickedUp', icon: 'truck' },
  { key: 'warehouse_receive_date', labelKey: 'stepWarehouse', icon: 'warehouse' },
  { key: 'container_loading_date', labelKey: 'stepLoaded', icon: 'box' },
  { key: 'estimated_receive_date', labelKey: 'stepEta', icon: 'calendar', forecast: true },
  { key: 'receive_date', labelKey: 'stepReceived', icon: 'anchor' },
  { key: 'container_open_date', labelKey: 'stepOpened', icon: 'open' },
];

const DAY_MS = 24 * 60 * 60 * 1000;

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const joinPlace = (...parts) => parts.filter(Boolean).join(', ');

// Where the car is right now. The status set by staff wins; when it is empty
// the stage is read off the latest milestone date that has been filled in.
function getCurrentStage(vehicle) {
  if (getVehicleStatusLabelKey(vehicle.current_status)) return vehicle.current_status;
  if (vehicle.container_open_date || vehicle.receive_date) return 'arrived';
  if (vehicle.container_loading_date) return 'in_transit';
  if (vehicle.warehouse_receive_date) return 'at_warehouse';
  if (vehicle.vehicle_pickup_date) return 'picked_up';
  if (vehicle.purchase_date) return 'purchased';
  return null;
}

// One place, or a [from, to] pair while the car is moving.
function getCurrentPlace(vehicle, stage) {
  const destination = vehicle.destination_port_name || vehicle.destination_port;
  const origin = joinPlace(vehicle.city, vehicle.us_state);
  const warehouse = vehicle.warehouse_name || vehicle.us_port || vehicle.us_state;
  switch (stage) {
    case 'purchased': return [origin || vehicle.auction];
    case 'picked_up': return [origin, warehouse];
    case 'at_warehouse':
    case 'to_load': return [warehouse];
    case 'loaded':
    case 'in_transit': return [vehicle.us_port, destination];
    case 'arrived':
    case 'delivered': return [destination];
    default: return [];
  }
}

// Most recent milestone that has already happened.
function getLastUpdate(vehicle) {
  const now = Date.now();
  let last = null;
  for (const step of STEPS) {
    if (step.forecast || !vehicle[step.key]) continue;
    const time = new Date(vehicle[step.key]).getTime();
    if (isNaN(time) || time > now) continue;
    if (!last || time >= last.time) last = { time, step };
  }
  return last;
}

/* ---------- icons (stroke) ---------- */
const paths = {
  tag: <><path d="M12.6 2.6 21 11a2 2 0 0 1 0 2.8L13.8 21a2 2 0 0 1-2.8 0L2.6 12.6A2 2 0 0 1 2 11.2V4a2 2 0 0 1 2-2h7.2a2 2 0 0 1 1.4.6Z" /><circle cx="7.5" cy="7.5" r="1.5" /></>,
  truck: <><path d="M5 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0m10 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0" /><path d="M5 17H3V6a1 1 0 0 1 1-1h9v12m-4 0h6m4 0h2v-6h-8m0-5h5l3 5" /></>,
  warehouse: <><path d="M3 21V8l9-5 9 5v13" /><path d="M7 21v-8h10v8" /><path d="M7 17h10" /></>,
  box: <><path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" /><path d="m3 8 9 5 9-5" /><path d="M12 13v8" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
  anchor: <><circle cx="12" cy="5" r="2" /><path d="M12 7v14" /><path d="M5 13a7 7 0 0 0 14 0" /><path d="M8 11h8" /></>,
  open: <><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></>,
  check: <path d="m5 12 5 5 9-10" />,
  arrowUpRight: <path d="M7 17 17 7M8 7h9v9" />,
  copy: <><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" /></>,
  car: <><path d="M5 11l1.6-4a2 2 0 0 1 1.9-1.3h7a2 2 0 0 1 1.9 1.3L19 11" /><path d="M3 16v-3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3h-3" /><path d="M6 16H3" /><circle cx="7.5" cy="16.5" r="1.6" /><circle cx="16.5" cy="16.5" r="1.6" /></>,
  expand: <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />,
  file: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" /><path d="M14 3v5h5" /></>,
  alert: <><circle cx="12" cy="12" r="9" /><path d="M12 8v4m0 4h.01" /></>,
};

function Icon({ name, className = 'h-4 w-4', strokeWidth = 1.8 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function Mark({ className }) {
  return (
    <svg viewBox="0 0 48 28" className={className} fill="none" aria-hidden="true">
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
      <Mark className="h-7 w-11 shrink-0" />
      <div className="flex flex-col leading-none">
        <span className="font-display text-lg font-800 tracking-[0.04em] text-ink-50">SRL</span>
        <span className="mt-1 font-mono text-[8px] font-500 tracking-[0.4em] text-ink-400">SORELI</span>
      </div>
    </div>
  );
}

function Label({ children, className = '' }) {
  return <span className={`block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-400 ${className}`}>{children}</span>;
}

function Row({ label, children, mono }) {
  const empty = children == null || children === '';
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-ink-800 py-3 last:border-0">
      <dt className="shrink-0 text-sm font-400 text-ink-400">{label}</dt>
      <dd className={`m-0 min-w-0 break-words text-right text-sm ${empty ? 'text-ink-500' : 'text-ink-100'} ${mono ? 'font-mono tabular-nums' : 'font-500'}`}>
        {empty ? '—' : children}
      </dd>
    </div>
  );
}

/* ---------- page shell ---------- */
function Shell({ children }) {
  const { t, language, setLanguage } = useTranslation();
  return (
    <div className="srl-scope flex min-h-screen flex-col bg-ink-950 font-sans text-ink-100">
      <header className="border-b border-ink-800">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="hidden h-6 border-l border-ink-800 sm:block" />
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400 sm:block">{t('publicTracking.title')}</span>
          </div>
          <div className="flex rounded-btn border border-ink-800 p-0.5 font-mono text-[11px]">
            {['ka', 'en'].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLanguage(l)}
                aria-pressed={language === l}
                className={`cursor-pointer rounded-field px-2.5 py-1 uppercase tracking-wider transition-colors ${language === l ? 'bg-ink-800 text-ink-50' : 'text-ink-500 hover:text-ink-200'}`}
              >
                {l === 'ka' ? 'ქარ' : 'Eng'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-8 lg:px-8 lg:pt-12">{children}</main>

      <footer className="border-t border-ink-800">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p className="m-0 text-sm text-ink-400">{t('publicTracking.footer')}</p>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-600">{t('publicTracking.footerNote')}</span>
        </div>
      </footer>
    </div>
  );
}

function Notice({ icon, title, text, spin }) {
  return (
    <div className="grid place-items-center py-24 text-center">
      <div>
        {spin ? (
          <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-2 border-ink-700 border-t-brand-500" role="status" />
        ) : (
          <Icon name={icon} className="mx-auto h-12 w-12 text-ink-500" strokeWidth={1.4} />
        )}
        {title && <h1 className="mb-0 mt-6 font-display text-2xl font-700 uppercase tracking-wide text-ink-50">{title}</h1>}
        <p className="mb-0 mt-3 text-sm text-ink-400">{text}</p>
      </div>
    </div>
  );
}

/* ---------- stepper ---------- */
function nodeClass(state) {
  switch (state) {
    case 'done': return 'border-brand-600 bg-brand-600 text-white';
    case 'current': return 'border-brand-500 bg-ink-900 text-brand-500 ring-4 ring-brand-500/15';
    case 'forecast': return 'border-dashed border-ink-500 bg-ink-900 text-ink-300';
    default: return 'border-ink-700 bg-ink-900 text-ink-400';
  }
}

// colour of the segment that leaves step i toward step i + 1
function legClass(steps, i) {
  const from = steps[i].state;
  const to = steps[i + 1]?.state;
  if (from === 'done') return 'border-brand-600 border-solid';
  if (from === 'current' && to === 'forecast') return 'border-brand-500 border-dashed';
  return 'border-ink-700 border-solid';
}

function StepNode({ step, size = 'h-10 w-10' }) {
  return (
    <span className={`relative z-10 grid ${size} shrink-0 place-items-center rounded-full border-2 ${nodeClass(step.state)}`}>
      <Icon name={step.state === 'done' ? 'check' : step.icon} className="h-4 w-4" strokeWidth={step.state === 'done' ? 2.4 : 1.8} />
    </span>
  );
}

function StepText({ step, align = 'center' }) {
  const { t } = useTranslation();
  const tone = step.state === 'pending' ? 'text-ink-500' : 'text-ink-50';
  const date = step.date || (step.state === 'done' ? '—' : t('publicTracking.pending'));
  return (
    <div className={align === 'center' ? 'text-center' : ''}>
      <div className={`text-[13px] font-600 leading-snug ${tone}`}>{step.label}</div>
      <div className={`mt-1 font-mono text-[11px] tabular-nums ${step.state === 'current' ? 'text-brand-400' : 'text-ink-400'}`}>{date}</div>
      {step.state === 'forecast' && (
        <span className="mt-1.5 inline-block rounded-pill border border-ink-700 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ink-400">{t('publicTracking.forecast')}</span>
      )}
    </div>
  );
}

function Stepper({ steps }) {
  const { t } = useTranslation();
  const reached = steps.filter((s) => !s.forecast && (s.state === 'done' || s.state === 'current')).length;
  const total = steps.filter((s) => !s.forecast).length;
  return (
    <section className="rounded-card border border-ink-800 bg-ink-900 p-6 lg:p-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Label>{t('publicTracking.route')}</Label>
          <h2 className="mb-0 mt-1.5 font-display text-xl font-700 uppercase tracking-wide text-ink-50">{t('publicTracking.timeline')}</h2>
        </div>
        <span className="whitespace-nowrap font-mono text-xs tabular-nums text-ink-400">
          <span className="text-brand-500">{reached}</span> / {total}
        </span>
      </div>

      {/* desktop: horizontal */}
      <ol className="mt-8 hidden grid-cols-7 lg:grid">
        {steps.map((step, i) => (
          <li key={step.key} className="relative flex flex-col items-center gap-4 px-2">
            {i < steps.length - 1 && (
              <span className={`absolute left-1/2 top-5 w-full border-t-2 ${legClass(steps, i)}`} aria-hidden="true" />
            )}
            <StepNode step={step} />
            <StepText step={step} />
          </li>
        ))}
      </ol>

      {/* mobile / tablet: vertical */}
      <ol className="mt-6 lg:hidden">
        {steps.map((step, i) => (
          <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
            {i < steps.length - 1 && (
              <span className={`absolute bottom-0 left-[17px] top-9 border-l-2 ${legClass(steps, i)}`} aria-hidden="true" />
            )}
            <StepNode step={step} size="h-9 w-9" />
            <div className="pt-1.5"><StepText step={step} align="left" /></div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ---------- photos ---------- */
function Photos({ vehicle, vehicleName }) {
  const { t } = useTranslation();
  const tabs = PHOTO_CATEGORIES
    .map((id) => ({ id, files: (vehicle.photos || []).filter((p) => p.category === id) }))
    .filter((tab) => tab.files.length > 0);

  const [tabId, setTabId] = useState(tabs[0]?.id);
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const tab = tabs.find((x) => x.id === tabId) || tabs[0];
  const images = tab ? tab.files.filter((p) => p.file_type?.startsWith('image/')) : [];
  const documents = tab ? tab.files.filter((p) => !p.file_type?.startsWith('image/')) : [];
  // With no gallery photos the main picture (if any) still gets shown.
  const gallery = images.length
    ? images.map((p) => ({ url: p.file_url, name: p.file_name }))
    : (!tab && vehicle.profile_image_url ? [{ url: vehicle.profile_image_url, name: vehicleName }] : []);
  const current = gallery[Math.min(index, gallery.length - 1)];

  return (
    <section className="overflow-hidden rounded-card border border-ink-800 bg-ink-900">
      <div className="relative aspect-[16/10] w-full bg-ink-800">
        {current ? (
          <button type="button" onClick={() => setLightbox(true)} className="block h-full w-full cursor-zoom-in p-0">
            <img src={current.url} alt={vehicleName} className="h-full w-full object-cover" />
          </button>
        ) : (
          <div className="grid h-full w-full place-items-center text-ink-500">
            <Icon name="car" className="h-16 w-16" strokeWidth={1.2} />
          </div>
        )}
        {gallery.length > 0 && (
          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="absolute bottom-4 right-4 inline-flex h-9 cursor-pointer items-center gap-2 whitespace-nowrap rounded-btn border border-ink-700 bg-ink-950/80 px-3 font-mono text-[11px] uppercase tracking-wider text-ink-200 transition-colors hover:border-ink-500"
          >
            <Icon name="expand" className="h-3.5 w-3.5" /> {Math.min(index, gallery.length - 1) + 1} / {gallery.length}
          </button>
        )}
      </div>

      {tab && (
        <div className="border-t border-ink-800 p-5 lg:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Label>{t('publicTracking.photos')}</Label>
            <div className="flex max-w-full gap-1 self-start overflow-x-auto rounded-btn border border-ink-800 bg-ink-950 p-1" role="tablist">
              {tabs.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  role="tab"
                  aria-selected={tab.id === x.id}
                  onClick={() => { setTabId(x.id); setIndex(0); }}
                  className={`cursor-pointer whitespace-nowrap rounded-field px-3 py-1.5 text-xs font-500 transition-colors ${tab.id === x.id ? 'bg-ink-800 text-ink-50' : 'text-ink-400 hover:text-ink-200'}`}
                >
                  {t(`publicTracking.photoTab.${x.id}`)} <span className="ml-1 font-mono text-[10px] text-ink-500">{x.files.length}</span>
                </button>
              ))}
            </div>
          </div>

          {images.length > 0 && (
            <div className="mt-4 grid max-h-[232px] grid-cols-4 gap-2 overflow-y-auto pr-1 sm:grid-cols-6">
              {images.map((photo, i) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`aspect-square cursor-pointer overflow-hidden rounded-field border p-0 transition-colors ${i === index ? 'border-brand-500' : 'border-ink-800 hover:border-ink-600'}`}
                >
                  <img src={photo.file_url} alt={photo.file_name} loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {documents.length > 0 && (
            <ul className="mt-4 flex flex-col gap-2">
              {documents.map((doc) => (
                <li key={doc.id}>
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-ink-200 no-underline hover:text-brand-400">
                    <Icon name="file" className="h-4 w-4 shrink-0 text-ink-500" /> <span className="break-all">{doc.file_name}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {lightbox && gallery.length > 0 && (
        <ImageLightbox
          images={gallery}
          index={Math.min(index, gallery.length - 1)}
          onClose={() => setLightbox(false)}
          onIndexChange={setIndex}
        />
      )}
    </section>
  );
}

/* ---------- page ---------- */
function PublicTracking() {
  const { vin } = useParams();
  const { t } = useTranslation();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchVehicle() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/public/track/${vin}`);
        setVehicle(res.data.data);
      } catch (err) {
        setError(err.response?.status === 404 ? 'notFound' : 'loadError');
      } finally {
        setLoading(false);
      }
    }
    if (vin) fetchVehicle();
  }, [vin]);

  if (loading) {
    return <Shell><Notice spin text={t('publicTracking.loading')} /></Shell>;
  }

  if (error) {
    return (
      <Shell>
        <Notice
          icon="alert"
          title={t(error === 'notFound' ? 'publicTracking.notFoundTitle' : 'publicTracking.loadErrorTitle')}
          text={t(error === 'notFound' ? 'publicTracking.notFoundText' : 'publicTracking.loadErrorText')}
        />
      </Shell>
    );
  }

  if (!vehicle) return null;

  const vehicleName = [vehicle.year, vehicle.mark, vehicle.model].filter(Boolean).join(' ') || t('publicTracking.vehicle');
  const vinStr = String(vehicle.vin || '');
  const destination = vehicle.destination_port_name || vehicle.destination_port;

  const stage = getCurrentStage(vehicle);
  const stageLabelKey = stage === 'picked_up' ? 'publicTracking.stagePickedUp' : getVehicleStatusLabelKey(stage);
  const stageLabel = stageLabelKey ? t(stageLabelKey) : t('publicTracking.stageUnknown');
  const hasArrived = stage === 'arrived' || stage === 'delivered';
  const place = getCurrentPlace(vehicle, stage).filter(Boolean);
  const lastUpdate = getLastUpdate(vehicle);

  const etaTime = new Date(vehicle.estimated_receive_date).getTime();
  const showEta = !hasArrived && !!vehicle.estimated_receive_date && !isNaN(etaTime);
  const daysLeft = showEta ? Math.ceil((etaTime - Date.now()) / DAY_MS) : null;

  // Step states: done | current | forecast | pending
  let lastReached = -1;
  STEPS.forEach((step, i) => {
    if (!step.forecast && vehicle[step.key]) lastReached = i;
  });
  const steps = STEPS.map((step, i) => {
    const date = formatDate(vehicle[step.key]);
    let state = 'pending';
    // Once later steps are reached the forecast is simply behind us.
    if (i < lastReached) state = 'done';
    else if (step.forecast) state = date ? 'forecast' : 'pending';
    else if (i === lastReached) state = 'current';
    return { ...step, label: t(`publicTracking.${step.labelKey}`), date, state };
  });

  const copyVin = () => {
    navigator.clipboard?.writeText(vinStr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const pillTone = hasArrived
    ? 'bg-success-600/15 text-success-400 ring-success-500/25'
    : 'bg-brand-600/15 text-brand-400 ring-brand-500/25';

  const routeStrip = [
    { label: t('publicTracking.from'), value: joinPlace(vehicle.city, vehicle.us_state), sub: vehicle.us_port },
    { label: t('publicTracking.to'), value: destination, sub: t('publicTracking.destinationPort') },
    { label: t('publicTracking.container'), value: vehicle.container_number, sub: vehicle.line, mono: true },
  ];

  return (
    <Shell>
      {/* title + status */}
      <div className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
        <div className="flex flex-col justify-between gap-6 lg:col-span-7">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {vehicle.auction && (
                <span className="whitespace-nowrap rounded-pill border border-ink-800 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-300">{vehicle.auction}</span>
              )}
              {vehicle.lot_number && (
                <span className="whitespace-nowrap rounded-pill border border-ink-800 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-300">{t('publicTracking.lot')} {vehicle.lot_number}</span>
              )}
            </div>
            <h1 className="mb-0 mt-4 break-words font-display text-4xl font-700 uppercase leading-[0.95] tracking-tight text-ink-50 sm:text-6xl">{vehicleName}</h1>
            <button
              type="button"
              onClick={copyVin}
              title={t('publicTracking.copyVin')}
              className="group mt-4 inline-flex cursor-pointer items-center gap-2.5 rounded-field px-0 py-1 text-left"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-500">VIN</span>
              <span className="font-mono text-sm tracking-[0.08em] text-ink-200 sm:text-base">
                {vinStr.slice(0, -6)}<span className="text-brand-400">{vinStr.slice(-6)}</span>
              </span>
              <span className="text-ink-500 transition-colors group-hover:text-ink-200">
                {copied ? <Icon name="check" className="h-4 w-4 text-brand-500" strokeWidth={2.4} /> : <Icon name="copy" className="h-4 w-4" />}
              </span>
            </button>
          </div>

          {/* route strip */}
          <dl className="m-0 hidden overflow-hidden rounded-card border border-ink-800 lg:grid lg:grid-cols-3">
            {routeStrip.map((item, i) => (
              <div key={item.label} className={`min-w-0 px-5 py-4 ${i > 0 ? 'border-l border-ink-800' : ''}`}>
                <dt><Label>{item.label}</Label></dt>
                <dd className={`m-0 mt-1.5 truncate ${item.value ? 'text-ink-50' : 'text-ink-500'} ${item.mono ? 'font-mono text-sm tabular-nums' : 'text-base font-600'}`}>{item.value || '—'}</dd>
                {item.value && item.sub && <dd className="m-0 mt-0.5 truncate text-xs text-ink-400">{item.sub}</dd>}
              </div>
            ))}
          </dl>
        </div>

        {/* where is it now */}
        <section className="rounded-card border border-ink-800 bg-ink-900 lg:col-span-5">
          <div className="p-6">
            <div className="flex items-center justify-between gap-3">
              <Label>{t('publicTracking.whereNow')}</Label>
              <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 py-1 font-mono text-[10px] font-600 uppercase tracking-wider ring-1 ${pillTone}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${hasArrived ? 'bg-success-500' : 'bg-brand-500'}`} />{stageLabel}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-2xl font-600 uppercase tracking-wide text-ink-50">
              {place.length === 0 && <span>{stageLabel}</span>}
              {place.map((name, i) => (
                <span key={`${name}-${i}`} className="inline-flex items-center gap-x-3">
                  {i > 0 && <span className="text-brand-500" aria-hidden="true">→</span>}
                  <span>{name}</span>
                </span>
              ))}
            </div>
            {stage && <p className="mb-0 mt-2 text-sm text-ink-400">{t(`publicTracking.stageText.${stage}`)}</p>}
          </div>

          <dl className="m-0 grid grid-cols-2 border-t border-ink-800">
            <div className="border-r border-ink-800 px-6 py-4">
              <dt><Label>{t('publicTracking.stepEta')}</Label></dt>
              <dd className={`m-0 mt-1.5 font-mono text-sm tabular-nums ${showEta ? 'text-ink-50' : 'text-ink-500'}`}>{showEta ? formatDate(vehicle.estimated_receive_date) : '—'}</dd>
              {showEta && daysLeft > 0 && (
                <dd className="m-0 mt-0.5 text-xs text-ink-400">{t('publicTracking.daysLeft').replace('{n}', daysLeft)}</dd>
              )}
            </div>
            <div className="px-6 py-4">
              <dt><Label>{t('publicTracking.lastUpdate')}</Label></dt>
              <dd className={`m-0 mt-1.5 font-mono text-sm tabular-nums ${lastUpdate ? 'text-ink-50' : 'text-ink-500'}`}>{lastUpdate ? formatDate(lastUpdate.time) : '—'}</dd>
              {lastUpdate && <dd className="m-0 mt-0.5 text-xs text-ink-400">{t(`publicTracking.${lastUpdate.step.labelKey}`)}</dd>}
            </div>
          </dl>

          {vehicle.container_tracking_url && (
            <div className="border-t border-ink-800 p-4">
              <a
                href={vehicle.container_tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-btn bg-brand-600 px-5 font-display text-sm font-600 uppercase tracking-wide text-white no-underline transition-colors hover:bg-brand-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                {t('publicTracking.trackContainer')} <Icon name="arrowUpRight" className="h-4 w-4" strokeWidth={2} />
              </a>
            </div>
          )}
        </section>
      </div>

      {/* stepper */}
      <div className="mt-6">
        <Stepper steps={steps} />
      </div>

      {/* photos + details */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-7">
          <Photos vehicle={vehicle} vehicleName={vehicleName} />
        </div>

        <div className="flex flex-col gap-6 lg:col-span-5">
          <section className="rounded-card border border-ink-800 bg-ink-900 px-6 pb-3 pt-5">
            <Label>{t('publicTracking.car')}</Label>
            <dl className="m-0 mt-2">
              <Row label={t('cars.auction')}>{vehicle.auction}</Row>
              <Row label={t('cars.lotNumber')} mono>{vehicle.lot_number}</Row>
              <Row label={t('publicTracking.type')}>{vehicle.vehicle_type}</Row>
              <Row label={t('publicTracking.fuel')}>{vehicle.fuel_type ? <span className="capitalize">{vehicle.fuel_type.replace(/_/g, ' ')}</span> : null}</Row>
              <Row label={t('publicTracking.document')}>{vehicle.doc_type?.trim()}</Row>
            </dl>
          </section>

          <section className="rounded-card border border-ink-800 bg-ink-900 px-6 pb-3 pt-5">
            <Label>{t('publicTracking.shippingInfo')}</Label>
            <dl className="m-0 mt-2">
              <Row label={t('publicTracking.container')} mono>{vehicle.container_number}</Row>
              <Row label={t('cars.line')}>{vehicle.line}</Row>
              <Row label={t('publicTracking.departurePort')}>{vehicle.us_port}</Row>
              <Row label={t('publicTracking.destination')}>{destination}</Row>
              {vehicle.receiver_fullname && <Row label={t('publicTracking.receiver')}>{vehicle.receiver_fullname}</Row>}
            </dl>
          </section>
        </div>
      </div>
    </Shell>
  );
}

export default PublicTracking;
