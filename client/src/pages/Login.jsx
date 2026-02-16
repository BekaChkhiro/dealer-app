import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import './Login.css';

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [privateCode, setPrivateCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [privateCodeResults, setPrivateCodeResults] = useState(null);
  const [privateCodeLoading, setPrivateCodeLoading] = useState(false);
  const [privateCodeError, setPrivateCodeError] = useState('');

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

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) return null;
  if (user) return null;

  // Show vehicle tracking results
  if (privateCodeResults) {
    return (
      <div className="login-page">
        <div className="login-card private-code-results">
          <div className="results-header">
            <button className="back-btn" onClick={handleBackToLogin}>
              ← {t('login.backToLogin')}
            </button>
            <h2>{t('login.vehicleTracking')}</h2>
            <p className="identity-display">{privateCode}</p>
          </div>

          {privateCodeResults.length === 0 ? (
            <div className="no-results">{t('login.privateCodeNotFound')}</div>
          ) : (
            <div className="vehicle-list">
              {privateCodeResults.map((v) => (
                <div key={v.id} className="vehicle-track-card">
                  <div className="vehicle-track-image">
                    {v.profile_image_url ? (
                      <img src={v.profile_image_url} alt={`${v.mark} ${v.model}`} />
                    ) : (
                      <div className="vehicle-placeholder">No Image</div>
                    )}
                  </div>
                  <div className="vehicle-track-info">
                    <div className="vehicle-track-name">
                      {v.mark} {v.model} {v.year}
                    </div>
                    <div className="vehicle-track-vin">VIN: {v.vin || '—'}</div>
                    {v.current_status && (
                      <span className="status-badge">{v.current_status}</span>
                    )}
                    <div className="vehicle-track-dates">
                      {v.purchase_date && (
                        <div className="date-row">
                          <span className="date-label">{t('login.purchaseDate')}:</span>
                          <span>{formatDate(v.purchase_date)}</span>
                        </div>
                      )}
                      {v.container_loading_date && (
                        <div className="date-row">
                          <span className="date-label">{t('cars.containerLoadingDate')}:</span>
                          <span>{formatDate(v.container_loading_date)}</span>
                        </div>
                      )}
                      {v.estimated_receive_date && (
                        <div className="date-row">
                          <span className="date-label">{t('login.estimatedArrival')}:</span>
                          <span>{formatDate(v.estimated_receive_date)}</span>
                        </div>
                      )}
                      {v.receive_date && (
                        <div className="date-row">
                          <span className="date-label">{t('login.arrived')}:</span>
                          <span>{formatDate(v.receive_date)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>{t('login.title')}</h2>

        {error && (
          <div className="alert alert-danger py-2" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder={t('login.usernamePlaceholder')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="mb-3 password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-control"
              placeholder={t('login.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 mb-2"
            disabled={submitting}
          >
            {submitting ? t('login.loggingIn') : t('login.logIn')}
          </button>

          <div className="text-end mb-1">
            <Link to="/forgot-password" className="reset-link">
              {t('login.resetPassword')}
            </Link>
          </div>
        </form>

        <div className="or-divider">{t('common.or')}</div>

        {privateCodeError && (
          <div className="alert alert-danger py-2" role="alert">
            {privateCodeError}
          </div>
        )}

        <form onSubmit={handlePrivateCode}>
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder={t('login.privateCode')}
              value={privateCode}
              onChange={(e) => setPrivateCode(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-success w-100" disabled={privateCodeLoading}>
            {privateCodeLoading ? t('login.privateCodeSearching') : t('common.search')}
          </button>
        </form>
      </div>
    </div>
  );
}
