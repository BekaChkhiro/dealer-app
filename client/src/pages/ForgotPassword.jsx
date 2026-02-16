import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import './ForgotPassword.css';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || t('forgotPassword.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-card">
        <h2>{t('forgotPassword.title')}</h2>
        <p className="subtitle">{t('forgotPassword.subtitle')}</p>

        {error && (
          <div className="alert alert-danger py-2" role="alert">
            {error}
          </div>
        )}

        {sent ? (
          <div className="alert alert-success py-2" role="alert">
            {t('forgotPassword.sent')}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <input
                type="email"
                className="form-control"
                placeholder={t('forgotPassword.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={submitting}
            >
              {submitting ? t('forgotPassword.sending') : t('forgotPassword.submit')}
            </button>
          </form>
        )}

        <Link to="/login" className="back-link">
          {t('forgotPassword.backToLogin')}
        </Link>
      </div>
    </div>
  );
}
