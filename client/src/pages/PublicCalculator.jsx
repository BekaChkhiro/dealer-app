import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';

// ─── Formatting ───────────────────────────────────────────────────────────────
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

// ─── Inline SVG Icons ─────────────────────────────────────────────────────────
function IconTruck({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
      <rect x="9" y="11" width="14" height="10" rx="2"/>
      <circle cx="12" cy="21" r="1"/>
      <circle cx="20" cy="21" r="1"/>
    </svg>
  );
}

function IconShip({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 21c.6.5 1.2 1 2.5 1C7 22 7 20 9.5 20c2.4 0 2.4 2 4.9 2 2.4 0 2.4-2 4.8-2 1.2 0 1.8.5 2.3 1"/>
      <path d="M19 10H5l-1 6h16l-1-6z"/>
      <path d="M12 3v7M8 10V6l4-3 4 3v4"/>
    </svg>
  );
}

function IconPin({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="2.5"/>
    </svg>
  );
}

function IconChevron({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

function IconArrow({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  );
}

function IconShield({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  );
}

function IconCheck({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function IconPlus({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function IconMinus({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
function Mark() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#f9700b"/>
      <path d="M8 22 L16 10 L24 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M10.5 18h11" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <Mark />
      <span className="font-display font-700 text-xl tracking-wide text-white">SRL</span>
    </span>
  );
}

// ─── Field wrapper + styled select ───────────────────────────────────────────
function Field({ label, id, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-600 uppercase tracking-widest text-ink-400">
        {label}
      </label>
      {children}
    </div>
  );
}

function SelectField({ id, value, onChange, disabled, children }) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full appearance-none bg-ink-900 border border-ink-700 rounded-field px-4 py-3 pr-10 text-sm text-ink-100 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {children}
      </select>
      <IconChevron className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
    </div>
  );
}

// ─── FAQ Accordion Item ────────────────────────────────────────────────────────
function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-ink-800 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 py-5 text-left text-sm font-600 text-ink-100 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
      >
        <span>{question}</span>
        <span className="shrink-0 w-6 h-6 rounded-pill bg-ink-800 flex items-center justify-center text-ink-300">
          {open ? <IconMinus className="w-3 h-3" /> : <IconPlus className="w-3 h-3" />}
        </span>
      </button>
      {open && (
        <p className="pb-5 text-sm text-ink-400 leading-relaxed">
          {answer}
        </p>
      )}
    </div>
  );
}

// ─── Route Map Visual ─────────────────────────────────────────────────────────
function RouteMap({ origin, midPort, dest, landPrice, containerPrice }) {
  const hasData = origin && midPort && dest;
  return (
    <div className="bg-ink-900 rounded-card p-5 mt-6">
      <div className="flex items-center gap-0 overflow-x-auto">
        {/* Origin */}
        <div className="flex flex-col items-center shrink-0 min-w-[80px]">
          <div className="w-9 h-9 rounded-pill bg-brand-500/20 border border-brand-500/40 flex items-center justify-center mb-1">
            <IconPin className="w-4 h-4 text-brand-400" />
          </div>
          <span className="text-[11px] text-center text-ink-300 max-w-[80px] leading-tight">
            {hasData ? origin : 'Origin'}
          </span>
        </div>

        {/* Inland leg */}
        <div className="flex-1 flex flex-col items-center min-w-[80px]">
          <div className="flex items-center w-full">
            <div className="flex-1 h-px bg-ink-700 border-t border-dashed border-ink-600" />
            <div className="mx-1 shrink-0 bg-ink-800 border border-ink-700 rounded-pill px-2 py-0.5 text-[10px] font-600 text-ink-300 whitespace-nowrap">
              <IconTruck className="inline w-3 h-3 mr-0.5 -mt-0.5" />
              {landPrice > 0 ? formatUSD(landPrice) : '—'}
            </div>
            <div className="flex-1 h-px bg-ink-700 border-t border-dashed border-ink-600" />
          </div>
          <span className="text-[10px] text-ink-500 mt-1">შიდა</span>
        </div>

        {/* Port */}
        <div className="flex flex-col items-center shrink-0 min-w-[80px]">
          <div className="w-9 h-9 rounded-pill bg-accent-500/20 border border-accent-500/40 flex items-center justify-center mb-1">
            <IconShip className="w-4 h-4 text-accent-400" />
          </div>
          <span className="text-[11px] text-center text-ink-300 max-w-[80px] leading-tight">
            {hasData ? midPort : 'Port'}
          </span>
        </div>

        {/* Ocean leg */}
        <div className="flex-1 flex flex-col items-center min-w-[80px]">
          <div className="flex items-center w-full">
            <div className="flex-1 h-px bg-ink-700 border-t border-dashed border-ink-600" />
            <div className="mx-1 shrink-0 bg-ink-800 border border-ink-700 rounded-pill px-2 py-0.5 text-[10px] font-600 text-ink-300 whitespace-nowrap">
              <IconShip className="inline w-3 h-3 mr-0.5 -mt-0.5" />
              {containerPrice > 0 ? formatUSD(containerPrice) : '—'}
            </div>
            <div className="flex-1 h-px bg-ink-700 border-t border-dashed border-ink-600" />
          </div>
          <span className="text-[10px] text-ink-500 mt-1">საზღვაო</span>
        </div>

        {/* Destination */}
        <div className="flex flex-col items-center shrink-0 min-w-[80px]">
          <div className="w-9 h-9 rounded-pill bg-success-500/20 border border-success-500/40 flex items-center justify-center mb-1">
            <IconPin className="w-4 h-4 text-success-400" />
          </div>
          <span className="text-[11px] text-center text-ink-300 max-w-[80px] leading-tight">
            {hasData ? dest : 'Destination'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function PublicCalculator() {
  const { t } = useTranslation();

  // Full priced matrix (rows: auction, city, state, port, destination, prices).
  const [matrix, setMatrix] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState(false);

  // ---- Calculator form state — location stored as composite "city|state"
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

  const hasOptions = matrix.length > 0;

  // Derive origin city label for route map
  const originLabel = location ? location.split('|')[0] : '';

  // ─── FAQ data ──────────────────────────────────────────────────────────────
  const faqs = [
    {
      question: 'რა ღირს მანქანის ჩამოყვანა ამერიკიდან?',
      answer: 'ფასი დამოკიდებულია აუქციონის ლოკაციაზე, ჩატვირთვის პორტსა და დანიშნულებაზე. ჩვენი კალკულატორი გაჩვენებთ ზუსტ ფასს — შიდა ტრანსპორტირება + საზღვაო კონტეინერი.',
    },
    {
      question: 'რამდენი ხანი სჭირდება მანქანის ჩამოყვანას?',
      answer: 'ამერიკიდან საქართველომდე გადაზიდვა სულ დაახლოებით 4-8 კვირა სჭირდება — შიდა ტრანსპორტიდან პორტამდე და საზღვაო მარშრუტის ჩათვლით.',
    },
    {
      question: 'Copart-სა და IAAI-ს შორის რა განსხვავებაა?',
      answer: 'ორივე ამერიკული სადილერო აუქციონია. Copart ძირითადად სადაზღვევო და განახლებულ მანქანებს ყიდის, IAAI კი უფრო ფართო ასორტიმენტს. ორივეს ფასები ჩვენი პლატფორმის კალკულატორში ასახულია.',
    },
    {
      question: 'საჭიროა თუ არა სადილერო ლიცენზია?',
      answer: 'კი — ჩვენი სერვისი განკუთვნილია ლიცენზირებული ავტოდილერებისთვის. დარეგისტრირებისთვის გაიარეთ ვერიფიკაცია.',
    },
    {
      question: 'რა დოკუმენტებია საჭირო იმპორტისთვის?',
      answer: 'Title (US), Bill of Lading, კომერციული ინვოისი და ტექნიკური ინსპექციის ცნობა. ჩვენი გუნდი მთელ პროცესს განაახლებს და დაგეხმარებათ.',
    },
  ];

  // ─── Why Us cards ──────────────────────────────────────────────────────────
  const whyCards = [
    {
      icon: <IconShield className="w-6 h-6 text-brand-400" />,
      title: 'გამჭვირვალე ფასები',
      body: 'კალკულატორი ყველა ფარულ გადასახადს ამოიღებს — ფასი ჩამოყვანამდე ზუსტია.',
    },
    {
      icon: <IconTruck className="w-6 h-6 text-brand-400" />,
      title: 'ენდ-ტუ-ენდ ლოჯისტიკა',
      body: 'აუქციონიდან კარამდე — ერთი ოპერატორი, ერთი ინვოისი, ნულოვანი სიურპრიზი.',
    },
    {
      icon: <IconCheck className="w-6 h-6 text-brand-400" />,
      title: 'სადილერო პლატფორმა',
      body: 'ფლოტის ტრეკინგი, ბუქინგი და ინვოისინგი — ერთ სისტემაში, 24/7.',
    },
  ];

  // ─── How it works steps ────────────────────────────────────────────────────
  const steps = [
    { num: '01', title: 'შეარჩიე მანქანა', body: 'Copart ან IAAI-ზე მოძებნეთ სასურველი ავტო.' },
    { num: '02', title: 'გამოთვალე ფასი', body: 'კალკულატორი ზუსტ ღირებულებას გიჩვენებთ სეკუნდებში.' },
    { num: '03', title: 'მოგვმართე', body: 'ჩვენი გუნდი გაამარტივებს ბიდინგს, გადახდასა და დოკუმენტაციას.' },
    { num: '04', title: 'მიიღე ქართულ ბაზარზე', body: 'ჩვენ კონტეინერიდან გამოვიყვანთ და ადგილამდე მიგვიყვანთ.' },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-ink-950 font-sans text-ink-100 min-h-screen">

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-ink-950/90 backdrop-blur-md border-b border-ink-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />
            <div className="hidden md:flex items-center gap-8">
              <a href="#calculator" className="text-sm text-ink-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm">
                კალკულატორი
              </a>
              <a href="#how-it-works" className="text-sm text-ink-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm">
                როგორ მუშაობს
              </a>
              <a href="#faq" className="text-sm text-ink-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm">
                FAQ
              </a>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-btn bg-brand-500 hover:bg-brand-600 text-white text-sm font-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
            >
              შესვლა
              <IconArrow className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-ink-950 via-ink-900 to-ink-950" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 via-transparent to-transparent" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-brand-500/15 border border-brand-500/30 text-brand-400 text-xs font-600 uppercase tracking-widest mb-6">
                <span className="w-1.5 h-1.5 rounded-pill bg-brand-400 animate-pulse" />
                ამერიკიდან საქართველომდე
              </div>
              <h1 className="font-display font-700 text-4xl sm:text-5xl lg:text-6xl leading-tight text-white mb-4">
                შენი მანქანა{' '}
                <span className="text-brand-500">/ ამერიკიდან</span>
              </h1>
              <p className="text-ink-300 text-lg leading-relaxed mb-8 max-w-xl">
                ამ პლატფორმით ლიცენზირებული დილერები ყიდულობენ, ტრეკავენ და ჩამოიყვანენ მანქანებს Copart &#38; IAAI-დან — გამჭვირვალე ფასებით, ყოველგვარი სიურპრიზის გარეშე.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#calculator"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-btn bg-brand-500 hover:bg-brand-600 text-white font-600 transition-colors shadow-pop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
                >
                  ფასი გამოთვალე
                  <IconArrow className="w-4 h-4" />
                </a>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-btn border border-ink-700 hover:border-ink-500 text-ink-200 hover:text-white font-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
                >
                  დილერის შესვლა
                </Link>
              </div>
            </div>

            {/* Right: container illustration */}
            <div className="relative hidden lg:block">
              <div className="relative rounded-card overflow-hidden shadow-float bg-ink-800 aspect-[4/3]">
                {/* Gradient fades */}
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent to-ink-950/30 z-10 pointer-events-none" />
                {/* Placeholder graphic */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <IconShip className="w-24 h-24 text-ink-600" />
                    </div>
                    <p className="text-ink-500 text-sm font-500">კონტეინერული გადაზიდვა</p>
                  </div>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 bg-ink-800 border border-ink-700 rounded-card p-4 shadow-pop">
                <p className="text-[10px] text-ink-400 uppercase tracking-widest mb-1">საშუალო დრო</p>
                <p className="text-xl font-display font-700 text-white">4–8 <span className="text-sm font-sans font-500 text-ink-300">კვირა</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CALCULATOR ───────────────────────────────────────────────────────── */}
      <section id="calculator" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center mb-12">
            <p className="text-xs font-600 uppercase tracking-widest text-brand-500 mb-3">ტრანსპორტირების ფასი</p>
            <h2 className="font-display font-700 text-3xl sm:text-4xl text-white mb-4">
              გამოთვალე ღირებულება
            </h2>
            <p className="text-ink-400 max-w-lg mx-auto">
              შეარჩიე აუქციონი, ლოკაცია და დანიშნულება — ზუსტი ფასი გამოჩნდება მყისიერად.
            </p>
          </div>

          {/* Card */}
          <div className="max-w-4xl mx-auto bg-ink-900 border border-ink-800 rounded-card shadow-card overflow-hidden">

            {/* Loading state */}
            {optionsLoading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4" role="status" aria-live="polite">
                <div className="w-10 h-10 rounded-pill border-2 border-ink-700 border-t-brand-500 animate-spin" />
                <p className="text-sm text-ink-400">იტვირთება...</p>
              </div>
            )}

            {/* Error / empty state */}
            {!optionsLoading && (optionsError || !hasOptions) && (
              <div className="flex flex-col items-center justify-center py-20 gap-4" role="alert">
                <div className="w-14 h-14 rounded-pill bg-ink-800 border border-ink-700 flex items-center justify-center">
                  <svg className="w-7 h-7 text-ink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <p className="text-sm text-ink-400">{t('calculator.noOptions')}</p>
              </div>
            )}

            {/* Calculator content */}
            {!optionsLoading && hasOptions && (
              <div className="p-6 lg:p-8">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {/* 1 - Auction */}
                  <Field label="აუქციონი" id="pc-auction">
                    <SelectField
                      id="pc-auction"
                      value={auction}
                      onChange={e => onAuctionChange(e.target.value)}
                    >
                      <option value="" disabled>აირჩიეთ...</option>
                      {auctions.map(a => <option key={a} value={a}>{a}</option>)}
                    </SelectField>
                  </Field>

                  {/* 2 - Location */}
                  <Field label="აუქციონის ლოკაცია" id="pc-location">
                    <SelectField
                      id="pc-location"
                      value={location}
                      onChange={e => onLocationChange(e.target.value)}
                      disabled={!auction}
                    >
                      <option value="" disabled>აირჩიეთ...</option>
                      {locations.map(loc => (
                        <option key={locKey(loc.city, loc.state)} value={locKey(loc.city, loc.state)}>
                          {loc.state ? `${loc.city}, ${loc.state}` : loc.city}
                        </option>
                      ))}
                    </SelectField>
                  </Field>

                  {/* 3 - Loading port */}
                  <Field label="ჩატვირთვის პორტი" id="pc-port">
                    <SelectField
                      id="pc-port"
                      value={port}
                      onChange={e => onPortChange(e.target.value)}
                      disabled={!location}
                    >
                      <option value="" disabled>აირჩიეთ...</option>
                      {ports.map(p => <option key={p} value={p}>{p}</option>)}
                    </SelectField>
                  </Field>

                  {/* 4 - Destination */}
                  <Field label="დანიშნულების პორტი" id="pc-destination">
                    <SelectField
                      id="pc-destination"
                      value={destination}
                      onChange={e => setDestination(e.target.value)}
                      disabled={!port}
                    >
                      <option value="" disabled>აირჩიეთ...</option>
                      {destinations.map(d => <option key={d} value={d}>{d}</option>)}
                    </SelectField>
                  </Field>
                </div>

                {/* Route map */}
                <RouteMap
                  origin={originLabel}
                  midPort={port}
                  dest={destination}
                  landPrice={landPrice}
                  containerPrice={containerPrice}
                />

                {/* Price breakdown */}
                <div className="mt-6 grid sm:grid-cols-3 gap-4" aria-live="polite">
                  {/* Land */}
                  <div className="bg-ink-800 border border-ink-700 rounded-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <IconTruck className="w-4 h-4 text-ink-400" />
                      <span className="text-xs font-600 uppercase tracking-widest text-ink-400">შიდა</span>
                    </div>
                    <p className="text-2xl font-display font-700 text-white">{formatUSD(landPrice)}</p>
                  </div>
                  {/* Ocean */}
                  <div className="bg-ink-800 border border-ink-700 rounded-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <IconShip className="w-4 h-4 text-ink-400" />
                      <span className="text-xs font-600 uppercase tracking-widest text-ink-400">საზღვაო</span>
                    </div>
                    <p className="text-2xl font-display font-700 text-white">{formatUSD(containerPrice)}</p>
                  </div>
                  {/* Total */}
                  <div className="bg-brand-500/10 border border-brand-500/30 rounded-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-600 uppercase tracking-widest text-brand-400">სულ</span>
                    </div>
                    <p className="text-2xl font-display font-700 text-brand-400">{formatUSD(totalPrice)}</p>
                  </div>
                </div>

                {notAvailable && (
                  <div className="mt-4 p-3 rounded-field bg-warning-500/10 border border-warning-500/30 text-warning-400 text-sm" role="alert">
                    {t('calculator.notAvailable')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dealer login note */}
          <p className="text-center mt-6 text-sm text-ink-500">
            ხართ ლიცენზირებული დილერი?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm">
              შედით პლატფორმაში
            </Link>
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 lg:py-24 bg-ink-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-600 uppercase tracking-widest text-brand-500 mb-3">პროცესი</p>
            <h2 className="font-display font-700 text-3xl sm:text-4xl text-white">
              როგორ მუშაობს
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div key={step.num} className="relative bg-ink-800/50 border border-ink-700 rounded-card p-6 hover:border-brand-500/40 transition-colors">
                <div className="font-display font-900 text-4xl text-ink-700 mb-4 leading-none">{step.num}</div>
                <h3 className="font-600 text-white mb-2">{step.title}</h3>
                <p className="text-sm text-ink-400 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY US ────────────────────────────────────────────────────────────── */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-600 uppercase tracking-widest text-brand-500 mb-3">უპირატესობები</p>
            <h2 className="font-display font-700 text-3xl sm:text-4xl text-white">
              რატომ SRL?
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {whyCards.map((card) => (
              <div key={card.title} className="bg-ink-900 border border-ink-800 rounded-card p-6 hover:border-brand-500/30 transition-colors">
                <div className="w-12 h-12 rounded-card bg-brand-500/15 border border-brand-500/20 flex items-center justify-center mb-5">
                  {card.icon}
                </div>
                <h3 className="font-700 text-white mb-2">{card.title}</h3>
                <p className="text-sm text-ink-400 leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-16 lg:py-24 bg-ink-900/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-600 uppercase tracking-widest text-brand-500 mb-3">კითხვები</p>
            <h2 className="font-display font-700 text-3xl sm:text-4xl text-white">
              ხშირად დასმული კითხვები
            </h2>
          </div>
          <div className="bg-ink-900 border border-ink-800 rounded-card px-6">
            {faqs.map((faq) => (
              <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ──────────────────────────────────────────────────────────── */}
      <section className="py-16 lg:py-20 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display font-700 text-3xl sm:text-4xl text-white mb-4">
            მზად ხართ ბიზნესის გასაფართოებლად?
          </h2>
          <p className="text-brand-100 mb-8 max-w-xl mx-auto">
            შეუერთდით ასობით ლიცენზირებულ დილერს, რომლებიც ყოველდღე ჩამოიყვანენ ამერიკული ავტომობილები.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-btn bg-white hover:bg-brand-50 text-brand-600 font-700 transition-colors shadow-pop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-500"
            >
              სადილერო პანელი
              <IconArrow className="w-4 h-4" />
            </Link>
            <a
              href="#calculator"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-btn border-2 border-white/40 hover:border-white text-white font-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-500"
            >
              ფასი გამოთვალე
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer className="bg-ink-950 border-t border-ink-800 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="lg:col-span-1">
              <Logo />
              <p className="text-sm text-ink-500 mt-4 leading-relaxed">
                ამერიკული ავტომობილების ლოჯისტიკა — Copart &#38; IAAI-დან საქართველომდე.
              </p>
            </div>

            {/* Links col 1 */}
            <div>
              <p className="text-xs font-600 uppercase tracking-widest text-ink-500 mb-4">სერვისი</p>
              <ul className="space-y-2">
                <li><a href="#calculator" className="text-sm text-ink-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm">კალკულატორი</a></li>
                <li><a href="#how-it-works" className="text-sm text-ink-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm">როგორ მუშაობს</a></li>
                <li><a href="#faq" className="text-sm text-ink-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm">FAQ</a></li>
              </ul>
            </div>

            {/* Links col 2 */}
            <div>
              <p className="text-xs font-600 uppercase tracking-widest text-ink-500 mb-4">პლატფორმა</p>
              <ul className="space-y-2">
                <li><Link to="/login" className="text-sm text-ink-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm">დილერის შესვლა</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="text-xs font-600 uppercase tracking-widest text-ink-500 mb-4">კონტაქტი</p>
              <ul className="space-y-2">
                <li>
                  <a href="mailto:info@srl.ge" className="text-sm text-ink-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm">
                    info@srl.ge
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-ink-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-ink-600">
              &copy; {new Date().getFullYear()} SRL. ყველა უფლება დაცულია.
            </p>
            <p className="text-xs text-ink-600">
              სადილერო სერვისი · ლიცენზირებული ოპერატორებისთვის
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default PublicCalculator;
