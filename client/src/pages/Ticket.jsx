import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import ActionButtons from '../components/ActionButtons';
import FilterPanel, { ActiveFilters } from '../components/FilterPanel';
import './Ticket.css';

const EMPTY_FORM = {
  subject: '',
  message: '',
  priority: 'medium',
  status: 'open',
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function StatusBadge({ status, t }) {
  const map = {
    open: { cls: 'ticket-badge-info', label: t('ticket.open') },
    in_progress: { cls: 'ticket-badge-warning', label: t('ticket.inProgress') },
    resolved: { cls: 'ticket-badge-success', label: t('ticket.resolved') },
    closed: { cls: 'ticket-badge-secondary', label: t('ticket.closed') },
  };
  const info = map[status] || { cls: 'ticket-badge-secondary', label: status };
  return <span className={`ticket-badge ${info.cls}`}>{info.label}</span>;
}

function PriorityBadge({ priority, t }) {
  const map = {
    low: { cls: 'ticket-badge-secondary', label: t('ticket.low') },
    medium: { cls: 'ticket-badge-warning', label: t('ticket.medium') },
    high: { cls: 'ticket-badge-danger', label: t('ticket.high') },
  };
  const info = map[priority] || { cls: 'ticket-badge-secondary', label: priority };
  return <span className={`ticket-badge ${info.cls}`}>{info.label}</span>;
}

function Ticket() {
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
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
  });

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [editModal, setEditModal] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = { limit, page, asc: sortDir, sort_by: sortBy };
      if (keyword) params.keyword = keyword;
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      const res = await api.get('/tickets', { params });
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [limit, page, keyword, sortBy, sortDir, filters]);

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

  function handleFilter() {
    setShowFilterPanel(true);
  }

  function handleApplyFilters(newFilters) {
    setFilters(newFilters);
    setPage(1);
    setShowFilterPanel(false);
  }

  function handleClearFilters() {
    setFilters({ status: '', priority: '' });
    setPage(1);
    setShowFilterPanel(false);
  }

  function handleRemoveFilter(key) {
    setFilters((prev) => ({ ...prev, [key]: '' }));
    setPage(1);
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const columns = [
    { key: 'id', label: t('ticket.id'), sortable: true },
    { key: 'subject', label: t('ticket.subject'), sortable: true },
    { key: 'created_by', label: t('ticket.createdBy'), sortable: false, render: (row) => {
      if (row.user_name || row.user_surname) {
        return `${row.user_name || ''} ${row.user_surname || ''}`.trim();
      }
      return '—';
    }},
    { key: 'status', label: t('ticket.status'), sortable: true, render: (row) => <StatusBadge status={row.status} t={t} /> },
    { key: 'priority', label: t('ticket.priority'), sortable: true, render: (row) => <PriorityBadge priority={row.priority} t={t} /> },
    { key: 'created_at', label: t('ticket.createdAt'), sortable: true, render: (row) => formatDate(row.created_at) },
    { key: 'updated_at', label: t('ticket.updatedAt'), sortable: true, render: (row) => formatDate(row.updated_at) },
  ];

  const filterFields = [
    { type: 'select', key: 'status', label: t('ticket.status'), options: [
      { value: 'open', label: t('ticket.open') },
      { value: 'in_progress', label: t('ticket.inProgress') },
      { value: 'resolved', label: t('ticket.resolved') },
      { value: 'closed', label: t('ticket.closed') },
    ]},
    { type: 'select', key: 'priority', label: t('ticket.priority'), options: [
      { value: 'low', label: t('ticket.low') },
      { value: 'medium', label: t('ticket.medium') },
      { value: 'high', label: t('ticket.high') },
    ]},
  ];

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
        subject: row.subject || '',
        message: row.message || '',
        priority: row.priority || 'medium',
        status: row.status || 'open',
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

    if (!formData.subject.trim()) {
      setFormError(t('ticket.subjectRequired'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        subject: formData.subject,
        message: formData.message || null,
        priority: formData.priority,
      };
      // Only admin sends status
      if (isAdmin) {
        payload.status = formData.status;
      }

      if (editRow) {
        await api.put(`/tickets/${editRow.id}`, payload);
      } else {
        await api.post('/tickets', payload);
      }
      setEditModal(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save ticket';
      setFormError(typeof msg === 'string' ? msg : 'Failed to save ticket');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/tickets/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      console.error('Delete error:', err);
    }
  }

  // Admin gets edit + delete; regular users get edit (for their own tickets)
  const actions = isAdmin
    ? [
        { key: 'edit', label: t('common.edit') },
        { key: 'delete', label: t('common.delete') },
      ]
    : [
        { key: 'edit', label: t('common.edit') },
      ];

  return (
    <div>
      <h2 className="mb-4">{t('ticket.title')}</h2>

      <ActionButtons
        showFilters={true}
        showExport={false}
        showAddNew={true}
        showSearch={true}
        searchValue={keyword}
        activeFilterCount={activeFilterCount}
        onFilter={handleFilter}
        onAddNew={handleAddNew}
        onSearch={handleSearch}
      />

      <ActiveFilters
        fields={filterFields}
        values={filters}
        onRemove={handleRemoveFilter}
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

      <FilterPanel
        open={showFilterPanel}
        title={t('ticket.filterTickets')}
        fields={filterFields}
        values={filters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        onClose={() => setShowFilterPanel(false)}
      />

      {/* Add/Edit Modal */}
      {editModal && (
        <div className="ticket-modal-overlay" onClick={() => setEditModal(false)}>
          <div className="ticket-modal" onClick={e => e.stopPropagation()}>
            <div className="ticket-modal-header">
              <h5>{editRow ? t('ticket.editTicket') : t('ticket.addNewTicket')}</h5>
              <button className="ticket-modal-close" onClick={() => setEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="ticket-modal-body">
                {formError && (
                  <div className="alert alert-danger py-2 mb-3">{formError}</div>
                )}
                <div className="mb-3">
                  <label className="form-label">{t('ticket.subject')} *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="subject"
                    value={formData.subject}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">{t('ticket.message')}</label>
                  <textarea
                    className="form-control"
                    name="message"
                    value={formData.message}
                    onChange={handleFormChange}
                    rows={4}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">{t('ticket.priority')}</label>
                  <select className="form-select" name="priority" value={formData.priority} onChange={handleFormChange}>
                    <option value="low">{t('ticket.low')}</option>
                    <option value="medium">{t('ticket.medium')}</option>
                    <option value="high">{t('ticket.high')}</option>
                  </select>
                </div>
                {isAdmin && (
                  <div className="mb-3">
                    <label className="form-label">{t('ticket.status')}</label>
                    <select className="form-select" name="status" value={formData.status} onChange={handleFormChange}>
                      <option value="open">{t('ticket.open')}</option>
                      <option value="in_progress">{t('ticket.inProgress')}</option>
                      <option value="resolved">{t('ticket.resolved')}</option>
                      <option value="closed">{t('ticket.closed')}</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="ticket-modal-footer">
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
        <div className="ticket-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="ticket-modal ticket-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="ticket-modal-header">
              <h5>{t('ticket.deleteTicket')}</h5>
              <button className="ticket-modal-close" onClick={() => setDeleteConfirm(null)}>&times;</button>
            </div>
            <div className="ticket-modal-body">
              <p>{t('ticket.confirmDeleteTicket')}</p>
              <p className="text-muted mb-0">
                #{deleteConfirm.id} — {deleteConfirm.subject}
              </p>
            </div>
            <div className="ticket-modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>{t('common.cancel')}</button>
              <button className="btn btn-danger" onClick={handleDelete}>{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Ticket;
