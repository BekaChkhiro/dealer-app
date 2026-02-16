import { useState, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import './Dashboard.css';

function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((res) => {
        const d = res.data.data;
        setStats({
          vehicles: d.total_vehicles ?? 0,
          bookings: d.total_bookings ?? 0,
          containers: d.total_containers ?? 0,
          boats: d.total_boats ?? 0,
          balance: d.total_balance ?? 0,
          debt: d.total_debt ?? 0,
        });
      })
      .catch(() => {
        setStats({ vehicles: 0, bookings: 0, containers: 0, boats: 0, balance: 0, debt: 0 });
      })
      .finally(() => setLoading(false));
  }, []);

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
      label: t('dashboard.boats'),
      value: stats.boats,
      color: '#0DCAF0',
      bg: '#CFF4FC',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0DCAF0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 20s2-2 5-2 5 2 8 2 5-2 5-2" />
          <path d="M12 4l-4 12h8L12 4z" />
          <line x1="12" y1="4" x2="12" y2="16" />
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
    </div>
  );
}

export default Dashboard;
