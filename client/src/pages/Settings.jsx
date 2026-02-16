import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import './Settings.css';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ka', label: 'ქართული' },
];

export default function Settings() {
  const { user, setUser } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const isAdmin = user?.role === 'admin';

  const [form, setForm] = useState({
    name: '',
    surname: '',
    email: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [totalUsers, setTotalUsers] = useState(null);

  // Initialize form from user
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        surname: user.surname || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  // Fetch user count for admin section
  useEffect(() => {
    if (isAdmin) {
      api.get('/users', { params: { limit: 1 } })
        .then(res => setTotalUsers(res.data.total || 0))
        .catch(() => {});
    }
  }, [isAdmin]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const res = await api.put('/profile', form);
      if (res.data.success) {
        setUser(prev => ({ ...prev, ...res.data.data }));
        setSuccess(t('settings.saved'));
      } else {
        setError(res.data.message || t('settings.error'));
      }
    } catch (err) {
      setError(err.response?.data?.message || t('settings.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <h2 className="settings-title">{t('settings.title')}</h2>

      {/* Profile Information */}
      <div className="settings-card">
        <div className="settings-card-title">{t('settings.profileInfo')}</div>

        {error && (
          <div className="alert alert-danger py-2" role="alert">{error}</div>
        )}
        {success && (
          <div className="alert alert-success py-2" role="alert">{success}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="settings-form-grid">
            <div className="mb-3">
              <label className="form-label">{t('settings.name')}</label>
              <input
                type="text"
                className="form-control"
                name="name"
                value={form.name}
                onChange={handleChange}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">{t('settings.surname')}</label>
              <input
                type="text"
                className="form-control"
                name="surname"
                value={form.surname}
                onChange={handleChange}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">{t('settings.email')}</label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={form.email}
                onChange={handleChange}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">{t('settings.phone')}</label>
              <input
                type="text"
                className="form-control"
                name="phone"
                value={form.phone}
                onChange={handleChange}
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? t('settings.saving') : t('settings.save')}
          </button>
        </form>
      </div>

      {/* Language Preference */}
      <div className="settings-card">
        <div className="settings-card-title">{t('settings.language')}</div>
        <div className="settings-language-options">
          {LANGUAGES.map(lang => (
            <label key={lang.code} className="settings-language-option">
              <input
                type="radio"
                name="language"
                value={lang.code}
                checked={language === lang.code}
                onChange={() => setLanguage(lang.code)}
              />
              <span>{lang.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* App Information */}
      <div className="settings-card">
        <div className="settings-card-title">{t('settings.appInfo')}</div>
        <div className="settings-info-grid">
          <div className="settings-info-item">
            <span className="settings-info-label">{t('settings.appName')}</span>
            <span className="settings-info-value">Dealer App</span>
          </div>
          <div className="settings-info-item">
            <span className="settings-info-label">{t('settings.version')}</span>
            <span className="settings-info-value">1.0.0</span>
          </div>
        </div>
      </div>

      {/* Admin Section */}
      {isAdmin && (
        <div className="settings-card">
          <div className="settings-card-title">{t('settings.adminSection')}</div>
          <div className="settings-info-grid">
            <div className="settings-info-item">
              <span className="settings-info-label">{t('settings.role')}</span>
              <span className="settings-info-value settings-role-badge admin">Admin</span>
            </div>
            <div className="settings-info-item">
              <span className="settings-info-label">{t('settings.totalUsers')}</span>
              <span className="settings-info-value">{totalUsers != null ? totalUsers : '...'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
