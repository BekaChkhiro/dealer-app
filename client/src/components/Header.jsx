import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import './Header.css';

function getInitials(user) {
  if (user?.name && user?.surname) {
    return (user.name[0] + user.surname[0]).toUpperCase();
  }
  if (user?.username) {
    return user.username.slice(0, 2).toUpperCase();
  }
  return '??';
}

const GeorgianFlag = () => (
  <svg className="header-lang-flag" viewBox="0 0 20 14">
    <rect width="20" height="4.67" fill="#fff" />
    <rect y="4.67" width="20" height="4.67" fill="#E8403E" />
    <rect y="9.33" width="20" height="4.67" fill="#fff" />
    <rect x="8.5" y="0" width="3" height="14" fill="#E8403E" />
    <rect x="0" y="5.5" width="20" height="3" fill="#E8403E" />
  </svg>
);

const UKFlag = () => (
  <svg className="header-lang-flag" viewBox="0 0 20 14">
    <rect width="20" height="14" fill="#012169" />
    <path d="M0 0L20 14M20 0L0 14" stroke="#fff" strokeWidth="2.5" />
    <path d="M0 0L20 14M20 0L0 14" stroke="#C8102E" strokeWidth="1.5" />
    <path d="M10 0V14M0 7H20" stroke="#fff" strokeWidth="4" />
    <path d="M10 0V14M0 7H20" stroke="#C8102E" strokeWidth="2.5" />
  </svg>
);

const LANGUAGES = [
  { code: 'ka', label: 'ქართ', fullLabel: 'ქართული', Flag: GeorgianFlag },
  { code: 'en', label: 'ENG', fullLabel: 'English', Flag: UKFlag },
];

export default function Header({ onToggle, sidebarCollapsed }) {
  const { user } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const navigate = useNavigate();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);

  // VIN search state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Debounced search
  const doSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      setShowDropdown(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/search', { params: { q: q.trim() } });
      const data = res.data?.data || [];
      setResults(data);
      setShowDropdown(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setActiveIndex(-1);
    clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setResults([]);
      setShowDropdown(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setShowDropdown(true);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  const navigateToResult = (item) => {
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    setActiveIndex(-1);
    navigate(`/cars/${item.id}`);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || results.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        e.preventDefault();
        doSearch(query);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => (i < results.length - 1 ? i + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => (i > 0 ? i - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        navigateToResult(results[activeIndex]);
      } else if (results.length === 1) {
        navigateToResult(results[0]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <header className={`header${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <div className="header-left">
        {/* Hamburger toggle */}
        <button className="header-hamburger" onClick={onToggle} aria-label="Toggle sidebar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* VIN search */}
        <div className="header-search" ref={searchRef}>
          <input
            type="text"
            placeholder={t('header.searchByVin')}
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
          />
          <span className="header-search-icon">
            {loading ? (
              <span className="header-search-spinner" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            )}
          </span>

          {showDropdown && (
            <div className="header-search-dropdown">
              {loading && results.length === 0 ? (
                <div className="header-search-empty">{t('common.loading')}</div>
              ) : results.length === 0 ? (
                <div className="header-search-empty">{t('header.noResults')}</div>
              ) : (
                results.map((item, idx) => (
                  <button
                    key={item.id}
                    className={`header-search-result${idx === activeIndex ? ' active' : ''}`}
                    onClick={() => navigateToResult(item)}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    <div className="header-search-result-img">
                      {item.profile_image_url ? (
                        <img src={item.profile_image_url} alt="" />
                      ) : (
                        <div className="header-search-result-noimg">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                        </div>
                      )}
                    </div>
                    <div className="header-search-result-info">
                      <span className="header-search-result-name">
                        {item.mark} {item.model} {item.year}
                      </span>
                      <span className="header-search-result-vin">{item.vin}</span>
                    </div>
                    {item.current_status && (
                      <span className={`header-search-result-status status-${item.current_status}`}>
                        {item.current_status}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="header-right">
        {/* Language dropdown */}
        <div className="header-lang-wrapper" ref={langRef}>
          <button
            className="header-lang"
            aria-label={t('header.language')}
            onClick={() => setLangOpen(o => !o)}
          >
            <current.Flag />
            <span>{current.label}</span>
            <span className="header-lang-chevron">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </button>

          {langOpen && (
            <div className="header-lang-dropdown">
              {LANGUAGES.map(({ code, fullLabel, Flag }) => (
                <button
                  key={code}
                  className={`header-lang-option${language === code ? ' active' : ''}`}
                  onClick={() => {
                    setLanguage(code);
                    setLangOpen(false);
                  }}
                >
                  <Flag />
                  <span>{fullLabel}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Settings gear */}
        <button className="header-settings" aria-label="Settings" onClick={() => navigate('/settings')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {/* User info */}
        <div className="header-user">
          <div className="header-avatar">
            {getInitials(user)}
          </div>
          <div className="header-user-info">
            <span className="header-username">{user?.username || 'User'}</span>
            <span className="header-email">{user?.email || ''}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
