import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import ActionButtons from '../components/ActionButtons';
import FilterPanel, { ActiveFilters } from '../components/FilterPanel';
import './AuditLog.css';

function formatDateTime(value) {
  if (!value) return '\u2014';
  const d = new Date(value);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ActionBadge({ action, t }) {
  const map = {
    CREATE: { cls: 'audit-badge-create', label: t('auditLog.create') },
    UPDATE: { cls: 'audit-badge-update', label: t('auditLog.update') },
    DELETE: { cls: 'audit-badge-delete', label: t('auditLog.delete') },
  };
  const info = map[action] || { cls: '', label: action };
  return <span className={`audit-badge ${info.cls}`}>{info.label}</span>;
}

function EntityTypeBadge({ entityType, t }) {
  const map = {
    vehicle: t('auditLog.vehicle'),
    user: t('auditLog.userEntity'),
    booking: t('auditLog.booking'),
    container: t('auditLog.container'),
    boat: t('auditLog.boat'),
    transaction: t('auditLog.transaction'),
    ticket: t('auditLog.ticket'),
  };
  return <span className="audit-entity-badge">{map[entityType] || entityType}</span>;
}

function getChangeSummary(row, t) {
  if (row.action === 'CREATE') return t('auditLog.created');
  if (row.action === 'DELETE') return t('auditLog.deleted');
  if (!row.old_values || !row.new_values) return '\u2014';
  const old = typeof row.old_values === 'string' ? JSON.parse(row.old_values) : row.old_values;
  const nw = typeof row.new_values === 'string' ? JSON.parse(row.new_values) : row.new_values;
  const changed = Object.keys(nw).filter(k => JSON.stringify(old[k]) !== JSON.stringify(nw[k]));
  if (changed.length === 0) return t('auditLog.noChanges');
  return `${changed.length} ${t('auditLog.fieldsChanged')}`;
}

function getChangedFields(row) {
  if (row.action === 'CREATE') {
    const nw = typeof row.new_values === 'string' ? JSON.parse(row.new_values) : row.new_values;
    if (!nw) return [];
    return Object.entries(nw).filter(([, v]) => v != null).map(([k, v]) => ({ field: k, oldVal: null, newVal: v }));
  }
  if (row.action === 'DELETE') {
    const old = typeof row.old_values === 'string' ? JSON.parse(row.old_values) : row.old_values;
    if (!old) return [];
    return Object.entries(old).filter(([, v]) => v != null).map(([k, v]) => ({ field: k, oldVal: v, newVal: null }));
  }
  // UPDATE — only show changed fields
  const old = typeof row.old_values === 'string' ? JSON.parse(row.old_values) : (row.old_values || {});
  const nw = typeof row.new_values === 'string' ? JSON.parse(row.new_values) : (row.new_values || {});
  return Object.keys(nw)
    .filter(k => JSON.stringify(old[k]) !== JSON.stringify(nw[k]))
    .map(k => ({ field: k, oldVal: old[k], newVal: nw[k] }));
}

function formatValue(val) {
  if (val === null || val === undefined) return '\u2014';
  if (val === '[REDACTED]') return '[REDACTED]';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'object') return JSON.stringify(val);
  const str = String(val);
  return str.length > 80 ? str.slice(0, 80) + '\u2026' : str;
}

