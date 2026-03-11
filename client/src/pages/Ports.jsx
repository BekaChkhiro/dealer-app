import { useState, useEffect, useCallback, Fragment } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import ActionButtons from '../components/ActionButtons';
import './Ports.css';

function StatusBadge({ isActive, t }) {
  return (
    <span className={`ports-status-badge ${isActive ? 'ports-status-active' : 'ports-status-inactive'}`}>
      {isActive ? t('portsPage.active') : t('portsPage.inactive')}
    </span>
  );
}

function ContainerStatusBadge({ status }) {
  const statusClasses = {
    'booked': 'container-status-booked',
    'loaded': 'container-status-loaded',
    'in_transit': 'container-status-transit',
    'arrived': 'container-status-arrived',
    'delivered': 'container-status-delivered',
  };
  return (
    <span className={`container-status-badge ${statusClasses[status] || ''}`}>
      {status || '—'}
    </span>
  );
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const EMPTY_PORT_FORM = {
  name: '',
  code: '',
  country: '',
  is_active: true,
};

const EMPTY_CONTAINER_FORM = {
  container_number: '',
  status: 'booked',
  container_loaded_date: '',
  container_receive_date: '',
  line: '',
  delivery_location: '',
};

const CONTAINER_STATUSES = ['booked', 'loaded', 'in_transit', 'arrived', 'delivered'];
const LINES = ['MSC', 'Maersk', 'ZIM'];

function Ports() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role === 'admin';

  const columns = [
    { key: 'expand', label: '', sortable: false, render: (row) => (
      <button
        className="ports-expand-btn"
        onClick={(e) => { e.stopPropagation(); toggleExpand(row.id); }}
        title={expandedRows[row.id] ? t('portsPage.hideContainers') : t('portsPage.viewContainers')}
      >
        {expandedRows[row.id] ? '▼' : '▶'}
      </button>
    )},
    { key: 'id', label: t('portsPage.id'), sortable: true },
    { key: 'name', label: t('portsPage.name'), sortable: true },
    { key: 'code', label: t('portsPage.code'), sortable: true },
    { key: 'country', label: t('portsPage.country'), sortable: true },
    { key: 'container_count', label: t('portsPage.containerCount'), sortable: false, render: (row) => (
      <span className="container-count-badge">{row.container_count || 0}</span>
    )},
    { key: 'is_active', label: t('portsPage.status'), sortable: true, render: (row) => <StatusBadge isActive={row.is_active} t={t} /> },
    { key: 'created_at', label: t('portsPage.createdAt'), sortable: true, render: (row) => formatDate(row.created_at) },
  ];

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('desc');

  // Port modal state
  const [editModal, setEditModal] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [formData, setFormData] = useState(EMPTY_PORT_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Expanded rows and containers state
  const [expandedRows, setExpandedRows] = useState({});
  const [portContainers, setPortContainers] = useState({});
  const [containersLoading, setContainersLoading] = useState({});

  // Container modal state
  const [containerModal, setContainerModal] = useState(false);
  const [containerPortId, setContainerPortId] = useState(null);
  const [containerPortName, setContainerPortName] = useState('');
  const [containerFormData, setContainerFormData] = useState(EMPTY_CONTAINER_FORM);
  const [containerSaving, setContainerSaving] = useState(false);
  const [containerFormError, setContainerFormError] = useState('');
  const [editContainerId, setEditContainerId] = useState(null);
  const [deleteContainerConfirm, setDeleteContainerConfirm] = useState(null);

  // Vehicle assignment modal state
  const [vehicleModal, setVehicleModal] = useState(false);
  const [vehicleModalContainer, setVehicleModalContainer] = useState(null);
  const [vehicleModalPortId, setVehicleModalPortId] = useState(null);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [vehicleSearchKeyword, setVehicleSearchKeyword] = useState('');
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState([]);
  const [assigningVehicles, setAssigningVehicles] = useState(false);

  // Container vehicles state (for viewing vehicles in a container)
  const [expandedContainerVehicles, setExpandedContainerVehicles] = useState({});
  const [containerVehicles, setContainerVehicles] = useState({});
  const [containerVehiclesLoading, setContainerVehiclesLoading] = useState({});

  // Remove vehicle confirm state
  const [removeVehicleConfirm, setRemoveVehicleConfirm] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = { limit, page, asc: sortDir, sort_by: sortBy };
      if (keyword) params.keyword = keyword;
      const res = await api.get('/ports', { params });
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Error fetching ports:', err);
    } finally {
      setLoading(false);
    }
  }, [limit, page, keyword, sortBy, sortDir]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchContainersForPort = useCallback(async (portId) => {
    try {
      setContainersLoading(prev => ({ ...prev, [portId]: true }));
      const res = await api.get(`/ports/${portId}/containers`);
      setPortContainers(prev => ({ ...prev, [portId]: res.data.data || [] }));
    } catch (err) {
      console.error('Error fetching containers for port:', err);
      setPortContainers(prev => ({ ...prev, [portId]: [] }));
    } finally {
      setContainersLoading(prev => ({ ...prev, [portId]: false }));
    }
  }, []);

  function toggleExpand(portId) {
    setExpandedRows(prev => {
      const newState = { ...prev, [portId]: !prev[portId] };
      if (newState[portId] && !portContainers[portId]) {
        fetchContainersForPort(portId);
      }
      return newState;
    });
  }

  function handleSearch(value) {
    setKeyword(value);
    setPage(1);
  }

  function handleSort(key, dir) {
    if (key === 'expand' || key === 'container_count') return;
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
    setFormData(EMPTY_PORT_FORM);
    setFormError('');
    setEditModal(true);
  }

  function handleAction(action, row) {
    if (action === 'edit') {
      setEditRow(row);
      setFormData({
        name: row.name || '',
        code: row.code || '',
        country: row.country || '',
        is_active: row.is_active !== false,
      });
      setFormError('');
      setEditModal(true);
    } else if (action === 'delete') {
      setDeleteConfirm(row);
    } else if (action === 'addContainer') {
      openAddContainerModal(row);
    }
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError(t('portsPage.nameRequired'));
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code || null,
        country: formData.country || null,
        is_active: formData.is_active,
      };

      if (editRow) {
        await api.put(`/ports/${editRow.id}`, payload);
      } else {
        await api.post('/ports', payload);
      }
      setEditModal(false);
      fetchData();
    } catch (err) {
      console.error('Save error:', err);
      setFormError(err.response?.data?.message || t('portsPage.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/ports/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      console.error('Delete error:', err);
    }
  }

  // Container modal functions
  function openAddContainerModal(port) {
    setContainerPortId(port.id);
    setContainerPortName(port.name);
    setEditContainerId(null);
    setContainerFormData(EMPTY_CONTAINER_FORM);
    setContainerFormError('');
    setContainerModal(true);
  }

  function openEditContainerModal(container, port) {
    setContainerPortId(port.id);
    setContainerPortName(port.name);
    setEditContainerId(container.id);
    setContainerFormData({
      container_number: container.container_number || '',
      status: container.status || 'booked',
      container_loaded_date: container.container_loaded_date ? container.container_loaded_date.split('T')[0] : '',
      container_receive_date: container.container_receive_date ? container.container_receive_date.split('T')[0] : '',
      line: container.line || '',
      delivery_location: container.delivery_location || '',
    });
    setContainerFormError('');
    setContainerModal(true);
  }

  function handleContainerFormChange(e) {
    const { name, value } = e.target;
    setContainerFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleContainerFormSubmit(e) {
    e.preventDefault();
    if (!containerFormData.container_number.trim()) {
      setContainerFormError(t('portsPage.containerNumberRequired'));
      return;
    }

    setContainerSaving(true);
    setContainerFormError('');
    try {
      const payload = {
        ...containerFormData,
        port_id: containerPortId,
        container_loaded_date: containerFormData.container_loaded_date || null,
        container_receive_date: containerFormData.container_receive_date || null,
      };

      if (editContainerId) {
        await api.put(`/containers/${editContainerId}`, payload);
      } else {
        await api.post('/containers', payload);
      }
      setContainerModal(false);
      fetchContainersForPort(containerPortId);
      fetchData(); // Refresh port list to update container count
    } catch (err) {
      console.error('Save container error:', err);
      setContainerFormError(err.response?.data?.message || t('portsPage.saveContainerFailed'));
    } finally {
      setContainerSaving(false);
    }
  }

  async function handleDeleteContainer() {
    if (!deleteContainerConfirm) return;
    try {
      await api.delete(`/containers/${deleteContainerConfirm.container.id}`);
      setDeleteContainerConfirm(null);
      fetchContainersForPort(deleteContainerConfirm.portId);
      fetchData(); // Refresh port list to update container count
    } catch (err) {
      console.error('Delete container error:', err);
    }
  }

  // Vehicle assignment functions
  const fetchAvailableVehicles = useCallback(async (searchKeyword = '') => {
    try {
      setVehiclesLoading(true);
      const params = { limit: 30 };
      if (searchKeyword) params.keyword = searchKeyword;
      const res = await api.get('/containers/available-vehicles', { params });
      setAvailableVehicles(res.data.data || []);
    } catch (err) {
      console.error('Error fetching available vehicles:', err);
      setAvailableVehicles([]);
    } finally {
      setVehiclesLoading(false);
    }
  }, []);

  const fetchContainerVehicles = useCallback(async (containerId) => {
    try {
      setContainerVehiclesLoading(prev => ({ ...prev, [containerId]: true }));
      const res = await api.get(`/containers/${containerId}/vehicles`);
      setContainerVehicles(prev => ({ ...prev, [containerId]: res.data.data || [] }));
    } catch (err) {
      console.error('Error fetching container vehicles:', err);
      setContainerVehicles(prev => ({ ...prev, [containerId]: [] }));
    } finally {
      setContainerVehiclesLoading(prev => ({ ...prev, [containerId]: false }));
    }
  }, []);

  function openVehicleModal(container, portId) {
    setVehicleModalContainer(container);
    setVehicleModalPortId(portId);
    setSelectedVehicleIds([]);
    setVehicleSearchKeyword('');
    setVehicleModal(true);
    fetchAvailableVehicles('');
  }

  function handleVehicleSearch(e) {
    const value = e.target.value;
    setVehicleSearchKeyword(value);
    // Debounce search
    clearTimeout(window.vehicleSearchTimeout);
    window.vehicleSearchTimeout = setTimeout(() => {
      fetchAvailableVehicles(value);
    }, 300);
  }

  function toggleVehicleSelection(vehicleId) {
    setSelectedVehicleIds(prev => {
      if (prev.includes(vehicleId)) {
        return prev.filter(id => id !== vehicleId);
      }
      return [...prev, vehicleId];
    });
  }

  function toggleSelectAll() {
    if (selectedVehicleIds.length === availableVehicles.length) {
      setSelectedVehicleIds([]);
    } else {
      setSelectedVehicleIds(availableVehicles.map(v => v.id));
    }
  }

  async function handleAssignVehicles() {
    if (selectedVehicleIds.length === 0 || !vehicleModalContainer) return;

    setAssigningVehicles(true);
    try {
      await api.post(`/containers/${vehicleModalContainer.id}/vehicles`, {
        vehicleIds: selectedVehicleIds
      });
      setVehicleModal(false);
      // Refresh container data to update vehicle counts
      fetchContainersForPort(vehicleModalPortId);
      // If this container's vehicles are expanded, refresh them
      if (expandedContainerVehicles[vehicleModalContainer.id]) {
        fetchContainerVehicles(vehicleModalContainer.id);
      }
    } catch (err) {
      console.error('Error assigning vehicles:', err);
    } finally {
      setAssigningVehicles(false);
    }
  }

  function toggleContainerVehicles(containerId) {
    setExpandedContainerVehicles(prev => {
      const newState = { ...prev, [containerId]: !prev[containerId] };
      if (newState[containerId] && !containerVehicles[containerId]) {
        fetchContainerVehicles(containerId);
      }
      return newState;
    });
  }

  async function handleRemoveVehicle() {
    if (!removeVehicleConfirm) return;
    const { containerId, vehicleId, portId } = removeVehicleConfirm;

    try {
      await api.delete(`/containers/${containerId}/vehicles/${vehicleId}`);
      setRemoveVehicleConfirm(null);
      // Refresh container vehicles
      fetchContainerVehicles(containerId);
      // Refresh port containers to update vehicle count
      fetchContainersForPort(portId);
    } catch (err) {
      console.error('Error removing vehicle:', err);
    }
  }

  const actions = isAdmin
    ? [
        { key: 'addContainer', label: t('portsPage.addContainer') },
        { key: 'edit', label: t('common.edit') },
        { key: 'delete', label: t('common.delete') },
      ]
    : [];

  // Custom row renderer to include expandable content
  function renderExpandableRow(row) {
    if (!expandedRows[row.id]) return null;

    const containers = portContainers[row.id] || [];
    const isLoading = containersLoading[row.id];

    return (
      <tr className="ports-expanded-row">
        <td colSpan={columns.length + 1}>
          <div className="ports-containers-section">
            <div className="ports-containers-header">
              <h6>{t('portsPage.containers')} — {row.name}</h6>
              {isAdmin && (
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => openAddContainerModal(row)}
                >
                  + {t('portsPage.addContainer')}
                </button>
              )}
            </div>
            {isLoading ? (
              <div className="ports-containers-loading">{t('common.loading')}</div>
            ) : containers.length === 0 ? (
              <div className="ports-containers-empty">{t('portsPage.noContainers')}</div>
            ) : (
              <table className="ports-containers-table">
                <thead>
                  <tr>
                    <th style={{ width: '30px' }}></th>
                    <th>{t('portsPage.containerNumber')}</th>
                    <th>{t('portsPage.containerStatus')}</th>
                    <th>{t('portsPage.line')}</th>
                    <th>{t('portsPage.containerLoadedDate')}</th>
                    <th>{t('portsPage.containerReceiveDate')}</th>
                    <th>{t('portsPage.vehicles')}</th>
                    {isAdmin && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {containers.map(container => (
                    <Fragment key={container.id}>
                      <tr>
                        <td>
                          {(container.vehicle_count > 0) && (
                            <button
                              className="ports-expand-btn"
                              onClick={() => toggleContainerVehicles(container.id)}
                              title={expandedContainerVehicles[container.id] ? t('portsPage.hideVehicles') : t('portsPage.showVehicles')}
                            >
                              {expandedContainerVehicles[container.id] ? '▼' : '▶'}
                            </button>
                          )}
                        </td>
                        <td><strong>{container.container_number || '—'}</strong></td>
                        <td><ContainerStatusBadge status={container.status} /></td>
                        <td>{container.line || '—'}</td>
                        <td>{formatDate(container.container_loaded_date)}</td>
                        <td>{formatDate(container.container_receive_date)}</td>
                        <td>
                          <span className="vehicle-count-badge">{container.vehicle_count || 0}</span>
                        </td>
                        {isAdmin && (
                          <td className="container-actions">
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => openVehicleModal(container, row.id)}
                              title={t('portsPage.addVehicles')}
                            >
                              + 🚗
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => openEditContainerModal(container, row)}
                              title={t('common.edit')}
                            >
                              ✎
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => setDeleteContainerConfirm({ container, portId: row.id })}
                              title={t('common.delete')}
                            >
                              ✕
                            </button>
                          </td>
                        )}
                      </tr>
                      {expandedContainerVehicles[container.id] && (
                        <tr className="container-vehicles-row">
                          <td colSpan={isAdmin ? 8 : 7}>
                            <div className="container-vehicles-section">
                              <h6>{t('portsPage.containerVehicles')}</h6>
                              {containerVehiclesLoading[container.id] ? (
                                <div className="vehicles-loading">{t('common.loading')}</div>
                              ) : (containerVehicles[container.id] || []).length === 0 ? (
                                <div className="vehicles-empty">{t('portsPage.noVehiclesInContainer')}</div>
                              ) : (
                                <table className="vehicles-table">
                                  <thead>
                                    <tr>
                                      <th>{t('portsPage.vehicleVin')}</th>
                                      <th>{t('portsPage.vehicleMake')}</th>
                                      <th>{t('portsPage.vehicleLot')}</th>
                                      <th>{t('portsPage.vehicleDealer')}</th>
                                      <th>{t('portsPage.vehicleStatus')}</th>
                                      {isAdmin && <th></th>}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(containerVehicles[container.id] || []).map(vehicle => (
                                      <tr key={vehicle.id}>
                                        <td className="vin-cell">
                                          <span className="vin-prefix">{(vehicle.vin || '').slice(0, -6)}</span>
                                          <span className="vin-suffix">{(vehicle.vin || '').slice(-6)}</span>
                                        </td>
                                        <td>{vehicle.mark} {vehicle.model} {vehicle.year}</td>
                                        <td>{vehicle.lot_number || '—'}</td>
                                        <td>{vehicle.dealer_name} {vehicle.dealer_surname}</td>
                                        <td>{vehicle.current_status || '—'}</td>
                                        {isAdmin && (
                                          <td>
                                            <button
                                              className="btn btn-sm btn-outline-danger"
                                              onClick={() => setRemoveVehicleConfirm({
                                                containerId: container.id,
                                                vehicleId: vehicle.id,
                                                portId: row.id,
                                                vin: vehicle.vin
                                              })}
                                              title={t('portsPage.removeVehicle')}
                                            >
                                              ✕
                                            </button>
                                          </td>
                                        )}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </td>
      </tr>
    );
  }

  return (
    <div>
      <h2 className="mb-4">{t('portsPage.title')}</h2>

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
        renderExpandableRow={renderExpandableRow}
      />

      <Pagination
        page={page}
        total={total}
        limit={limit}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />

      {/* Add/Edit Port Modal */}
      {editModal && (
        <div className="ports-modal-overlay" onClick={() => setEditModal(false)}>
          <div className="ports-modal" onClick={e => e.stopPropagation()}>
            <div className="ports-modal-header">
              <h5>{editRow ? t('portsPage.editPort') : t('portsPage.addNewPort')}</h5>
              <button className="ports-modal-close" onClick={() => setEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="ports-modal-body">
                {formError && (
                  <div className="alert alert-danger py-2 mb-3">{formError}</div>
                )}
                <div className="mb-3">
                  <label className="form-label">{t('portsPage.name')} <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('portsPage.code')}</label>
                    <input
                      type="text"
                      className="form-control"
                      name="code"
                      value={formData.code}
                      onChange={handleFormChange}
                      placeholder="e.g., NYC, SAV"
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('portsPage.country')}</label>
                    <input
                      type="text"
                      className="form-control"
                      name="country"
                      value={formData.country}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleFormChange}
                    />
                    <label className="form-check-label" htmlFor="is_active">
                      {t('portsPage.isActive')}
                    </label>
                  </div>
                </div>
              </div>
              <div className="ports-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditModal(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? t('common.saving') : (editRow ? t('common.update') : t('common.create'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Port Confirmation Modal */}
      {deleteConfirm && (
        <div className="ports-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="ports-modal ports-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="ports-modal-header">
              <h5>{t('portsPage.deletePort')}</h5>
              <button className="ports-modal-close" onClick={() => setDeleteConfirm(null)}>&times;</button>
            </div>
            <div className="ports-modal-body">
              <p>{t('portsPage.confirmDeletePort')}</p>
              <p className="text-muted mb-0">
                {deleteConfirm.name} {deleteConfirm.code && `(${deleteConfirm.code})`}
              </p>
            </div>
            <div className="ports-modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                {t('common.cancel')}
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Container Modal */}
      {containerModal && (
        <div className="ports-modal-overlay" onClick={() => setContainerModal(false)}>
          <div className="ports-modal" onClick={e => e.stopPropagation()}>
            <div className="ports-modal-header">
              <h5>
                {editContainerId ? t('portsPage.editContainer') : t('portsPage.addContainerToPort')}
                {containerPortName && <span className="port-name-label"> — {containerPortName}</span>}
              </h5>
              <button className="ports-modal-close" onClick={() => setContainerModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleContainerFormSubmit}>
              <div className="ports-modal-body">
                {containerFormError && (
                  <div className="alert alert-danger py-2 mb-3">{containerFormError}</div>
                )}
                <div className="mb-3">
                  <label className="form-label">{t('portsPage.containerNumber')} <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="container_number"
                    value={containerFormData.container_number}
                    onChange={handleContainerFormChange}
                    placeholder="e.g., MSCU1234567"
                    required
                  />
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('portsPage.containerStatus')}</label>
                    <select
                      className="form-select"
                      name="status"
                      value={containerFormData.status}
                      onChange={handleContainerFormChange}
                    >
                      {CONTAINER_STATUSES.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('portsPage.line')}</label>
                    <select
                      className="form-select"
                      name="line"
                      value={containerFormData.line}
                      onChange={handleContainerFormChange}
                    >
                      <option value="">—</option>
                      {LINES.map(line => (
                        <option key={line} value={line}>{line}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('portsPage.containerLoadedDate')}</label>
                    <input
                      type="date"
                      className="form-control"
                      name="container_loaded_date"
                      value={containerFormData.container_loaded_date}
                      onChange={handleContainerFormChange}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('portsPage.containerReceiveDate')}</label>
                    <input
                      type="date"
                      className="form-control"
                      name="container_receive_date"
                      value={containerFormData.container_receive_date}
                      onChange={handleContainerFormChange}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Delivery Location</label>
                  <input
                    type="text"
                    className="form-control"
                    name="delivery_location"
                    value={containerFormData.delivery_location}
                    onChange={handleContainerFormChange}
                  />
                </div>
              </div>
              <div className="ports-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setContainerModal(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={containerSaving}>
                  {containerSaving ? t('common.saving') : (editContainerId ? t('common.update') : t('common.create'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Container Confirmation Modal */}
      {deleteContainerConfirm && (
        <div className="ports-modal-overlay" onClick={() => setDeleteContainerConfirm(null)}>
          <div className="ports-modal ports-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="ports-modal-header">
              <h5>{t('portsPage.deleteContainer')}</h5>
              <button className="ports-modal-close" onClick={() => setDeleteContainerConfirm(null)}>&times;</button>
            </div>
            <div className="ports-modal-body">
              <p>{t('portsPage.confirmDeleteContainer')}</p>
              <p className="text-muted mb-0">
                {deleteContainerConfirm.container.container_number}
              </p>
            </div>
            <div className="ports-modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteContainerConfirm(null)}>
                {t('common.cancel')}
              </button>
              <button className="btn btn-danger" onClick={handleDeleteContainer}>
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Assignment Modal */}
      {vehicleModal && vehicleModalContainer && (
        <div className="ports-modal-overlay" onClick={() => setVehicleModal(false)}>
          <div className="ports-modal ports-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="ports-modal-header">
              <h5>
                {t('portsPage.assignVehicles')}
                <span className="container-name-label"> — {vehicleModalContainer.container_number}</span>
              </h5>
              <button className="ports-modal-close" onClick={() => setVehicleModal(false)}>&times;</button>
            </div>
            <div className="ports-modal-body vehicle-modal-body">
              <div className="vehicle-search-bar">
                <input
                  type="text"
                  className="form-control"
                  placeholder={t('portsPage.searchVehicles')}
                  value={vehicleSearchKeyword}
                  onChange={handleVehicleSearch}
                />
                {selectedVehicleIds.length > 0 && (
                  <span className="selected-count">
                    {t('portsPage.selectedVehicles')}: {selectedVehicleIds.length}
                  </span>
                )}
              </div>

              <div className="available-vehicles-list">
                {vehiclesLoading ? (
                  <div className="vehicles-loading">{t('common.loading')}</div>
                ) : availableVehicles.length === 0 ? (
                  <div className="vehicles-empty">{t('portsPage.noAvailableVehicles')}</div>
                ) : (
                  <>
                    <div className="select-all-row">
                      <label className="vehicle-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedVehicleIds.length === availableVehicles.length && availableVehicles.length > 0}
                          onChange={toggleSelectAll}
                        />
                        <span>Select All ({availableVehicles.length})</span>
                      </label>
                    </div>
                    {availableVehicles.map(vehicle => (
                      <div
                        key={vehicle.id}
                        className={`vehicle-item ${selectedVehicleIds.includes(vehicle.id) ? 'selected' : ''}`}
                        onClick={() => toggleVehicleSelection(vehicle.id)}
                      >
                        <label className="vehicle-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedVehicleIds.includes(vehicle.id)}
                            onChange={() => toggleVehicleSelection(vehicle.id)}
                            onClick={e => e.stopPropagation()}
                          />
                        </label>
                        <div className="vehicle-image">
                          {vehicle.profile_image_url ? (
                            <img src={vehicle.profile_image_url} alt="" />
                          ) : (
                            <div className="no-image">🚗</div>
                          )}
                        </div>
                        <div className="vehicle-info">
                          <div className="vehicle-title">
                            {vehicle.mark} {vehicle.model} {vehicle.year}
                          </div>
                          <div className="vehicle-details">
                            <span className="vehicle-vin">
                              VIN: <span className="vin-prefix">{(vehicle.vin || '').slice(0, -6)}</span>
                              <span className="vin-suffix">{(vehicle.vin || '').slice(-6)}</span>
                            </span>
                            {vehicle.lot_number && <span className="vehicle-lot">Lot: {vehicle.lot_number}</span>}
                          </div>
                          <div className="vehicle-dealer">
                            {vehicle.dealer_name} {vehicle.dealer_surname}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
            <div className="ports-modal-footer">
              <button className="btn btn-secondary" onClick={() => setVehicleModal(false)}>
                {t('common.cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAssignVehicles}
                disabled={selectedVehicleIds.length === 0 || assigningVehicles}
              >
                {assigningVehicles ? t('portsPage.assigning') : `${t('portsPage.assignSelected')} (${selectedVehicleIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Vehicle Confirmation Modal */}
      {removeVehicleConfirm && (
        <div className="ports-modal-overlay" onClick={() => setRemoveVehicleConfirm(null)}>
          <div className="ports-modal ports-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="ports-modal-header">
              <h5>{t('portsPage.removeVehicle')}</h5>
              <button className="ports-modal-close" onClick={() => setRemoveVehicleConfirm(null)}>&times;</button>
            </div>
            <div className="ports-modal-body">
              <p>{t('portsPage.confirmRemoveVehicle')}</p>
              <p className="text-muted mb-0">
                VIN: {removeVehicleConfirm.vin}
              </p>
            </div>
            <div className="ports-modal-footer">
              <button className="btn btn-secondary" onClick={() => setRemoveVehicleConfirm(null)}>
                {t('common.cancel')}
              </button>
              <button className="btn btn-danger" onClick={handleRemoveVehicle}>
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Ports;
