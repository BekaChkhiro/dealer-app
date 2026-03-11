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
    if (!window.confirm(t.messages?.confirmDelete || 'Are you sure you want to delete this message?')) {
      return;
    }

    try {
      await api.delete(`/messages/${id}`);
      fetchMessages();
    } catch (err) {
      console.error('Delete message error:', err);
      alert(t.messages?.deleteError || 'Failed to delete message');
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (val) => `#${val}`
    },
    {
      key: 'from_user_name',
      label: t.messages?.from || 'From',
      render: (val, row) => `${row.from_user_name || ''} ${row.from_user_surname || ''}`
    },
    {
      key: 'subject',
      label: t.messages?.subject || 'Subject',
      render: (val, row) => (
        <span style={{ fontWeight: row.read_at ? 'normal' : 'bold' }}>
          {val}
          {!row.read_at && <span className="unread-badge">New</span>}
        </span>
      )
    },
    {
      key: 'created_at',
      label: t.messages?.date || 'Date',
      render: formatDate
    },
    {
      key: 'read_at',
      label: t.messages?.status || 'Status',
      render: (val) => (
        <span className={`status-badge ${val ? 'read' : 'unread'}`}>
          {val ? (t.messages?.read || 'Read') : (t.messages?.unread || 'Unread')}
        </span>
      )
    }
  ];

  const actions = [
    {
      label: t.messages?.view || 'View',
      handler: (row) => handleViewMessage(row)
    }
  ];

  if (isAdmin) {
    actions.push({
      label: t.common?.delete || 'Delete',
      handler: (row) => handleDelete(row.id)
    });
  }

  return (
    <div className="messages-page">
      <div className="page-header">
        <h2>{t.messages?.title || 'Messages'}</h2>
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
            <span>{t.messages?.showUnreadOnly || 'Show unread only'}</span>
          </label>
        </div>
        <div className="right-actions">
          <input
            type="text"
            className="search-input"
            placeholder={t.messages?.searchPlaceholder || 'Search messages...'}
            value={keyword}
            onChange={handleSearch}
          />
        </div>
      </div>

      {loading && <div className="loading">{t.common?.loading || 'Loading...'}</div>}

      {!loading && messages.length === 0 && (
        <div className="no-data">
          {t.messages?.noMessages || 'No messages found'}
        </div>
      )}

      {!loading && messages.length > 0 && (
        <>
          <DataTable columns={columns} data={messages} actions={actions} />
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
                  <strong>{t.messages?.from || 'From'}:</strong>
                  <span>{selectedMessage.from_user_name} {selectedMessage.from_user_surname}</span>
                </div>
                <div className="meta-item">
                  <strong>{t.messages?.date || 'Date'}:</strong>
                  <span>{formatDate(selectedMessage.created_at)}</span>
                </div>
                {selectedMessage.read_at && (
                  <div className="meta-item">
                    <strong>{t.messages?.readAt || 'Read at'}:</strong>
                    <span>{formatDate(selectedMessage.read_at)}</span>
                  </div>
                )}
              </div>
              <div className="message-body">
                {selectedMessage.body || <em>{t.messages?.noContent || 'No message content'}</em>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseModal}>
                {t.common?.close || 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Messages;
