import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import ActionButtons from '../components/ActionButtons';
import './Users.css';

const EMPTY_FORM = {
  name: '',
  surname: '',
  email: '',
  username: '',
  password: '',
  phone: '',
  calculator_category: '',
  role: 'user',
  identity_number: '',
  superviser_fee: '',
};

function formatPrice(value) {
  if (value == null) return '—';
  return `$${Number(value).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function Users() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const columns = [
    { key: 'id', label: t('users.id'), sortable: true },
    { key: 'name', label: t('users.fullname'), sortable: true, render: (row) => [row.name, row.surname].filter(Boolean).join(' ') || '—' },
    { key: 'email', label: t('users.email'), sortable: true },
    { key: 'username', label: t('users.username'), sortable: true },
    { key: 'superviser_fee', label: t('users.supFee'), sortable: true, align: 'right', render: (row) => formatPrice(row.superviser_fee) },
    { key: 'last_login_time', label: t('users.lastLoginDate'), sortable: true, render: (row) => formatDate(row.last_login_time) },
    { key: 'last_purchase_date', label: t('users.lastPurchaseDate'), sortable: true, render: (row) => formatDate(row.last_purchase_date) },
    { key: 'role', label: t('users.role'), sortable: true, render: (row) => row.role ? row.role.charAt(0).toUpperCase() + row.role.slice(1) : '—' },
  ];

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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = { limit, page, asc: sortDir, sort_by: sortBy };
      if (keyword) params.keyword = keyword;
      const res = await api.get('/users', { params });
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [limit, page, keyword, sortBy, sortDir]);

  useEffect(() => { fetchData(); }, [fetchData]);

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
    if (action === 'view') {
      navigate(`/users/${row.id}`);
      return;
    }
    if (action === 'edit') {
      setEditRow(row);
      setFormData({
        name: row.name || '',
        surname: row.surname || '',
        email: row.email || '',
        username: row.username || '',
        password: '',
        phone: row.phone || '',
        calculator_category: row.calculator_category || '',
        role: row.role || 'user',
        identity_number: row.identity_number || '',
        superviser_fee: row.superviser_fee != null ? String(row.superviser_fee) : '',
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

    setSaving(true);
    try {
      const payload = {
        name: formData.name || null,
        surname: formData.surname || null,
        email: formData.email,
        username: formData.username,
        phone: formData.phone || null,
        calculator_category: formData.calculator_category || null,
        role: formData.role || 'user',
        identity_number: formData.identity_number || null,
        superviser_fee: formData.superviser_fee !== '' ? Number(formData.superviser_fee) : null,
      };

      if (editRow) {
        if (formData.password) payload.password = formData.password;
        await api.put(`/users/${editRow.id}`, payload);
      } else {
        payload.password = formData.password;
        await api.post('/users', payload);
      }
      setEditModal(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to save user';
      setFormError(typeof msg === 'string' ? msg : 'Failed to save user');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/users/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      console.error('Delete error:', err);
    }
  }

  const actions = isAdmin
    ? [
        { key: 'view', label: t('userDetail.view') },
        { key: 'edit', label: t('common.edit') },
        { key: 'delete', label: t('common.delete') },
      ]
    : [];

  return (
    <div>
      <h2 className="mb-4">{t('users.title')}</h2>

      <ActionButtons
        showFilters={false}
        showExport={false}
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
        <div className="users-modal-overlay" onClick={() => setEditModal(false)}>
          <div className="users-modal" onClick={e => e.stopPropagation()}>
            <div className="users-modal-header">
              <h5>{editRow ? t('users.editUser') : t('users.addNewUser')}</h5>
              <button className="users-modal-close" onClick={() => setEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="users-modal-body">
                {formError && (
                  <div className="alert alert-danger py-2 mb-3">{formError}</div>
                )}
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('users.name')}</label>
                    <input type="text" className="form-control" name="name" value={formData.name} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('users.surname')}</label>
                    <input type="text" className="form-control" name="surname" value={formData.surname} onChange={handleFormChange} />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('users.email')} <span className="text-danger">*</span></label>
                    <input type="email" className="form-control" name="email" value={formData.email} onChange={handleFormChange} required />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('users.username')} <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="username" value={formData.username} onChange={handleFormChange} required />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">
                      {t('users.password')} {!editRow && <span className="text-danger">*</span>}
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      name="password"
                      value={formData.password}
                      onChange={handleFormChange}
                      required={!editRow}
                      placeholder={editRow ? t('users.leaveBlank') : ''}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('users.phone')}</label>
                    <input type="text" className="form-control" name="phone" value={formData.phone} onChange={handleFormChange} />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('users.role')}</label>
                    <select className="form-select" name="role" value={formData.role} onChange={handleFormChange}>
                      <option value="user">{t('users.user')}</option>
                      <option value="admin">{t('users.admin')}</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('users.calculatorCategory')}</label>
                    <input type="text" className="form-control" name="calculator_category" value={formData.calculator_category} onChange={handleFormChange} />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('users.identityNumber')}</label>
                    <input type="text" className="form-control" name="identity_number" value={formData.identity_number} onChange={handleFormChange} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('users.supervisorFee')}</label>
                    <input type="number" className="form-control" name="superviser_fee" value={formData.superviser_fee} onChange={handleFormChange} step="0.01" min="0" />
                  </div>
                </div>
              </div>
              <div className="users-modal-footer">
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
        <div className="users-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="users-modal users-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="users-modal-header">
              <h5>{t('users.deleteUser')}</h5>
              <button className="users-modal-close" onClick={() => setDeleteConfirm(null)}>&times;</button>
            </div>
            <div className="users-modal-body">
              <p>{t('users.confirmDeleteUser')}</p>
              <p className="text-muted mb-0">
                {[deleteConfirm.name, deleteConfirm.surname].filter(Boolean).join(' ')}
                {deleteConfirm.email && ` — ${deleteConfirm.email}`}
              </p>
            </div>
            <div className="users-modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>{t('common.cancel')}</button>
              <button className="btn btn-danger" onClick={handleDelete}>{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
