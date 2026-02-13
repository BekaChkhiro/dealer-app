import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import './Ticket.css';

function Ticket() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="mb-4">{t('ticket.title')}</h2>
      <div className="ticket-placeholder">
        <div className="ticket-placeholder-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#6C757D" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <h4 className="ticket-placeholder-title">{t('ticket.supportTickets')}</h4>
        <p className="ticket-placeholder-text">
          {t('ticket.comingSoon')}
        </p>
        {user && (
          <p className="ticket-placeholder-user">
            {t('ticket.loggedInAs')} <strong>{user.name} {user.surname}</strong> ({user.role})
          </p>
        )}
      </div>
    </div>
  );
}

export default Ticket;
