import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import './ResetPassword.css';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError(t('resetPassword.mismatch'));
      return;
    }

    if (newPassword.length < 4) {
      setError(t('resetPassword.tooShort'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/reset-password', {
        token,
        new_password: newPassword,
      });
      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      } else {
        setError(res.data.message || t('resetPassword.error'));
      }
    } catch (err) {
      setError(err.response?.data?.message || t('resetPassword.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-card">
        <h2>{t('resetPassword.title')}</h2>
        <p className="subtitle">{t('resetPassword.subtitle')}</p>

        {error && (
          <div className="alert alert-danger py-2" role="alert">
            {error}
          </div>
        )}

        {success ? (
          <div className="alert alert-success py-2" role="alert">
            {t('resetPassword.success')}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-3 password-wrapper">
              <input
                type={showNew ? 'text' : 'password'}
                className="form-control"
                placeholder={t('resetPassword.newPassword')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowNew(!showNew)}
                tabIndex={-1}
              >
                {showNew ? '\u{1F648}' : '\u{1F441}'}
              </button>
            </div>

            <div className="mb-3 password-wrapper">
              <input
                type={showConfirm ? 'text' : 'password'}
                className="form-control"
                placeholder={t('resetPassword.confirmPassword')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirm(!showConfirm)}
                tabIndex={-1}
              >
                {showConfirm ? '\u{1F648}' : '\u{1F441}'}
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={submitting}
            >
              {submitting ? t('resetPassword.submitting') : t('resetPassword.submit')}
            </button>
          </form>
        )}

        <Link to={success ? '/login' : '/forgot-password'} className="back-link">
          {success ? t('resetPassword.goToLogin') : t('resetPassword.backToForgot')}
        </Link>
      </div>
    </div>
  );
}
