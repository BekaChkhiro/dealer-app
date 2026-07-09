import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import DataTable from '../components/DataTable';
import './Geography.css';

function ActiveBadge({ isActive, t }) {
  return (
    <span className={`badge ${isActive ? 'bg-success' : 'bg-secondary'}`}>
      {isActive ? t('geography.active') : t('geography.inactive')}
    </span>
  );
}

function Geography() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role === 'admin';

  /* =========================== Countries =========================== */
  const [countries, setCountries] = useState([]);
  const [coLoading, setCoLoading] = useState(true);
  const [coEditModal, setCoEditModal] = useState(false);
  const [coEditRow, setCoEditRow] = useState(null);
  const [coFormData, setCoFormData] = useState({ name: '', code: '', sort_order: '' });
  const [coSaving, setCoSaving] = useState(false);
  const [coFormError, setCoFormError] = useState('');
  const [coDeleteConfirm, setCoDeleteConfirm] = useState(null);

  const fetchCountries = useCallback(async () => {
    try {
      setCoLoading(true);
      const res = await api.get('/geo/countries');
      setCountries(res.data.data || []);
    } catch (err) {
      console.error('Error fetching countries:', err);
    } finally {
      setCoLoading(false);
    }
  }, []);

  useEffect(() => { fetchCountries(); }, [fetchCountries]);

  function handleCoAddNew() {
    setCoEditRow(null);
    setCoFormData({ name: '', code: '', sort_order: '' });
    setCoFormError('');
    setCoEditModal(true);
  }

  function handleCoAction(action, row) {
    if (action === 'edit') {
      setCoEditRow(row);
      setCoFormData({
        name: row.name || '',
        code: row.code || '',
        sort_order: row.sort_order ?? '',
      });
      setCoFormError('');
      setCoEditModal(true);
    } else if (action === 'delete') {
      setCoDeleteConfirm(row);
    }
  }

  function handleCoFormChange(e) {
    const { name, value } = e.target;
    setCoFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleCoFormSubmit(e) {
    e.preventDefault();
    if (!coFormData.name.trim()) return;

    setCoSaving(true);
    setCoFormError('');
    try {
      const payload = {
        name: coFormData.name.trim(),
        code: coFormData.code || null,
        sort_order: Number(coFormData.sort_order) || 0,
      };

      if (coEditRow) {
        await api.put(`/geo/countries/${coEditRow.id}`, payload);
      } else {
        await api.post('/geo/countries', payload);
      }
      setCoEditModal(false);
      fetchCountries();
    } catch (err) {
      console.error('Country save error:', err);
      setCoFormError(err.response?.data?.message || t('geography.saveFailed'));
    } finally {
      setCoSaving(false);
    }
  }

  async function handleCoDelete() {
    if (!coDeleteConfirm) return;
    try {
      await api.delete(`/geo/countries/${coDeleteConfirm.id}`);
      setCoDeleteConfirm(null);
      fetchCountries();
    } catch (err) {
      console.error('Country delete error:', err);
    }
  }

  const coColumns = [
    { key: 'name', label: t('geography.name'), sortable: false },
    { key: 'code', label: t('geography.code'), sortable: false },
    { key: 'sort_order', label: t('geography.sortOrder'), sortable: false, align: 'right' },
  ];

  const coActions = isAdmin
    ? [
        { key: 'edit', label: t('common.edit') },
        { key: 'delete', label: t('common.delete') },
      ]
    : [];

  /* ============================= States ============================= */
  const [states, setStates] = useState([]);
  const [stLoading, setStLoading] = useState(true);
  const [stCountryFilter, setStCountryFilter] = useState('');
  const [allStates, setAllStates] = useState([]);
  const [stEditModal, setStEditModal] = useState(false);
  const [stEditRow, setStEditRow] = useState(null);
  const [stFormData, setStFormData] = useState({ country_id: '', name: '', code: '', sort_order: '' });
  const [stSaving, setStSaving] = useState(false);
  const [stFormError, setStFormError] = useState('');
  const [stDeleteConfirm, setStDeleteConfirm] = useState(null);

  const fetchStates = useCallback(async (countryId) => {
    try {
      setStLoading(true);
      const params = {};
      if (countryId) params.country_id = countryId;
      const res = await api.get('/geo/states', { params });
      setStates(res.data.data || []);
    } catch (err) {
      console.error('Error fetching states:', err);
    } finally {
      setStLoading(false);
    }
  }, []);

  const fetchAllStates = useCallback(async () => {
    try {
      const res = await api.get('/geo/states');
      setAllStates(res.data.data || []);
    } catch (err) {
      console.error('Error fetching all states:', err);
    }
  }, []);

  useEffect(() => { fetchStates(stCountryFilter); }, [fetchStates, stCountryFilter]);
  useEffect(() => { fetchAllStates(); }, [fetchAllStates]);

  function handleStCountryFilterChange(e) {
    setStCountryFilter(e.target.value);
  }

  function handleStAddNew() {
    setStEditRow(null);
    setStFormData({ country_id: stCountryFilter || '', name: '', code: '', sort_order: '' });
    setStFormError('');
    setStEditModal(true);
  }

  function handleStAction(action, row) {
    if (action === 'edit') {
      setStEditRow(row);
      setStFormData({
        country_id: row.country_id != null ? String(row.country_id) : '',
        name: row.name || '',
        code: row.code || '',
        sort_order: row.sort_order ?? '',
      });
      setStFormError('');
      setStEditModal(true);
    } else if (action === 'delete') {
      setStDeleteConfirm(row);
    }
  }

  function handleStFormChange(e) {
    const { name, value } = e.target;
    setStFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleStFormSubmit(e) {
    e.preventDefault();
    if (!stFormData.name.trim() || !stFormData.country_id) return;

    setStSaving(true);
    setStFormError('');
    try {
      const payload = {
        country_id: Number(stFormData.country_id),
        name: stFormData.name.trim(),
        code: stFormData.code || null,
        sort_order: Number(stFormData.sort_order) || 0,
      };

      if (stEditRow) {
        await api.put(`/geo/states/${stEditRow.id}`, payload);
      } else {
        await api.post('/geo/states', payload);
      }
      setStEditModal(false);
      fetchStates(stCountryFilter);
      fetchAllStates();
    } catch (err) {
      console.error('State save error:', err);
      setStFormError(err.response?.data?.message || t('geography.saveFailed'));
    } finally {
      setStSaving(false);
    }
  }

  async function handleStDelete() {
    if (!stDeleteConfirm) return;
    try {
      await api.delete(`/geo/states/${stDeleteConfirm.id}`);
      setStDeleteConfirm(null);
      fetchStates(stCountryFilter);
      fetchAllStates();
    } catch (err) {
      console.error('State delete error:', err);
    }
  }

  const stColumns = [
    { key: 'name', label: t('geography.name'), sortable: false },
    { key: 'code', label: t('geography.code'), sortable: false },
    { key: 'country_name', label: t('geography.country'), sortable: false },
    { key: 'sort_order', label: t('geography.sortOrder'), sortable: false, align: 'right' },
  ];

  const stActions = isAdmin
    ? [
        { key: 'edit', label: t('common.edit') },
        { key: 'delete', label: t('common.delete') },
      ]
    : [];

  /* ============================= Cities ============================= */
  const [cities, setCities] = useState([]);
  const [ciLoading, setCiLoading] = useState(true);
  const [ciStateFilter, setCiStateFilter] = useState('');
  const [ciKeyword, setCiKeyword] = useState('');
  const [ciEditModal, setCiEditModal] = useState(false);
  const [ciEditRow, setCiEditRow] = useState(null);
  const [ciFormData, setCiFormData] = useState({ state_id: '', name: '', sort_order: '' });
  const [ciSaving, setCiSaving] = useState(false);
  const [ciFormError, setCiFormError] = useState('');
  const [ciDeleteConfirm, setCiDeleteConfirm] = useState(null);

  const fetchCities = useCallback(async (stateId, q) => {
    try {
      setCiLoading(true);
      const params = {};
      if (stateId) params.state_id = stateId;
      if (q) params.q = q;
      const res = await api.get('/geo/cities', { params });
      setCities(res.data.data || []);
    } catch (err) {
      console.error('Error fetching cities:', err);
    } finally {
      setCiLoading(false);
    }
  }, []);

  // Debounce the fetch when the filter/search values change
  useEffect(() => {
    const handle = setTimeout(() => {
      fetchCities(ciStateFilter, ciKeyword);
    }, 300);
    return () => clearTimeout(handle);
  }, [fetchCities, ciStateFilter, ciKeyword]);

  function handleCiStateFilterChange(e) {
    setCiStateFilter(e.target.value);
  }

  function handleCiKeywordChange(e) {
    setCiKeyword(e.target.value);
  }

  function handleCiAddNew() {
    setCiEditRow(null);
    setCiFormData({ state_id: ciStateFilter || '', name: '', sort_order: '' });
    setCiFormError('');
    setCiEditModal(true);
  }

  function handleCiAction(action, row) {
    if (action === 'edit') {
      setCiEditRow(row);
      setCiFormData({
        state_id: row.state_id != null ? String(row.state_id) : '',
        name: row.name || '',
        sort_order: row.sort_order ?? '',
      });
      setCiFormError('');
      setCiEditModal(true);
    } else if (action === 'delete') {
      setCiDeleteConfirm(row);
    }
  }

  function handleCiFormChange(e) {
    const { name, value } = e.target;
    setCiFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleCiFormSubmit(e) {
    e.preventDefault();
    if (!ciFormData.name.trim() || !ciFormData.state_id) return;

    setCiSaving(true);
    setCiFormError('');
    try {
      const payload = {
        state_id: Number(ciFormData.state_id),
        name: ciFormData.name.trim(),
        sort_order: Number(ciFormData.sort_order) || 0,
      };

      if (ciEditRow) {
        await api.put(`/geo/cities/${ciEditRow.id}`, payload);
      } else {
        await api.post('/geo/cities', payload);
      }
      setCiEditModal(false);
      fetchCities(ciStateFilter, ciKeyword);
    } catch (err) {
      console.error('City save error:', err);
      setCiFormError(err.response?.data?.message || t('geography.saveFailed'));
    } finally {
      setCiSaving(false);
    }
  }

  async function handleCiDelete() {
    if (!ciDeleteConfirm) return;
    try {
      await api.delete(`/geo/cities/${ciDeleteConfirm.id}`);
      setCiDeleteConfirm(null);
      fetchCities(ciStateFilter, ciKeyword);
    } catch (err) {
      console.error('City delete error:', err);
    }
  }

  const ciColumns = [
    { key: 'name', label: t('geography.name'), sortable: false },
    { key: 'state_name', label: t('geography.state'), sortable: false },
    { key: 'country_name', label: t('geography.country'), sortable: false },
    { key: 'sort_order', label: t('geography.sortOrder'), sortable: false, align: 'right' },
  ];

  const ciActions = isAdmin
    ? [
        { key: 'edit', label: t('common.edit') },
        { key: 'delete', label: t('common.delete') },
      ]
    : [];

  /* ========================== Loading Ports ========================== */
  const [loadingPorts, setLoadingPorts] = useState([]);
  const [lpLoading, setLpLoading] = useState(true);
  const [lpEditModal, setLpEditModal] = useState(false);
  const [lpEditRow, setLpEditRow] = useState(null);
  const [lpFormData, setLpFormData] = useState({ name: '', country_id: '', code: '', is_active: true, sort_order: '' });
  const [lpSaving, setLpSaving] = useState(false);
  const [lpFormError, setLpFormError] = useState('');
  const [lpDeleteConfirm, setLpDeleteConfirm] = useState(null);

  const fetchLoadingPorts = useCallback(async () => {
    try {
      setLpLoading(true);
      const res = await api.get('/geo/loading-ports');
      setLoadingPorts(res.data.data || []);
    } catch (err) {
      console.error('Error fetching loading ports:', err);
    } finally {
      setLpLoading(false);
    }
  }, []);

  useEffect(() => { fetchLoadingPorts(); }, [fetchLoadingPorts]);

  function handleLpAddNew() {
    setLpEditRow(null);
    setLpFormData({ name: '', country_id: '', code: '', is_active: true, sort_order: '' });
    setLpFormError('');
    setLpEditModal(true);
  }

  function handleLpAction(action, row) {
    if (action === 'edit') {
      setLpEditRow(row);
      setLpFormData({
        name: row.name || '',
        country_id: row.country_id != null ? String(row.country_id) : '',
        code: row.code || '',
        is_active: row.is_active !== false,
        sort_order: row.sort_order ?? '',
      });
      setLpFormError('');
      setLpEditModal(true);
    } else if (action === 'delete') {
      setLpDeleteConfirm(row);
    }
  }

  function handleLpFormChange(e) {
    const { name, value, type, checked } = e.target;
    setLpFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleLpFormSubmit(e) {
    e.preventDefault();
    if (!lpFormData.name.trim()) return;

    setLpSaving(true);
    setLpFormError('');
    try {
      const payload = {
        name: lpFormData.name.trim(),
        country_id: lpFormData.country_id ? Number(lpFormData.country_id) : null,
        code: lpFormData.code || null,
        is_active: lpFormData.is_active,
        sort_order: Number(lpFormData.sort_order) || 0,
      };

      if (lpEditRow) {
        await api.put(`/geo/loading-ports/${lpEditRow.id}`, payload);
      } else {
        await api.post('/geo/loading-ports', payload);
      }
      setLpEditModal(false);
      fetchLoadingPorts();
    } catch (err) {
      console.error('Loading port save error:', err);
      setLpFormError(err.response?.data?.message || t('geography.saveFailed'));
    } finally {
      setLpSaving(false);
    }
  }

  async function handleLpDelete() {
    if (!lpDeleteConfirm) return;
    try {
      await api.delete(`/geo/loading-ports/${lpDeleteConfirm.id}`);
      setLpDeleteConfirm(null);
      fetchLoadingPorts();
    } catch (err) {
      console.error('Loading port delete error:', err);
    }
  }

  const lpColumns = [
    { key: 'name', label: t('geography.name'), sortable: false },
    { key: 'code', label: t('geography.code'), sortable: false },
    { key: 'country_name', label: t('geography.country'), sortable: false },
    { key: 'is_active', label: t('geography.active'), sortable: false, render: (row) => <ActiveBadge isActive={row.is_active} t={t} /> },
    { key: 'sort_order', label: t('geography.sortOrder'), sortable: false, align: 'right' },
  ];

  const lpActions = isAdmin
    ? [
        { key: 'edit', label: t('common.edit') },
        { key: 'delete', label: t('common.delete') },
      ]
    : [];

  return (
    <div>
      <h2 className="mb-4">{t('geography.title')}</h2>

      {/* Countries Section */}
      <div className="geo-section">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h4 className="mb-0">{t('geography.countries')}</h4>
          {isAdmin && (
            <button type="button" className="btn btn-primary btn-sm" onClick={handleCoAddNew}>
              {t('geography.addCountry')}
            </button>
          )}
        </div>

        <DataTable
          columns={coColumns}
          data={countries}
          loading={coLoading}
          actions={coActions}
          onAction={handleCoAction}
        />
      </div>

      {/* States Section */}
      <div className="geo-section mt-5">
        <div className="d-flex align-items-center justify-content-between mb-3 geo-section-header">
          <h4 className="mb-0">{t('geography.states')}</h4>
          <div className="geo-header-controls">
            <select
              className="form-select form-select-sm geo-filter-select"
              value={stCountryFilter}
              onChange={handleStCountryFilterChange}
              aria-label={t('geography.filterByCountry')}
            >
              <option value="">{t('geography.allCountries')}</option>
              {countries.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {isAdmin && (
              <button type="button" className="btn btn-primary btn-sm" onClick={handleStAddNew}>
                {t('geography.addState')}
              </button>
            )}
          </div>
        </div>

        <DataTable
          columns={stColumns}
          data={states}
          loading={stLoading}
          actions={stActions}
          onAction={handleStAction}
        />
      </div>

      {/* Cities Section */}
      <div className="geo-section mt-5">
        <div className="d-flex align-items-center justify-content-between mb-3 geo-section-header">
          <h4 className="mb-0">{t('geography.cities')}</h4>
          <div className="geo-header-controls">
            <input
              type="text"
              className="form-control form-control-sm geo-filter-search"
              placeholder={t('geography.searchCities')}
              value={ciKeyword}
              onChange={handleCiKeywordChange}
              aria-label={t('geography.searchCities')}
            />
            <select
              className="form-select form-select-sm geo-filter-select"
              value={ciStateFilter}
              onChange={handleCiStateFilterChange}
              aria-label={t('geography.filterByState')}
            >
              <option value="">{t('geography.allStates')}</option>
              {allStates.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.country_name})</option>
              ))}
            </select>
            {isAdmin && (
              <button type="button" className="btn btn-primary btn-sm" onClick={handleCiAddNew}>
                {t('geography.addCity')}
              </button>
            )}
          </div>
        </div>

        <DataTable
          columns={ciColumns}
          data={cities}
          loading={ciLoading}
          actions={ciActions}
          onAction={handleCiAction}
        />
      </div>

      {/* Loading Ports Section */}
      <div className="geo-section mt-5">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h4 className="mb-0">{t('geography.loadingPorts')}</h4>
          {isAdmin && (
            <button type="button" className="btn btn-primary btn-sm" onClick={handleLpAddNew}>
              {t('geography.addLoadingPort')}
            </button>
          )}
        </div>

        <DataTable
          columns={lpColumns}
          data={loadingPorts}
          loading={lpLoading}
          actions={lpActions}
          onAction={handleLpAction}
        />
      </div>

      {/* Countries – Add/Edit Modal */}
      {coEditModal && (
        <div className="geo-modal-overlay" onClick={() => setCoEditModal(false)}>
          <div className="geo-modal" onClick={e => e.stopPropagation()}>
            <div className="geo-modal-header">
              <h5>{coEditRow ? t('geography.editCountry') : t('geography.addNewCountry')}</h5>
              <button className="geo-modal-close" aria-label={t('common.close')} onClick={() => setCoEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCoFormSubmit}>
              <div className="geo-modal-body">
                {coFormError && (
                  <div className="alert alert-danger py-2 mb-3">{coFormError}</div>
                )}
                <div className="mb-3">
                  <label className="form-label" htmlFor="co-name">
                    {t('geography.name')} <span className="text-danger">*</span>
                  </label>
                  <input
                    id="co-name"
                    type="text"
                    className="form-control"
                    name="name"
                    value={coFormData.name}
                    onChange={handleCoFormChange}
                    required
                  />
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label" htmlFor="co-code">{t('geography.code')}</label>
                    <input
                      id="co-code"
                      type="text"
                      className="form-control"
                      name="code"
                      value={coFormData.code}
                      onChange={handleCoFormChange}
                      placeholder="e.g., US, GE"
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label" htmlFor="co-sort-order">{t('geography.sortOrder')}</label>
                    <input
                      id="co-sort-order"
                      type="number"
                      className="form-control"
                      name="sort_order"
                      value={coFormData.sort_order}
                      onChange={handleCoFormChange}
                    />
                  </div>
                </div>
              </div>
              <div className="geo-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCoEditModal(false)}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={coSaving}>
                  {coSaving ? t('common.saving') : (coEditRow ? t('common.update') : t('common.create'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Countries – Delete Confirmation Modal */}
      {coDeleteConfirm && (
        <div className="geo-modal-overlay" onClick={() => setCoDeleteConfirm(null)}>
          <div className="geo-modal geo-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="geo-modal-header">
              <h5>{t('geography.deleteCountry')}</h5>
              <button className="geo-modal-close" aria-label={t('common.close')} onClick={() => setCoDeleteConfirm(null)}>&times;</button>
            </div>
            <div className="geo-modal-body">
              <p>{t('geography.confirmDeleteCountry')}</p>
              <p className="text-muted mb-0">{coDeleteConfirm.name}</p>
            </div>
            <div className="geo-modal-footer">
              <button className="btn btn-secondary" onClick={() => setCoDeleteConfirm(null)}>{t('common.cancel')}</button>
              <button className="btn btn-danger" onClick={handleCoDelete}>{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* States – Add/Edit Modal */}
      {stEditModal && (
        <div className="geo-modal-overlay" onClick={() => setStEditModal(false)}>
          <div className="geo-modal" onClick={e => e.stopPropagation()}>
            <div className="geo-modal-header">
              <h5>{stEditRow ? t('geography.editState') : t('geography.addNewState')}</h5>
              <button className="geo-modal-close" aria-label={t('common.close')} onClick={() => setStEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleStFormSubmit}>
              <div className="geo-modal-body">
                {stFormError && (
                  <div className="alert alert-danger py-2 mb-3">{stFormError}</div>
                )}
                <div className="mb-3">
                  <label className="form-label" htmlFor="st-country">
                    {t('geography.country')} <span className="text-danger">*</span>
                  </label>
                  <select
                    id="st-country"
                    className="form-select"
                    name="country_id"
                    value={stFormData.country_id}
                    onChange={handleStFormChange}
                    required
                  >
                    <option value="">{t('geography.selectCountry')}</option>
                    {countries.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="st-name">
                    {t('geography.name')} <span className="text-danger">*</span>
                  </label>
                  <input
                    id="st-name"
                    type="text"
                    className="form-control"
                    name="name"
                    value={stFormData.name}
                    onChange={handleStFormChange}
                    required
                  />
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label" htmlFor="st-code">{t('geography.code')}</label>
                    <input
                      id="st-code"
                      type="text"
                      className="form-control"
                      name="code"
                      value={stFormData.code}
                      onChange={handleStFormChange}
                      placeholder="e.g., CA, NY"
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label" htmlFor="st-sort-order">{t('geography.sortOrder')}</label>
                    <input
                      id="st-sort-order"
                      type="number"
                      className="form-control"
                      name="sort_order"
                      value={stFormData.sort_order}
                      onChange={handleStFormChange}
                    />
                  </div>
                </div>
              </div>
              <div className="geo-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setStEditModal(false)}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={stSaving}>
                  {stSaving ? t('common.saving') : (stEditRow ? t('common.update') : t('common.create'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* States – Delete Confirmation Modal */}
      {stDeleteConfirm && (
        <div className="geo-modal-overlay" onClick={() => setStDeleteConfirm(null)}>
          <div className="geo-modal geo-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="geo-modal-header">
              <h5>{t('geography.deleteState')}</h5>
              <button className="geo-modal-close" aria-label={t('common.close')} onClick={() => setStDeleteConfirm(null)}>&times;</button>
            </div>
            <div className="geo-modal-body">
              <p>{t('geography.confirmDeleteState')}</p>
              <p className="text-muted mb-0">{stDeleteConfirm.name}</p>
            </div>
            <div className="geo-modal-footer">
              <button className="btn btn-secondary" onClick={() => setStDeleteConfirm(null)}>{t('common.cancel')}</button>
              <button className="btn btn-danger" onClick={handleStDelete}>{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Cities – Add/Edit Modal */}
      {ciEditModal && (
        <div className="geo-modal-overlay" onClick={() => setCiEditModal(false)}>
          <div className="geo-modal" onClick={e => e.stopPropagation()}>
            <div className="geo-modal-header">
              <h5>{ciEditRow ? t('geography.editCity') : t('geography.addNewCity')}</h5>
              <button className="geo-modal-close" aria-label={t('common.close')} onClick={() => setCiEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCiFormSubmit}>
              <div className="geo-modal-body">
                {ciFormError && (
                  <div className="alert alert-danger py-2 mb-3">{ciFormError}</div>
                )}
                <div className="mb-3">
                  <label className="form-label" htmlFor="ci-state">
                    {t('geography.state')} <span className="text-danger">*</span>
                  </label>
                  <select
                    id="ci-state"
                    className="form-select"
                    name="state_id"
                    value={ciFormData.state_id}
                    onChange={handleCiFormChange}
                    required
                  >
                    <option value="">{t('geography.selectState')}</option>
                    {allStates.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.country_name})</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="ci-name">
                    {t('geography.name')} <span className="text-danger">*</span>
                  </label>
                  <input
                    id="ci-name"
                    type="text"
                    className="form-control"
                    name="name"
                    value={ciFormData.name}
                    onChange={handleCiFormChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="ci-sort-order">{t('geography.sortOrder')}</label>
                  <input
                    id="ci-sort-order"
                    type="number"
                    className="form-control"
                    name="sort_order"
                    value={ciFormData.sort_order}
                    onChange={handleCiFormChange}
                  />
                </div>
              </div>
              <div className="geo-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCiEditModal(false)}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={ciSaving}>
                  {ciSaving ? t('common.saving') : (ciEditRow ? t('common.update') : t('common.create'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cities – Delete Confirmation Modal */}
      {ciDeleteConfirm && (
        <div className="geo-modal-overlay" onClick={() => setCiDeleteConfirm(null)}>
          <div className="geo-modal geo-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="geo-modal-header">
              <h5>{t('geography.deleteCity')}</h5>
              <button className="geo-modal-close" aria-label={t('common.close')} onClick={() => setCiDeleteConfirm(null)}>&times;</button>
            </div>
            <div className="geo-modal-body">
              <p>{t('geography.confirmDeleteCity')}</p>
              <p className="text-muted mb-0">{ciDeleteConfirm.name}</p>
            </div>
            <div className="geo-modal-footer">
              <button className="btn btn-secondary" onClick={() => setCiDeleteConfirm(null)}>{t('common.cancel')}</button>
              <button className="btn btn-danger" onClick={handleCiDelete}>{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Ports – Add/Edit Modal */}
      {lpEditModal && (
        <div className="geo-modal-overlay" onClick={() => setLpEditModal(false)}>
          <div className="geo-modal" onClick={e => e.stopPropagation()}>
            <div className="geo-modal-header">
              <h5>{lpEditRow ? t('geography.editLoadingPort') : t('geography.addNewLoadingPort')}</h5>
              <button className="geo-modal-close" aria-label={t('common.close')} onClick={() => setLpEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleLpFormSubmit}>
              <div className="geo-modal-body">
                {lpFormError && (
                  <div className="alert alert-danger py-2 mb-3">{lpFormError}</div>
                )}
                <div className="mb-3">
                  <label className="form-label" htmlFor="lp-name">
                    {t('geography.name')} <span className="text-danger">*</span>
                  </label>
                  <input
                    id="lp-name"
                    type="text"
                    className="form-control"
                    name="name"
                    value={lpFormData.name}
                    onChange={handleLpFormChange}
                    required
                  />
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label" htmlFor="lp-country">{t('geography.country')}</label>
                    <select
                      id="lp-country"
                      className="form-select"
                      name="country_id"
                      value={lpFormData.country_id}
                      onChange={handleLpFormChange}
                    >
                      <option value="">—</option>
                      {countries.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label" htmlFor="lp-code">{t('geography.code')}</label>
                    <input
                      id="lp-code"
                      type="text"
                      className="form-control"
                      name="code"
                      value={lpFormData.code}
                      onChange={handleLpFormChange}
                      placeholder="e.g., NYC, SAV"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="lp-sort-order">{t('geography.sortOrder')}</label>
                  <input
                    id="lp-sort-order"
                    type="number"
                    className="form-control"
                    name="sort_order"
                    value={lpFormData.sort_order}
                    onChange={handleLpFormChange}
                  />
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="lp-is-active"
                      name="is_active"
                      checked={lpFormData.is_active}
                      onChange={handleLpFormChange}
                    />
                    <label className="form-check-label" htmlFor="lp-is-active">
                      {t('geography.active')}
                    </label>
                  </div>
                </div>
              </div>
              <div className="geo-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setLpEditModal(false)}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={lpSaving}>
                  {lpSaving ? t('common.saving') : (lpEditRow ? t('common.update') : t('common.create'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading Ports – Delete Confirmation Modal */}
      {lpDeleteConfirm && (
        <div className="geo-modal-overlay" onClick={() => setLpDeleteConfirm(null)}>
          <div className="geo-modal geo-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="geo-modal-header">
              <h5>{t('geography.deleteLoadingPort')}</h5>
              <button className="geo-modal-close" aria-label={t('common.close')} onClick={() => setLpDeleteConfirm(null)}>&times;</button>
            </div>
            <div className="geo-modal-body">
              <p>{t('geography.confirmDeleteLoadingPort')}</p>
              <p className="text-muted mb-0">{lpDeleteConfirm.name}</p>
            </div>
            <div className="geo-modal-footer">
              <button className="btn btn-secondary" onClick={() => setLpDeleteConfirm(null)}>{t('common.cancel')}</button>
              <button className="btn btn-danger" onClick={handleLpDelete}>{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Geography;
