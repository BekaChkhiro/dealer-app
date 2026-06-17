import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import './Messages.css';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function Messages() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role === 'admin';

  const [messages, setMessages] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/messages', {
        params: { limit, page, keyword, unread_only: unreadOnly }
      });
      setMessages(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Fetch messages error:', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [limit, page, keyword, unreadOnly]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSearch = (e) => {
    setKeyword(e.target.value);
    setPage(1);
  };

  const handleViewMessage = async (message) => {
    setSelectedMessage(message);
    setShowModal(true);

    // Mark as read if not read yet
    if (!message.read_at && message.to_user_id === user.id) {
      try {
        await api.patch(`/messages/${message.id}/read`);
        fetchMessages();
      } catch (err) {
        console.error('Mark as read error:', err);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedMessage(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('messages.confirmDelete'))) {
      return;
    }

    try {
      await api.delete(`/messages/${id}`);
      fetchMessages();
    } catch (err) {
      console.error('Delete message error:', err);
      alert(t('messages.deleteError'));
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (row) => `#${row.id}`
    },
    {
      key: 'from_user_name',
      label: t('messages.from'),
      render: (row) => `${row.from_user_name || ''} ${row.from_user_surname || ''}`
    },
    {
      key: 'subject',
      label: t('messages.subject'),
      render: (row) => (
        <span style={{ fontWeight: row.read_at ? 'normal' : 'bold' }}>
          {row.subject}
          {!row.read_at && <span className="unread-badge">New</span>}
        </span>
      )
    },
    {
      key: 'created_at',
      label: t('messages.date'),
      render: (row) => formatDate(row.created_at)
    },
    {
      key: 'read_at',
      label: t('messages.status'),
      render: (row) => (
        <span className={`status-badge ${row.read_at ? 'read' : 'unread'}`}>
          {row.read_at ? t('messages.read') : t('messages.unread')}
        </span>
      )
    }
  ];

  const actions = [
    { key: 'view', label: t('messages.view') }
  ];

  if (isAdmin) {
    actions.push({ key: 'delete', label: t('common.delete') });
  }

  const handleAction = (action, row) => {
    if (action === 'view') handleViewMessage(row);
    else if (action === 'delete') handleDelete(row.id);
  };

  return (
    <div className="messages-page">
      <div className="page-header">
        <h2>{t('messages.title')}</h2>
      </div>

      <div className="action-bar">
        <div className="left-actions">
          <label className="checkbox-filter">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => {
                setUnreadOnly(e.target.checked);
                setPage(1);
              }}
            />
            <span>{t('messages.showUnreadOnly')}</span>
          </label>
        </div>
        <div className="right-actions">
          <input
            type="text"
            className="search-input"
            placeholder={t('messages.searchPlaceholder')}
            value={keyword}
            onChange={handleSearch}
          />
        </div>
      </div>

      {loading && <div className="loading">{t('common.loading')}</div>}

      {!loading && messages.length === 0 && (
        <div className="no-data">
          {t('messages.noMessages')}
        </div>
      )}

      {!loading && messages.length > 0 && (
        <>
          <DataTable columns={columns} data={messages} actions={actions} onAction={handleAction} />
          <Pagination
            total={total}
            page={page}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        </>
      )}

      {showModal && selectedMessage && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content message-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedMessage.subject}</h3>
              <button className="close-btn" onClick={handleCloseModal}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="message-meta">
                <div className="meta-item">
                  <strong>{t('messages.from')}:</strong>
                  <span>{selectedMessage.from_user_name} {selectedMessage.from_user_surname}</span>
                </div>
                <div className="meta-item">
                  <strong>{t('messages.date')}:</strong>
                  <span>{formatDate(selectedMessage.created_at)}</span>
                </div>
                {selectedMessage.read_at && (
                  <div className="meta-item">
                    <strong>{t('messages.readAt')}:</strong>
                    <span>{formatDate(selectedMessage.read_at)}</span>
                  </div>
                )}
              </div>
              <div className="message-body">
                {selectedMessage.body || <em>{t('messages.noContent')}</em>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseModal}>
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Messages;
