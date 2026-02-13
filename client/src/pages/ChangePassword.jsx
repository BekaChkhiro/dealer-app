import { useState } from 'react';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';
import './ChangePassword.css';

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== repeatPassword) {
      setError(t('changePassword.mismatch'));
      return;
    }

    if (newPassword.length < 4) {
      setError(t('changePassword.tooShort'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      if (res.data.success) {
        setSuccess(t('changePassword.success'));
        setOldPassword('');
        setNewPassword('');
        setRepeatPassword('');
      } else {
        setError(res.data.message || t('changePassword.failed'));
      }
    } catch (err) {
      setError(err.response?.data?.message || t('changePassword.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="change-password-page">
      <div className="change-password-card">
        <img
          src="/static/icons/change-pass.webp"
          alt="Change Password"
          className="change-password-illustration"
          onError={(e) => { e.target.style.display = 'none'; }}
        />

        <h3>{t('changePassword.title')}</h3>

        {error && (
          <div className="alert alert-danger py-2" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success py-2" role="alert">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3 password-wrapper">
            <input
              type={showOld ? 'text' : 'password'}
              className="form-control"
              placeholder={t('changePassword.oldPassword')}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowOld(!showOld)}
              tabIndex={-1}
            >
              {showOld ? '\u{1F648}' : '\u{1F441}'}
            </button>
          </div>

          <div className="mb-3 password-wrapper">
            <input
              type={showNew ? 'text' : 'password'}
              className="form-control"
              placeholder={t('changePassword.newPassword')}
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
              type={showRepeat ? 'text' : 'password'}
              className="form-control"
              placeholder={t('changePassword.repeatPassword')}
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowRepeat(!showRepeat)}
              tabIndex={-1}
            >
              {showRepeat ? '\u{1F648}' : '\u{1F441}'}
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={submitting}
          >
            {submitting ? t('changePassword.changing') : t('changePassword.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