function AuditLog() {
  const { t } = useTranslation();

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('desc');
  const [filters, setFilters] = useState({
    entity_type: '',
    action: '',
    start_date: '',
    end_date: '',
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [detailRow, setDetailRow] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = { limit, page, asc: sortDir, sort_by: sortBy };
      if (keyword) params.keyword = keyword;
      if (filters.entity_type) params.entity_type = filters.entity_type;
      if (filters.action) params.action = filters.action;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      const res = await api.get('/audit-logs', { params });
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [limit, page, keyword, sortBy, sortDir, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = [
    { key: 'id', label: t('auditLog.id'), sortable: true },
    { key: 'created_at', label: t('auditLog.date'), sortable: true, render: (row) => formatDateTime(row.created_at) },
    { key: 'user_id', label: t('auditLog.user'), sortable: true, render: (row) => {
      if (row.user_name || row.user_surname) {
        return `${row.user_name || ''} ${row.user_surname || ''}`.trim();
      }
      return row.user_id ? `#${row.user_id}` : '\u2014';
    }},
    { key: 'action', label: t('auditLog.action'), sortable: true, render: (row) => <ActionBadge action={row.action} t={t} /> },
    { key: 'entity_type', label: t('auditLog.entityType'), sortable: true, render: (row) => <EntityTypeBadge entityType={row.entity_type} t={t} /> },
    { key: 'entity_id', label: t('auditLog.entityId'), sortable: false, render: (row) => row.entity_id != null ? `#${row.entity_id}` : '\u2014' },
    { key: 'changes', label: t('auditLog.changes'), sortable: false, render: (row) => <span className="audit-changes-summary">{getChangeSummary(row, t)}</span> },
  ];

  const filterFields = [
    { type: 'select', key: 'entity_type', label: t('auditLog.entityType'), options: [
      { value: 'vehicle', label: t('auditLog.vehicle') },
      { value: 'user', label: t('auditLog.userEntity') },
      { value: 'booking', label: t('auditLog.booking') },
      { value: 'container', label: t('auditLog.container') },
      { value: 'boat', label: t('auditLog.boat') },
      { value: 'transaction', label: t('auditLog.transaction') },
      { value: 'ticket', label: t('auditLog.ticket') },
    ]},
    { type: 'select', key: 'action', label: t('auditLog.action'), options: [
      { value: 'CREATE', label: t('auditLog.create') },
      { value: 'UPDATE', label: t('auditLog.update') },
      { value: 'DELETE', label: t('auditLog.delete') },
    ]},
    { type: 'date-range', startKey: 'start_date', endKey: 'end_date', label: t('auditLog.date') },
  ];

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  function handleSearch(value) {
    setKeyword(value);
    setPage(1);
  }

  function handleSort(key, dir) {
    setSortBy(key);
    setSortDir(dir);
    setPage(1);
  }

  function handleAction(action, row) {
    if (action === 'view') {
      setDetailRow(row);
    }
  }

  function handleApplyFilters(newFilters) {
    setFilters(newFilters);
    setPage(1);
    setShowFilterPanel(false);
  }

  function handleClearFilters() {
    setFilters({ entity_type: '', action: '', start_date: '', end_date: '' });
    setPage(1);
    setShowFilterPanel(false);
  }

  function handleRemoveFilter(key) {
    setFilters((prev) => ({ ...prev, [key]: '' }));
    setPage(1);
  }

  const actions = [
    { key: 'view', label: t('auditLog.viewDetails') },
  ];

  const changedFields = detailRow ? getChangedFields(detailRow) : [];

  return (
    <div>
      <h2 className="mb-4">{t('auditLog.title')}</h2>

      <ActionButtons
        showFilters={true}
        showExport={false}
        showAddNew={false}
        showSearch={true}
        searchValue={keyword}
        activeFilterCount={activeFilterCount}
        onFilter={() => setShowFilterPanel(true)}
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
        onPageChange={setPage}
        onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
      />

      <FilterPanel
        open={showFilterPanel}
        title={t('auditLog.filterAuditLogs')}
        fields={filterFields}
        values={filters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        onClose={() => setShowFilterPanel(false)}
      />

      {/* Detail Modal */}
      {detailRow && (
        <div className="audit-modal-overlay" onClick={() => setDetailRow(null)}>
          <div className="audit-modal" onClick={e => e.stopPropagation()}>
            <div className="audit-modal-header">
              <h5>{t('auditLog.detailTitle')}</h5>
              <button className="audit-modal-close" onClick={() => setDetailRow(null)}>&times;</button>
            </div>
            <div className="audit-modal-body">
              <div className="audit-detail-grid">
                <div className="audit-detail-item">
                  <label>{t('auditLog.date')}</label>
                  <span>{formatDateTime(detailRow.created_at)}</span>
                </div>
                <div className="audit-detail-item">
                  <label>{t('auditLog.user')}</label>
                  <span>{detailRow.user_name || detailRow.user_surname ? `${detailRow.user_name || ''} ${detailRow.user_surname || ''}`.trim() : `#${detailRow.user_id}`}</span>
                </div>
                <div className="audit-detail-item">
                  <label>{t('auditLog.action')}</label>
                  <span><ActionBadge action={detailRow.action} t={t} /></span>
                </div>
                <div className="audit-detail-item">
                  <label>{t('auditLog.entityType')}</label>
                  <span><EntityTypeBadge entityType={detailRow.entity_type} t={t} /></span>
                </div>
                <div className="audit-detail-item">
                  <label>{t('auditLog.entityId')}</label>
                  <span>#{detailRow.entity_id}</span>
                </div>
                <div className="audit-detail-item">
                  <label>{t('auditLog.ipAddress')}</label>
                  <span>{detailRow.ip_address || '\u2014'}</span>
                </div>
              </div>

              <h6 className="mb-3">{t('auditLog.changes')}</h6>
              {changedFields.length === 0 ? (
                <p className="text-muted">{t('auditLog.noChanges')}</p>
              ) : (
                <table className="audit-changes-table">
                  <thead>
                    <tr>
                      <th>{t('auditLog.field')}</th>
                      {detailRow.action !== 'CREATE' && <th>{t('auditLog.oldValues')}</th>}
                      {detailRow.action !== 'DELETE' && <th>{t('auditLog.newValues')}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {changedFields.map(({ field, oldVal, newVal }) => (
                      <tr key={field}>
                        <td><strong>{field}</strong></td>
                        {detailRow.action !== 'CREATE' && (
                          <td className="audit-value-old">{formatValue(oldVal)}</td>
                        )}
                        {detailRow.action !== 'DELETE' && (
                          <td className="audit-value-new">{formatValue(newVal)}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="audit-modal-footer">
              <button className="btn btn-secondary" onClick={() => setDetailRow(null)}>{t('common.cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditLog;
