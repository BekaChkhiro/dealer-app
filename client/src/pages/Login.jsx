import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import VinDisplay from '../components/VinDisplay';

// ─── SVG Mark (logo flame) ────────────────────────────────────────────────────
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

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconMail({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 6 10-6" />
    </svg>
  );
}

function IconLock({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function IconEye({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="m1 1 22 22" />
    </svg>
  );
}

function IconArrow({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  );
}

function IconCheck({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

function IconKey({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3L22 7l-3-3" />
    </svg>
  );
}

function IconCar({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h13l4 4v4a2 2 0 0 1-2 2h-1" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-400">
        {label}
      </span>
      <div className="flex h-12 items-center rounded-field border border-ink-700 bg-ink-900 px-3.5 transition-colors focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/30 hover:border-ink-500">
        {Icon && <Icon className="mr-2.5 h-4.5 w-4.5 shrink-0 text-ink-500" />}
        {children}
      </div>
    </div>
  );
}

// ─── Date formatter ───────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString();
}

// ─── Results view (vehicle tracking) ─────────────────────────────────────────
function ResultsView({ results, privateCode, onBack, t }) {
  return (
    <div className="min-h-screen w-full bg-ink-950 font-sans text-ink-100 antialiased">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-btn border border-ink-700 bg-ink-900 px-3.5 py-2 font-mono text-[11px] uppercase tracking-widest text-ink-300 transition-colors hover:border-ink-500 hover:text-ink-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M19 12H5M11 5l-7 7 7 7" />
            </svg>
            {t('login.backToLogin')}
          </button>

          <div className="flex items-center gap-3">
            <Mark className="h-5 w-8" />
            <span className="font-display text-sm font-700 uppercase tracking-wider text-ink-50">
              {t('login.vehicleTracking')}
            </span>
          </div>
        </div>

        {/* Identity badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-pill border border-brand-700/40 bg-brand-950/60 px-4 py-1.5">
          <IconKey className="h-3.5 w-3.5 text-brand-400" />
          <span className="font-mono text-xs text-brand-300">{privateCode}</span>
        </div>

        {/* Results */}
        {results.length === 0 ? (
          <div className="rounded-card border border-ink-800 bg-ink-900 px-6 py-10 text-center text-ink-400">
            {t('login.privateCodeNotFound')}
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((v) => (
              <article
                key={v.id}
                className="flex flex-col overflow-hidden rounded-card border border-ink-800 bg-ink-900 shadow-card sm:flex-row"
              >
                {/* Image */}
                <div className="relative h-44 w-full shrink-0 overflow-hidden bg-ink-800 sm:h-auto sm:w-44">
                  {v.profile_image_url ? (
                    <img
                      src={v.profile_image_url}
                      alt={`${v.mark} ${v.model}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <IconCar className="h-10 w-10 text-ink-600" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-3 p-5">
                  {/* Name row */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-display text-lg font-700 uppercase tracking-tight text-ink-50">
                      {v.mark} {v.model} {v.year}
                    </h3>
                    {v.current_status && (
                      <span className="rounded-pill bg-brand-600/20 px-3 py-0.5 font-mono text-[10px] uppercase tracking-widest text-brand-400 border border-brand-700/40">
                        {v.current_status}
                      </span>
                    )}
                  </div>

                  {/* VIN */}
                  <p className="font-mono text-xs text-ink-400">
                    VIN:{' '}
                    <VinDisplay
                      vin={v.vin}
                      className="text-ink-200"
                    />
                  </p>

                  {/* Dates */}
                  <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-2 border-t border-ink-800 pt-3">
                    {v.purchase_date && (
                      <>
                        <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-500">{t('login.purchaseDate')}</dt>
                        <dd className="text-right text-sm font-500 text-ink-200">{formatDate(v.purchase_date)}</dd>
                      </>
                    )}
                    {v.container_loading_date && (
                      <>
                        <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-500">{t('cars.containerLoadingDate')}</dt>
                        <dd className="text-right text-sm font-500 text-ink-200">{formatDate(v.container_loading_date)}</dd>
                      </>
                    )}
                    {v.estimated_receive_date && (
                      <>
                        <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-500">{t('login.estimatedArrival')}</dt>
                        <dd className="text-right text-sm font-500 text-ink-200">{formatDate(v.estimated_receive_date)}</dd>
                      </>
                    )}
                    {v.receive_date && (
                      <>
                        <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-500">{t('login.arrived')}</dt>
                        <dd className="text-right text-sm font-500 text-ink-200">{formatDate(v.receive_date)}</dd>
                      </>
                    )}
                  </dl>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Login page ──────────────────────────────────────────────────────────
export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [username, setUsername]               = useState('');
  const [password, setPassword]               = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [rememberMe, setRememberMe]           = useState(false);
  const [privateCode, setPrivateCode]         = useState('');
  const [error, setError]                     = useState('');
  const [submitting, setSubmitting]           = useState(false);

  const [privateCodeResults, setPrivateCodeResults]   = useState(null);
  const [privateCodeLoading, setPrivateCodeLoading]   = useState(false);
  const [privateCodeError, setPrivateCodeError]       = useState('');

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await login(username, password);
      if (res.success) {
        navigate('/', { replace: true });
      } else {
        setError(res.message || t('login.loginFailed'));
      }
    } catch (err) {
      setError(err.response?.data?.message || t('login.loginFailedRetry'));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrivateCode = async (e) => {
    e.preventDefault();
    setPrivateCodeError('');

    if (!privateCode.trim()) {
      setPrivateCodeError(t('login.privateCodeError'));
      return;
    }

    setPrivateCodeLoading(true);
    try {
      const res = await api.post('/login/private-code', { code: privateCode.trim() });
      setPrivateCodeResults(res.data.data);
    } catch (err) {
      setPrivateCodeError(err.response?.data?.message || t('login.loginFailedRetry'));
    } finally {
      setPrivateCodeLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setPrivateCodeResults(null);
    setPrivateCodeError('');
  };

  if (loading) return null;
  if (user) return null;

  // ── Results view ────────────────────────────────────────────────────────────
  if (privateCodeResults) {
    return (
      <ResultsView
        results={privateCodeResults}
        privateCode={privateCode}
        onBack={handleBackToLogin}
        t={t}
      />
    );
  }

  // ── Login + private-code forms ───────────────────────────────────────────────
  return (
    <div className="grid min-h-screen w-full bg-ink-950 font-sans text-ink-100 antialiased lg:grid-cols-2">

      {/* ── LEFT PANEL (decorative, hidden on mobile) ─────────────────────── */}
      <div className="relative hidden overflow-hidden border-r border-ink-800 lg:block">
        {/* Background image */}
        <img
          src="https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=1200&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-ink-950 via-ink-950/70 to-transparent" />

        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle, #52525a 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Logo — top-left */}
        <div className="absolute left-0 top-0 p-12">
          <div className="flex items-center gap-3">
            <Mark className="h-7 w-11" />
            <div className="flex flex-col leading-none">
              <span className="font-display text-lg font-800 uppercase tracking-widest text-ink-50">
                SRL
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-brand-400">
                SORELI
              </span>
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="absolute bottom-12 left-12 right-12">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-500">
            Vehicle Logistics Platform
          </p>
          <p className="mt-3 font-display text-3xl font-800 uppercase leading-tight tracking-tight text-ink-100">
            Global Auto<br />Delivery
          </p>
          <div className="mt-6 h-px w-16 bg-brand-600" />
        </div>
      </div>

      {/* ── RIGHT PANEL ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center px-6 py-14 sm:px-10">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Mark className="h-6 w-10" />
            <div className="flex flex-col leading-none">
              <span className="font-display text-base font-800 uppercase tracking-widest text-ink-50">
                SRL
              </span>
              <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-brand-400">
                SORELI
              </span>
            </div>
          </div>

          {/* Section label */}
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand-500">
            ანგარიში
          </span>
          <h2 className="mt-2 font-display text-4xl font-800 uppercase tracking-tight text-ink-50">
            შესვლა
          </h2>

          {/* ── Error alert ──────────────────────────────────────────────── */}
          {error && (
            <div
              role="alert"
              className="mt-5 rounded-field border border-danger-700/60 bg-danger-950/70 px-4 py-3 font-mono text-xs text-danger-300"
            >
              {error}
            </div>
          )}

          {/* ── Login form ───────────────────────────────────────────────── */}
          <form onSubmit={handleLogin} className="mt-6 space-y-4" noValidate>

            {/* Username */}
            <Field label={t('login.usernamePlaceholder')} icon={IconMail}>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                required
                placeholder={t('login.usernamePlaceholder')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-full w-full bg-transparent text-sm font-500 text-ink-100 placeholder:text-ink-600 outline-none"
              />
            </Field>

            {/* Password */}
            <Field label={t('login.passwordPlaceholder')} icon={IconLock}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder={t('login.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-full w-full bg-transparent text-sm font-500 text-ink-100 placeholder:text-ink-600 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="ml-2 shrink-0 text-ink-500 transition-colors hover:text-ink-200 focus:outline-none focus-visible:text-ink-200"
              >
                {showPassword
                  ? <IconEyeOff className="h-4.5 w-4.5" />
                  : <IconEye    className="h-4.5 w-4.5" />}
              </button>
            </Field>

            {/* Remember me + forgot */}
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2.5 select-none">
                <span
                  role="checkbox"
                  aria-checked={rememberMe}
                  tabIndex={0}
                  onClick={() => setRememberMe((v) => !v)}
                  onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setRememberMe((v) => !v)}
                  className={[
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                    rememberMe
                      ? 'border-brand-500 bg-brand-600 text-white'
                      : 'border-ink-600 bg-ink-900',
                  ].join(' ')}
                >
                  {rememberMe && <IconCheck className="h-3 w-3" />}
                </span>
                <span className="text-sm text-ink-300">დამიმახსოვრე</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-sm text-brand-500 transition-colors hover:text-brand-400 focus:outline-none focus-visible:underline"
              >
                {t('login.resetPassword')}
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-btn bg-brand-600 font-display text-sm font-700 uppercase tracking-widest text-white shadow-[0_10px_30px_-8px_rgba(226,96,9,0.7)] transition-colors hover:bg-brand-500 active:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              {submitting ? t('login.loggingIn') : t('login.logIn')}
              {!submitting && <IconArrow className="h-5 w-5" />}
            </button>
          </form>

          {/* ── Divider ──────────────────────────────────────────────────── */}
          <div className="relative my-8 flex items-center">
            <div className="h-px flex-1 bg-ink-800" />
            <span className="mx-4 font-mono text-[10px] uppercase tracking-widest text-ink-600">
              {t('common.or')}
            </span>
            <div className="h-px flex-1 bg-ink-800" />
          </div>

          {/* ── Private-code error alert ──────────────────────────────────── */}
          {privateCodeError && (
            <div
              role="alert"
              className="mb-4 rounded-field border border-danger-700/60 bg-danger-950/70 px-4 py-3 font-mono text-xs text-danger-300"
            >
              {privateCodeError}
            </div>
          )}

          {/* ── Private-code form ─────────────────────────────────────────── */}
          <form onSubmit={handlePrivateCode} className="space-y-4">
            <Field label={t('login.privateCode')} icon={IconKey}>
              <input
                id="private-code"
                type="text"
                placeholder={t('login.privateCode')}
                value={privateCode}
                onChange={(e) => setPrivateCode(e.target.value)}
                className="h-full w-full bg-transparent text-sm font-500 text-ink-100 placeholder:text-ink-600 outline-none"
              />
            </Field>

            <button
              type="submit"
              disabled={privateCodeLoading}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-btn border border-ink-700 bg-ink-900 font-display text-sm font-700 uppercase tracking-widest text-ink-200 transition-colors hover:border-brand-600 hover:bg-ink-800 hover:text-brand-400 active:bg-ink-900 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              {privateCodeLoading ? t('login.privateCodeSearching') : t('common.search')}
              {!privateCodeLoading && (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
