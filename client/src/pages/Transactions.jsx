import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import ActionButtons from '../components/ActionButtons';
import './Transactions.css';

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatCurrency(value) {
  if (value == null || value === '') return '—';
  const num = Number(value);
  if (isNaN(num)) return '—';
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const EMPTY_FORM = {
  payer: '',
  vin: '',
  mark: '',
  model: '',
  year: '',
  buyer: '',
  personal_number: '',
  paid_amount: '',
  payment_type: 'car_amount',
  addToBalanseAmount: '',
};

function Transactions() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role === 'admin';

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('desc');

  const [editModal, setEditModal] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [vinCodes, setVinCodes] = useState([]);

  const PAYMENT_TYPE_OPTIONS = [
    { value: 'car_amount', label: t('transactions.carAmount') },
    { value: 'shipping', label: t('transactions.shipping') },
    { value: 'customs', label: t('transactions.customs') },
    { value: 'balance', label: t('transactions.balance') },
  ];

  const PAYMENT_TYPE_LABELS = {
    car_amount: t('transactions.carAmount'),
    shipping: t('transactions.shipping'),
    customs: t('transactions.customs'),
    balance: t('transactions.balance'),
  };

  function PaymentTypeBadge({ type }) {
    return (
      <span className={`transactions-payment-badge transactions-payment-${type}`}>
        {PAYMENT_TYPE_LABELS[type] || type || '—'}
      </span>
    );
  }

  const columns = [
    { key: 'id', label: t('transactions.id'), sortable: true },
    { key: 'payer', label: t('transactions.payedId'), sortable: true },
    { key: 'create_date', label: t('transactions.date'), sortable: true, render: (row) => formatDate(row.create_date) },
    { key: 'vin', label: t('transactions.vin'), sortable: true },
    { key: 'mark', label: t('transactions.mark'), sortable: true },
    { key: 'model', label: t('transactions.model'), sortable: true },
    { key: 'year', label: t('transactions.year'), sortable: true },
    { key: 'personal_number', label: t('transactions.personalNumber'), sortable: true },
    { key: 'paid_amount', label: t('transactions.amount'), sortable: true, render: (row) => formatCurrency(row.paid_amount) },
    { key: 'payment_type', label: t('transactions.paymentType'), sortable: true, render: (row) => <PaymentTypeBadge type={row.payment_type} /> },
  ];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = { limit, page, asc: sortDir, sort_by: sortBy };
      if (keyword) params.keyword = keyword;
      const res = await api.get('/transactions', { params });
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [limit, page, keyword, sortBy, sortDir]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    async function fetchVinCodes() {
      try {
        const res = await api.get('/vin-codes/booking');
        setVinCodes(res.data.data || []);
      } catch (err) {
        console.error('Error fetching VIN codes:', err);
      }
    }
    fetchVinCodes();
  }, []);

  function handleSearch(value) {
    setKeyword(value);
    setPage(1);
  }

  function handleSort(key, dir) {
    setSortBy(key);
    setSortDir(dir);
    setPage(1);
  }

  function handlePageChange(newPage) {
    setPage(newPage);
  }

  function handleLimitChange(newLimit) {
    setLimit(newLimit);
    setPage(1);
  }

  function handleAddNew() {
    setEditRow(null);
    setFormData(EMPTY_FORM);
    setFormError('');
    setEditModal(true);
  }

  function handleAction(action, row) {
    if (action === 'edit') {
      setEditRow(row);
      setFormData({
        payer: row.payer || '',
        vin: row.vin || '',
        mark: row.mark || '',
        model: row.model || '',
        year: row.year || '',
        buyer: row.buyer || '',
        personal_number: row.personal_number || '',
        paid_amount: row.paid_amount || '',
        payment_type: row.payment_type || 'car_amount',
        addToBalanseAmount: row.addToBalanseAmount || '',
      });
      setFormError('');
      setEditModal(true);
    } else if (action === 'delete') {
      setDeleteConfirm(row);
    }
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!formData.payer.trim()) {
      setFormError(t('transactions.payerRequired'));
      return;
    }

    setSaving(true);
    try {
      const payload = { ...formData };

      if (editRow) {
        await api.put(`/transactions/${editRow.id}`, payload);
      } else {
        await api.post('/transactions', payload);
      }
      setEditModal(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to save transaction';
      setFormError(typeof msg === 'string' ? msg : 'Failed to save transaction');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/transactions/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      console.error('Delete error:', err);
    }
  }

  const actions = isAdmin
    ? [
        { key: 'edit', label: t('common.edit') },
        { key: 'delete', label: t('common.delete') },
      ]
    : [];

  return (
    <div>
      <h2 className="mb-4">{t('transactions.title')}</h2>

      <ActionButtons
        showAddNew={isAdmin}
        showSearch={true}
        searchValue={keyword}
        onAddNew={handleAddNew}
        onSearch={handleSearch}
      />

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        actions={actions}
        onAction={handleAction}
      />

      <Pagination
        page={page}
        total={total}
        limit={limit}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />

      {/* Add/Edit Modal */}
      {editModal && (
        <div className="transactions-modal-overlay" onClick={() => setEditModal(false)}>
          <div className="transactions-modal" onClick={e => e.stopPropagation()}>
            <div className="transactions-modal-header">
              <h5>{editRow ? t('transactions.editTransaction') : t('transactions.addNewTransaction')}</h5>
              <button className="transactions-modal-close" onClick={() => setEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="transactions-modal-body">
                {formError && (
                  <div className="alert alert-danger py-2 mb-3">{formError}</div>
                )}
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('transactions.payer')} <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="payer" value={formData.payer} onChange={handleFormChange} required />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('transactions.paymentType')} <span className="text-danger">*</span></label>
                    <select className="form-select" name="payment_type" value={formData.payment_type} onChange={handleFormChange} required>
                      {PAYMENT_TYPE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('transactions.vin')}</label>
                    <select className="form-select" name="vin" value={formData.vin} onChange={handleFormChange}>
                      <option value="">— Select VIN —</option>
                      {vinCodes.map(v => (
                        <option key={v.vin} value={v.vin}>{v.vin}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('transactions.personalNumber')}</label>
                    <input type="text" className="form-control" name="personal_number" value={formData.personal_number} onChange={handleFormChange} />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('transactions.mark')}</label>
                    <input type="text" className="form-control" name="mark" value={formData.mark} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('transactions.model')}</label>
                    <input type="text" className="form-control" name="model" value={formData.model} onChange={handleFormChange} />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('transactions.year')}</label>
                    <input type="text" className="form-control" name="year" value={formData.year} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('transactions.buyer')}</label>
                    <input type="text" className="form-control" name="buyer" value={formData.buyer} onChange={handleFormChange} />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('transactions.paidAmount')}</label>
                    <input type="number" step="0.01" className="form-control" name="paid_amount" value={formData.paid_amount} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('transactions.addToBalance')}</label>
                    <input type="number" step="0.01" className="form-control" name="addToBalanseAmount" value={formData.addToBalanseAmount} onChange={handleFormChange} />
                  </div>
                </div>
              </div>
              <div className="transactions-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditModal(false)}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? t('common.saving') : (editRow ? t('common.update') : t('common.create'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="transactions-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="transactions-modal transactions-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="transactions-modal-header">
              <h5>{t('transactions.deleteTransaction')}</h5>
              <button className="transactions-modal-close" onClick={() => setDeleteConfirm(null)}>&times;</button>
            </div>
            <div className="transactions-modal-body">
              <p>{t('transactions.confirmDeleteTransaction')}</p>
              <p className="text-muted mb-0">
                {deleteConfirm.payer} — {deleteConfirm.vin || t('transactions.noVin')}
              </p>
            </div>
            <div className="transactions-modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>{t('common.cancel')}</button>
              <button className="btn btn-danger" onClick={handleDelete}>{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transactions;
