import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Calculator from './pages/Calculator';
import Boats from './pages/Boats';
import Cars from './pages/Cars';
import Users from './pages/Users';
import Booking from './pages/Booking';
import Containers from './pages/Containers';
import Transactions from './pages/Transactions';
import Ticket from './pages/Ticket';
import ChangePassword from './pages/ChangePassword';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/global.css';

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Responsive breakpoint listeners
  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 767.98px)');
    const tabletQuery = window.matchMedia('(min-width: 768px) and (max-width: 992px)');

    const handleChange = () => {
      const mobile = mobileQuery.matches;
      const tablet = tabletQuery.matches;
      setIsMobile(mobile);
      setIsTablet(tablet);
      if (mobile) {
        setSidebarOpen(false);
      } else if (tablet) {
        setSidebarCollapsed(true);
      }
    };

    handleChange();
    mobileQuery.addEventListener('change', handleChange);
    tabletQuery.addEventListener('change', handleChange);
    return () => {
      mobileQuery.removeEventListener('change', handleChange);
      tabletQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Close mobile sidebar on navigation
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  const handleToggle = useCallback(() => {
    if (isMobile) {
      setSidebarOpen(o => !o);
    } else {
      setSidebarCollapsed(c => !c);
    }
  }, [isMobile]);

  const handleCloseMobile = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: 'var(--content-bg)',
      }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  const mainMarginLeft = isMobile ? 0 : sidebarCollapsed ? 70 : 270;
  const mainPadding = isMobile ? 16 : 24;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar
        isCollapsed={isMobile ? false : sidebarCollapsed}
        onToggle={handleToggle}
        isMobile={isMobile}
        isOpen={sidebarOpen}
        onClose={handleCloseMobile}
      />
      <Header
        sidebarCollapsed={isMobile ? true : sidebarCollapsed}
        onToggle={handleToggle}
        isMobile={isMobile}
      />
      <main style={{
        marginLeft: mainMarginLeft,
        marginTop: 'var(--header-height)',
        padding: mainPadding,
        width: '100%',
        minHeight: '100vh',
        transition: 'margin-left 0.2s ease',
        backgroundColor: 'var(--content-bg)',
      }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/cars" element={<Cars />} />
          <Route path="/containers" element={<Containers />} />
          <Route path="/boats" element={<Boats />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/ticket" element={<Ticket />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
