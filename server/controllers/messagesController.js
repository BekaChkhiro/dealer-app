const pool = require('../config/db');
const { logAudit } = require('../helpers/auditLog');

const ALLOWED_SORT_COLUMNS = ['id', 'subject', 'created_at', 'read_at'];
const ALLOWED_ORDER = ['asc', 'desc'];

async function getMessages(req, res) {
  try {
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * limit;
    const keyword = req.query.keyword || '';
    const sortBy = ALLOWED_SORT_COLUMNS.includes(req.query.sort_by) ? req.query.sort_by : 'created_at';
    const order = ALLOWED_ORDER.includes(req.query.asc) ? req.query.asc : 'desc';
    const { unread_only } = req.query;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (keyword) {
      conditions.push(`(m.subject ILIKE $${paramIndex} OR m.body ILIKE $${paramIndex})`);
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (unread_only === 'true') {
      conditions.push(`m.read_at IS NULL`);
    }

    // Non-admin users only see messages sent TO them
    if (req.session.user.role !== 'admin') {
      conditions.push(`m.to_user_id = $${paramIndex}`);
      params.push(req.session.user.id);
      paramIndex++;
    } else {
      // Admin can filter by to_user_id if provided
      if (req.query.to_user_id) {
        conditions.push(`m.to_user_id = $${paramIndex}`);
        params.push(parseInt(req.query.to_user_id));
        paramIndex++;
      }
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM messages m ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(
      `SELECT
        m.*,
        ufrom.name AS from_user_name,
        ufrom.surname AS from_user_surname,
        uto.name AS to_user_name,
        uto.surname AS to_user_surname
       FROM messages m
       LEFT JOIN users ufrom ON m.from_user_id = ufrom.id
       LEFT JOIN users uto ON m.to_user_id = uto.id
       ${whereClause}
       ORDER BY m.${sortBy} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({ error: 0, success: true, data: dataResult.rows, total });
  } catch (err) {
    console.error('getMessages error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function getMessageById(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        m.*,
        ufrom.name AS from_user_name,
        ufrom.surname AS from_user_surname,
        ufrom.email AS from_user_email,
        uto.name AS to_user_name,
        uto.surname AS to_user_surname,
        uto.email AS to_user_email
       FROM messages m
       LEFT JOIN users ufrom ON m.from_user_id = ufrom.id
       LEFT JOIN users uto ON m.to_user_id = uto.id
       WHERE m.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Message not found' });
    }

    const message = result.rows[0];

    // Non-admin users can only view messages sent TO them
    if (req.session.user.role !== 'admin' && message.to_user_id !== req.session.user.id) {
      return res.status(403).json({ error: 1, success: false, message: 'Forbidden' });
    }

    res.json({ error: 0, success: true, data: message });
  } catch (err) {
    console.error('getMessageById error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function createMessage(req, res) {
  try {
    const { to_user_id, subject, body } = req.body;

    // Only admins can send messages
    if (req.session.user.role !== 'admin') {
      return res.status(403).json({ error: 1, success: false, message: 'Only admins can send messages' });
    }

    if (!to_user_id || !subject || !subject.trim()) {
      return res.status(400).json({ error: 1, success: false, message: 'Recipient and subject are required' });
    }

    // Verify recipient exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [to_user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(400).json({ error: 1, success: false, message: 'Recipient user not found' });
    }

    const result = await pool.query(
      `INSERT INTO messages (from_user_id, to_user_id, subject, body, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [req.session.user.id, to_user_id, subject.trim(), body || null]
    );

    logAudit({
      userId: req.session.user.id,
      entityType: 'message',
      entityId: result.rows[0].id,
      action: 'CREATE',
      oldValues: null,
      newValues: result.rows[0],
      ipAddress: req.ip
    });

    res.status(201).json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('createMessage error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function markAsRead(req, res) {
  try {
    const { id } = req.params;

    // Fetch existing message
    const existing = await pool.query('SELECT * FROM messages WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Message not found' });
    }

    const message = existing.rows[0];

    // Only recipient can mark as read
    if (message.to_user_id !== req.session.user.id) {
      return res.status(403).json({ error: 1, success: false, message: 'Forbidden' });
    }

    // Already read, no need to update
    if (message.read_at) {
      return res.json({ error: 0, success: true, data: message });
    }

    const result = await pool.query(
      `UPDATE messages SET read_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    logAudit({
      userId: req.session.user.id,
      entityType: 'message',
      entityId: parseInt(id),
      action: 'UPDATE',
      oldValues: message,
      newValues: result.rows[0],
      ipAddress: req.ip
    });

    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('markAsRead error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function deleteMessage(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM messages WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Message not found' });
    }

    logAudit({
      userId: req.session.user.id,
      entityType: 'message',
      entityId: parseInt(id),
      action: 'DELETE',
      oldValues: result.rows[0],
      newValues: null,
      ipAddress: req.ip
    });

    res.json({ error: 0, success: true, message: 'Message deleted' });
  } catch (err) {
    console.error('deleteMessage error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function getUnreadCount(req, res) {
  try {
    const userId = req.session.user.id;

    const result = await pool.query(
      `SELECT COUNT(*) as unread_count
       FROM messages
       WHERE to_user_id = $1 AND read_at IS NULL`,
      [userId]
    );

    res.json({
      error: 0,
      success: true,
      data: { unread_count: parseInt(result.rows[0].unread_count) }
    });
  } catch (err) {
    console.error('getUnreadCount error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

module.exports = {
  getMessages,
  getMessageById,
  createMessage,
  markAsRead,
  deleteMessage,
  getUnreadCount
};
