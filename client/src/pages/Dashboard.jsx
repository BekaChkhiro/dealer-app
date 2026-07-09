import { useState, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatDate } from '../utils/formatDate';
import { VEHICLE_STATUS_COLORS } from '../utils/vehicleStatuses';
import './Dashboard.css';

const STATUS_TABLE_KEYS = ['purchased', 'at_warehouse', 'to_load', 'loaded', 'in_transit', 'arrived', 'delivered'];
const PORT_TABLE_KEYS = ['received', 'to_load', 'in_transit', 'arrived', 'delivered'];

function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [analyticsError, setAnalyticsError] = useState(false);

  const isDealer = user?.role !== 'admin';

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((res) => {
        const d = res.data.data;
        setStats({
          vehicles: d.total_vehicles ?? 0,
          bookings: d.total_bookings ?? 0,
          containers: d.total_containers ?? 0,
          balance: d.total_balance ?? 0,
          debt: d.total_debt ?? 0,
        });
      })
      .catch(() => {
        setStats({ vehicles: 0, bookings: 0, containers: 0, balance: 0, debt: 0 });
      })
      .finally(() => setLoading(false));

    api.get('/dashboard/analytics')
      .then((res) => {
        setAnalytics(res.data.data || null);
      })
      .catch(() => {
        setAnalyticsError(true);
      })
      .finally(() => setLoadingAnalytics(false));

    // Fetch recent invoices for dealers
    if (isDealer) {
      api.get('/vehicles/invoices/list', { params: { limit: 5 } })
        .then((res) => {
          setRecentInvoices(res.data.data || []);
        })
        .catch(() => {
          setRecentInvoices([]);
        })
        .finally(() => setLoadingInvoices(false));
    }
  }, [isDealer]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const cards = [
    {
      label: t('dashboard.totalCars'),
      value: stats.vehicles,
      color: '#0D6EFD',
      bg: '#E7F1FF',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D6EFD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 17h14M5 17a2 2 0 0 1-2-2v-3l2-5h14l2 5v3a2 2 0 0 1-2 2M5 17a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M19 17a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2" />
          <circle cx="7.5" cy="14.5" r="1.5" />
          <circle cx="16.5" cy="14.5" r="1.5" />
        </svg>
      ),
    },
    {
      label: t('dashboard.activeBookings'),
      value: stats.bookings,
      color: '#198754',
      bg: '#D1E7DD',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#198754" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <line x1="9" y1="12" x2="15" y2="12" />
          <line x1="9" y1="16" x2="13" y2="16" />
        </svg>
      ),
    },
    {
      label: t('dashboard.containers'),
      value: stats.containers,
      color: '#6F42C1',
      bg: '#E8DAFB',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6F42C1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          <line x1="12" y1="11" x2="12" y2="17" />
          <line x1="9" y1="14" x2="15" y2="14" />
        </svg>
      ),
    },
    {
      label: t('dashboard.balance'),
      value: `$${Number(stats.balance).toLocaleString()}`,
      color: '#198754',
      bg: '#D1E7DD',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#198754" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      label: t('dashboard.totalDebt'),
      value: `$${Number(stats.debt).toLocaleString()}`,
      color: '#DC3545',
      bg: '#F8D7DA',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC3545" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      <h2 className="mb-4">{t('dashboard.title')}</h2>
      <div className="row g-3">
        {cards.map((card) => (
          <div key={card.label} className="col-12 col-sm-6 col-xl-4 col-xxl-2">
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon" style={{ backgroundColor: card.bg }}>
                {card.icon}
              </div>
              <div className="dashboard-stat-info">
                <span className="value" style={{ color: card.color }}>{card.value}</span>
                <span className="title">{card.label}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Invoices Section for Dealers */}
      {isDealer && (
        <div className="mt-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>{t('invoices.title')}</h4>
            <Link to="/invoices" className="btn btn-sm btn-outline-primary">
              {t('common.all')} →
            </Link>
          </div>
          {loadingInvoices ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : recentInvoices.length > 0 ? (
            <div className="card">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>VIN</th>
                      <th>{t('invoices.vehicle')}</th>
                      <th>{t('invoices.purchaseDate')}</th>
                      <th>{t('invoices.total')}</th>
                      <th>{t('invoices.debt')}</th>
                      <th>{t('invoices.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInvoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td><small>{invoice.vin}</small></td>
                        <td>{invoice.vehicle_name}</td>
                        <td>{formatDate(invoice.purchase_date)}</td>
                        <td>${Number(invoice.total_price || 0).toLocaleString()}</td>
                        <td>
                          <span style={{ color: invoice.debt_amount > 0 ? '#DC3545' : '#198754', fontWeight: 'bold' }}>
                            ${Number(invoice.debt_amount || 0).toLocaleString()}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <a
                              href={`/api/vehicles/${invoice.id}/invoice`}
                              className="btn btn-sm btn-primary"
                              download
                              style={{ fontSize: '10px', padding: '2px 6px' }}
                            >
                              {t('invoices.vehicleInvoice')}
                            </a>
                            <a
                              href={`/api/vehicles/${invoice.id}/invoice/transport`}
                              className="btn btn-sm btn-success"
                              download
                              style={{ fontSize: '10px', padding: '2px 6px' }}
                            >
                              {t('invoices.transportInvoice')}
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="alert alert-info">{t('invoices.noInvoices')}</div>
          )}
        </div>
      )}

      {/* Fleet Analytics Section */}
      <div className="mt-5">
        <h4 className="mb-3">{t('dashboard.analytics')}</h4>

        {loadingAnalytics ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : analyticsError || !analytics ? (
          <div className="alert alert-danger">{t('common.noData')}</div>
        ) : (
          <>
            {/* Highlight cards */}
            <div className="row g-3">
              {[
                { key: 'in_transit', label: t('dashboard.inTransit'), value: analytics.groups?.in_transit ?? 0, prominent: true },
                { key: 'purchased', label: t('dashboard.received'), value: analytics.groups?.received ?? 0, prominent: true },
                { key: 'to_load', label: t('dashboard.toLoad'), value: analytics.groups?.to_load ?? 0, prominent: true },
              ].map((card) => (
                <div key={card.key} className="col-12 col-md-4">
                  <div className="dashboard-highlight-card" style={{ borderLeftColor: VEHICLE_STATUS_COLORS[card.key] }}>
                    <div className="dashboard-highlight-icon" style={{ backgroundColor: `${VEHICLE_STATUS_COLORS[card.key]}22` }}>
                      <HighlightIcon statusKey={card.key} color={VEHICLE_STATUS_COLORS[card.key]} />
                    </div>
                    <div className="dashboard-highlight-info">
                      <span className="value" style={{ color: VEHICLE_STATUS_COLORS[card.key] }}>{card.value}</span>
                      <span className="title">{card.label}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="row g-3 mt-1">
              {[
                { key: 'arrived', label: t('dashboard.arrived'), value: analytics.groups?.arrived ?? 0 },
                { key: 'delivered', label: t('dashboard.delivered'), value: analytics.groups?.delivered ?? 0 },
              ].map((card) => (
                <div key={card.key} className="col-12 col-sm-6 col-md-3">
                  <div className="dashboard-stat-card">
                    <div className="dashboard-stat-icon" style={{ backgroundColor: `${VEHICLE_STATUS_COLORS[card.key]}22` }}>
                      <HighlightIcon statusKey={card.key} color={VEHICLE_STATUS_COLORS[card.key]} small />
                    </div>
                    <div className="dashboard-stat-info">
                      <span className="value" style={{ color: VEHICLE_STATUS_COLORS[card.key] }}>{card.value}</span>
                      <span className="title">{card.label}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* By Warehouse table */}
            <div className="mt-4">
              <h5 className="mb-3">{t('dashboard.byWarehouse')}</h5>
              {(analytics.by_warehouse || []).length > 0 ? (
                <div className="card">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0 dashboard-analytics-table">
                      <thead>
                        <tr>
                          <th>{t('warehouses.name')}</th>
                          <th className="text-end">{t('common.total')}</th>
                          {STATUS_TABLE_KEYS.map((key) => (
                            <th key={key} className="text-end">{t(`cars.status${toPascalCase(key)}`)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.by_warehouse.map((row, idx) => (
                          <tr key={row.warehouse_id ?? `unassigned-${idx}`}>
                            <td>{row.warehouse_name || t('dashboard.unassigned')}</td>
                            <td className="text-end fw-bold">{row.total ?? 0}</td>
                            {STATUS_TABLE_KEYS.map((key) => (
                              <td key={key} className="text-end">{row[key] ?? 0}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="alert alert-info">{t('common.noData')}</div>
              )}
            </div>

            {/* By Port table */}
            <div className="mt-4">
              <h5 className="mb-3">{t('dashboard.byPort')}</h5>
              {(analytics.by_port || []).length > 0 ? (
                <div className="card">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0 dashboard-analytics-table">
                      <thead>
                        <tr>
                          <th>{t('cars.destinationPort')}</th>
                          <th className="text-end">{t('common.total')}</th>
                          {PORT_TABLE_KEYS.map((key) => (
                            <th key={key} className="text-end">
                              {key === 'received' ? t('dashboard.received') : t(`cars.status${toPascalCase(key)}`)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.by_port.map((row, idx) => (
                          <tr key={`${row.port_name || 'unassigned'}-${idx}`}>
                            <td>{row.port_name || t('dashboard.unassigned')}</td>
                            <td className="text-end fw-bold">{row.total ?? 0}</td>
                            {PORT_TABLE_KEYS.map((key) => (
                              <td key={key} className="text-end">{row[key] ?? 0}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="alert alert-info">{t('common.noData')}</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// key -> PascalCase (e.g. "at_warehouse" -> "AtWarehouse") so it matches i18n
// keys like cars.statusAtWarehouse.
function toPascalCase(key) {
  return key
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function HighlightIcon({ statusKey, color, small }) {
  const size = small ? 24 : 28;
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (statusKey) {
    case 'in_transit':
      return (
        <svg {...common}>
          <rect x="1" y="7" width="14" height="10" rx="1" />
          <path d="M15 10h4l3 3v4h-7z" />
          <circle cx="6" cy="19" r="1.5" />
          <circle cx="17.5" cy="19" r="1.5" />
        </svg>
      );
    case 'to_load':
      return (
        <svg {...common}>
          <path d="M21 8l-9-5-9 5 9 5 9-5z" />
          <path d="M3 8v8l9 5 9-5V8" />
          <path d="M12 13v8" />
        </svg>
      );
    case 'arrived':
      return (
        <svg {...common}>
          <path d="M4 22V4a1 1 0 0 1 1-1h10l5 5v14" />
          <path d="M4 12h8" />
        </svg>
      );
    case 'delivered':
      return (
        <svg {...common}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case 'purchased':
    default:
      return (
        <svg {...common}>
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      );
  }
}

export default Dashboard;
