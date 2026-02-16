import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import './UserDetail.css';

function formatPrice(value) {
  if (value == null) return '—';
  return `$${Number(value).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { t } = useTranslation();
  const isAdmin = currentUser?.role === 'admin';

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Vehicles state
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesTotal, setVehiclesTotal] = useState(0);
  const [vehiclesPage, setVehiclesPage] = useState(1);
  const [vehiclesLimit, setVehiclesLimit] = useState(10);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);

  // Transactions state
  const [transactions, setTransactions] = useState([]);
  const [transactionsTotal, setTransactionsTotal] = useState(0);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsLimit, setTransactionsLimit] = useState(10);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // Balance adjustment state
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState('credit');
  const [adjustNote, setAdjustNote] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState(null);
  const [adjustSuccess, setAdjustSuccess] = useState(null);

  // Fetch user
  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/users/${id}`);
        setUserData(res.data.data);
      } catch (err) {
        if (err.response?.status === 404) {
          setError('notFound');
        } else {
          setError('loadError');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [id]);

  // Fetch vehicles
  const fetchVehicles = useCallback(async () => {
    try {
      setVehiclesLoading(true);
      const res = await api.get('/vehicles', {
        params: { dealer_id: id, limit: vehiclesLimit, page: vehiclesPage }
      });
      setVehicles(res.data.data || []);
      setVehiclesTotal(res.data.total || 0);
    } catch {
      setVehicles([]);
    } finally {
      setVehiclesLoading(false);
    }
  }, [id, vehiclesLimit, vehiclesPage]);

  useEffect(() => { if (userData) fetchVehicles(); }, [fetchVehicles, userData]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    if (!userData) return;
    try {
      setTransactionsLoading(true);
      const res = await api.get('/transactions', {
        params: { payer: userData.username, limit: transactionsLimit, page: transactionsPage }
      });
      setTransactions(res.data.data || []);
      setTransactionsTotal(res.data.total || 0);
    } catch {
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  }, [userData, transactionsLimit, transactionsPage]);

  useEffect(() => { if (userData) fetchTransactions(); }, [fetchTransactions, userData]);

  // Balance adjustment handler
  const handleAdjustBalance = async (e) => {
    e.preventDefault();
    const num = Number(adjustAmount);
    if (!num || num <= 0) {
      setAdjustError(t('userDetail.invalidAmount'));
      return;
    }
    try {
      setAdjustLoading(true);
      setAdjustError(null);
      setAdjustSuccess(null);
      const res = await api.post(`/users/${id}/balance`, {
        amount: num,
        type: adjustType,
        note: adjustNote,
      });
      setUserData((prev) => ({
        ...prev,
        balance: res.data.data.balance,
        debt: res.data.data.debt,
      }));
      setAdjustSuccess(t('userDetail.balanceAdjusted'));
      setAdjustAmount('');
      setAdjustNote('');
      setShowAdjustForm(false);
      fetchTransactions();
    } catch {
      setAdjustError(t('userDetail.adjustError'));
    } finally {
      setAdjustLoading(false);
    }
  };

  // Vehicle columns
  const vehicleColumns = [
    { key: 'profile_image_url', label: '', type: 'image', width: '50px' },
    {
      key: 'mark',
      label: t('cars.vehicleName'),
      render: (row) => [row.mark, row.model, row.year].filter(Boolean).join(' ') || '—',
    },
    { key: 'vin', label: t('cars.vin') },
    { key: 'current_status', label: t('cars.status'), render: (row) => row.current_status ? row.current_status.replace('_', ' ') : '—' },
    { key: 'is_fully_paid', label: t('cars.paid'), render: (row) => row.is_fully_paid ? t('common.yes') : row.is_partially_paid ? 'Partial' : t('common.no') },
    { key: 'total_price', label: t('cars.total'), align: 'right', render: (row) => formatPrice(row.total_price) },
    { key: 'debt_amount', label: t('cars.debt'), align: 'right', render: (row) => formatPrice(row.debt_amount) },
  ];

  // Transaction columns
  const transactionColumns = [
    { key: 'id', label: t('transactions.id'), width: '60px' },
    { key: 'create_date', label: t('transactions.date'), render: (row) => formatDate(row.create_date) },
    { key: 'vin', label: t('transactions.vin'), render: (row) => row.vin || t('transactions.noVin') },
    { key: 'mark', label: t('transactions.mark') },
    { key: 'model', label: t('transactions.model') },
    { key: 'paid_amount', label: t('transactions.amount'), align: 'right', render: (row) => formatPrice(row.paid_amount) },
    { key: 'payment_type', label: t('transactions.paymentType'), render: (row) => row.payment_type?.replace('_', ' ') || '—' },
    {
      key: 'addToBalanseAmount',
      label: t('userDetail.balanceImpact'),
      align: 'right',
      render: (row) => {
        const val = Number(row.addToBalanseAmount);
        if (!val) return '—';
        const color = val > 0 ? '#198754' : '#dc3545';
        const prefix = val > 0 ? '+' : '';
        return <span style={{ color, fontWeight: 600 }}>{prefix}{formatPrice(val)}</span>;
      },
    },
  ];

  if (loading) {
    return (
      <div className="user-detail-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-detail-error">
        <h3>{error === 'notFound' ? t('userDetail.notFound') : t('userDetail.loadError')}</h3>
        <Link to="/users" className="btn btn-primary">{t('userDetail.backToUsers')}</Link>
      </div>
    );
  }

  if (!userData) return null;

  const fullName = [userData.name, userData.surname].filter(Boolean).join(' ') || userData.username;
  const initials = [userData.name, userData.surname]
    .filter(Boolean)
    .map(n => n.charAt(0).toUpperCase())
    .join('') || userData.username?.charAt(0).toUpperCase() || '?';

  return (
    <div>
      {/* Back link */}
      <Link to="/users" className="user-detail-back">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
        </svg>
        {t('userDetail.backToUsers')}
      </Link>

      {/* Header */}
      <div className="user-detail-header">
        <h2>{fullName}</h2>
        <span className={`user-detail-role-badge ${userData.role}`}>
          {userData.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : 'User'}
        </span>
        {isAdmin && (
          <Link to="/users" className="btn btn-sm btn-outline-primary">
            {t('common.edit')}
          </Link>
        )}
      </div>

      {/* Top row: Profile + Financial + Account */}
      <div className="user-detail-top-row">
        {/* Profile card */}
        <div className="user-detail-card">
          <div className="user-detail-card-title">{t('userDetail.profileInfo')}</div>
          <div className="user-detail-profile-header">
            <div className="user-detail-avatar">{initials}</div>
            <div>
              <div className="user-detail-profile-name">{fullName}</div>
              <div className="user-detail-profile-email">{userData.email || '—'}</div>
            </div>
          </div>
          <div className="user-detail-info-grid">
            <InfoItem label={t('users.username')} value={userData.username} />
            <InfoItem label={t('users.phone')} value={userData.phone} />
            <InfoItem label={t('users.email')} value={userData.email} />
            <InfoItem label={t('users.role')} value={userData.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : '—'} />
          </div>
        </div>

        {/* Financial card */}
        <div className="user-detail-card">
          <div className="user-detail-section-header">
            <div className="user-detail-card-title">{t('userDetail.financialSummary')}</div>
            {isAdmin && (
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => { setShowAdjustForm(!showAdjustForm); setAdjustError(null); setAdjustSuccess(null); }}
              >
                {t('userDetail.adjustBalance')}
              </button>
            )}
          </div>
          <div className="user-detail-financial-grid">
            <div className="user-detail-financial-item">
              <div className="user-detail-financial-label">{t('userDetail.balance')}</div>
              <div className={`user-detail-financial-value ${Number(userData.balance) > 0 ? 'positive' : Number(userData.balance) < 0 ? 'negative' : 'neutral'}`}>
                {formatPrice(userData.balance)}
              </div>
            </div>
            <div className="user-detail-financial-item">
              <div className="user-detail-financial-label">{t('userDetail.debt')}</div>
              <div className={`user-detail-financial-value ${Number(userData.debt) > 0 ? 'negative' : 'neutral'}`}>
                {formatPrice(userData.debt)}
              </div>
            </div>
            <div className="user-detail-financial-item">
              <div className="user-detail-financial-label">{t('userDetail.supervisorFee')}</div>
              <div className="user-detail-financial-value neutral">
                {formatPrice(userData.superviser_fee)}
              </div>
            </div>
          </div>
          {adjustSuccess && <div className="balance-adjust-success">{adjustSuccess}</div>}
          {showAdjustForm && (
            <form className="balance-adjust-form" onSubmit={handleAdjustBalance}>
              {adjustError && <div className="balance-adjust-error">{adjustError}</div>}
              <div className="balance-adjust-row">
                <div className="balance-adjust-field">
                  <label>{t('userDetail.adjustType')}</label>
                  <select value={adjustType} onChange={(e) => setAdjustType(e.target.value)}>
                    <option value="credit">{t('userDetail.credit')}</option>
                    <option value="debit">{t('userDetail.debit')}</option>
                  </select>
                </div>
                <div className="balance-adjust-field">
                  <label>{t('transactions.amount')}</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="balance-adjust-field flex-grow">
                  <label>{t('userDetail.note')}</label>
                  <input
                    type="text"
                    value={adjustNote}
                    onChange={(e) => setAdjustNote(e.target.value)}
                    placeholder={t('userDetail.notePlaceholder')}
                  />
                </div>
                <button type="submit" className="btn btn-sm btn-primary balance-adjust-submit" disabled={adjustLoading}>
                  {adjustLoading ? t('common.saving') : t('userDetail.submit')}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Account card */}
        <div className="user-detail-card">
          <div className="user-detail-card-title">{t('userDetail.accountInfo')}</div>
          <div className="user-detail-info-grid">
            <InfoItem label={t('userDetail.signupDate')} value={formatDate(userData.signup_date)} />
            <InfoItem label={t('userDetail.lastLogin')} value={formatDate(userData.last_login_time)} />
            <InfoItem label={t('userDetail.lastPurchase')} value={formatDate(userData.last_purchase_date)} />
            <InfoItem label={t('userDetail.calculatorCategory')} value={userData.calculator_category} />
            <InfoItem label={t('userDetail.identityNumber')} value={userData.identity_number} />
            <InfoItem label={t('userDetail.creator')} value={userData.creator} />
          </div>
        </div>
      </div>

      {/* Vehicles table */}
      <div className="user-detail-card">
        <div className="user-detail-section-header">
          <div className="user-detail-card-title">{t('userDetail.vehicles')}</div>
          {vehiclesTotal > 0 && (
            <Link to="/cars" className="user-detail-view-all">{t('userDetail.viewAll')}</Link>
          )}
        </div>
        <DataTable
          columns={vehicleColumns}
          data={vehicles}
          loading={vehiclesLoading}
          actions={[{ key: 'view', label: t('carDetail.view') }]}
          onAction={(action, row) => {
            if (action === 'view') navigate(`/cars/${row.id}`);
          }}
        />
        {vehiclesTotal > vehiclesLimit && (
          <Pagination
            page={vehiclesPage}
            total={vehiclesTotal}
            limit={vehiclesLimit}
            onPageChange={setVehiclesPage}
            onLimitChange={(l) => { setVehiclesLimit(l); setVehiclesPage(1); }}
          />
        )}
      </div>

      {/* Transactions table */}
      <div className="user-detail-card">
        <div className="user-detail-section-header">
          <div className="user-detail-card-title">{t('userDetail.transactions')}</div>
          {transactionsTotal > 0 && (
            <Link to="/transactions" className="user-detail-view-all">{t('userDetail.viewAll')}</Link>
          )}
        </div>
        <DataTable
          columns={transactionColumns}
          data={transactions}
          loading={transactionsLoading}
        />
        {transactionsTotal > transactionsLimit && (
          <Pagination
            page={transactionsPage}
            total={transactionsTotal}
            limit={transactionsLimit}
            onPageChange={setTransactionsPage}
            onLimitChange={(l) => { setTransactionsLimit(l); setTransactionsPage(1); }}
          />
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="user-detail-info-item">
      <span className="user-detail-info-label">{label}</span>
      <span className="user-detail-info-value">
        {value == null || value === '' ? '—' : value}
      </span>
    </div>
  );
}

export default UserDetail;
