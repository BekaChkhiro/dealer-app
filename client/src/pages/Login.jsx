import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
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

  const handlePrivateCode = (e) => {
    e.preventDefault();
    alert('Feature coming soon');
  };

  if (loading) return null;
  if (user) return null;

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
            <a href="#" className="reset-link" onClick={(e) => e.preventDefault()}>
              {t('login.resetPassword')}
            </a>
          </div>
        </form>

        <div className="or-divider">{t('common.or')}</div>

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

          <button type="submit" className="btn btn-success w-100">
            {t('common.search')}
          </button>
        </form>
      </div>
    </div>
  );
}
