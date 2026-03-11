import { useState } from 'react';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import './MessageComposer.css';

function MessageComposer({ userId, userName }) {
  const { t } = useTranslation();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!subject.trim()) {
      setError(t('messages.subjectRequired') || 'Subject is required');
      return;
    }

    try {
      setLoading(true);
      await api.post('/messages', {
        to_user_id: parseInt(userId),
        subject: subject.trim(),
        body: body.trim() || null
      });

      setSuccess(t('messages.sentSuccess') || 'Message sent successfully!');
      setSubject('');
      setBody('');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Send message error:', err);
      setError(err.response?.data?.message || t('messages.sendError') || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="message-composer">
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="recipient">{t('messages.recipient') || 'Recipient'}</label>
          <input
            type="text"
            id="recipient"
            className="form-control"
            value={userName}
            disabled
            readOnly
          />
        </div>

        <div className="form-group">
          <label htmlFor="subject">{t('messages.subject') || 'Subject'} *</label>
          <input
            type="text"
            id="subject"
            className="form-control"
            placeholder={t('messages.subjectPlaceholder') || 'Enter message subject...'}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength="500"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="body">{t('messages.message') || 'Message'}</label>
          <textarea
            id="body"
            className="form-control"
            placeholder={t('messages.messagePlaceholder') || 'Enter your message...'}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows="6"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (t('common.sending') || 'Sending...') : (t('messages.sendButton') || 'Send Message')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default MessageComposer;
