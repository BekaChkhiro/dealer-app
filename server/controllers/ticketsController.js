const pool = require('../config/db');
const { logAudit } = require('../helpers/auditLog');

const ALLOWED_SORT_COLUMNS = ['id', 'subject', 'status', 'priority', 'created_at', 'updated_at'];
const ALLOWED_ORDER = ['asc', 'desc'];

async function getTickets(req, res) {
  try {
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * limit;
    const keyword = req.query.keyword || '';
    const sortBy = ALLOWED_SORT_COLUMNS.includes(req.query.sort_by) ? req.query.sort_by : 'id';
    const order = ALLOWED_ORDER.includes(req.query.asc) ? req.query.asc : 'desc';
    const { status, priority } = req.query;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (keyword) {
      conditions.push(`(t.subject ILIKE $${paramIndex} OR t.message ILIKE $${paramIndex})`);
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (status) {
      conditions.push(`t.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (priority) {
      conditions.push(`t.priority = $${paramIndex}`);
      params.push(priority);
      paramIndex++;
    }

    // Non-admin users only see their own tickets
    if (req.session.user.role !== 'admin') {
      conditions.push(`t.user_id = $${paramIndex}`);
      params.push(req.session.user.id);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM tickets t ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(
      `SELECT t.*, u.name AS user_name, u.surname AS user_surname
       FROM tickets t
       LEFT JOIN users u ON t.user_id = u.id
       ${whereClause}
       ORDER BY t.${sortBy} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({ error: 0, success: true, data: dataResult.rows, total });
  } catch (err) {
    console.error('getTickets error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function getTicketById(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT t.*, u.name AS user_name, u.surname AS user_surname
       FROM tickets t
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Ticket not found' });
    }

    const ticket = result.rows[0];

    // Non-admin users can only view their own tickets
    if (req.session.user.role !== 'admin' && ticket.user_id !== req.session.user.id) {
      return res.status(403).json({ error: 1, success: false, message: 'Forbidden' });
    }

    res.json({ error: 0, success: true, data: ticket });
  } catch (err) {
    console.error('getTicketById error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function createTicket(req, res) {
  try {
    const { subject, message, priority } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: 1, success: false, message: 'Subject is required' });
    }

    const result = await pool.query(
      `INSERT INTO tickets (user_id, subject, message, priority, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'open', NOW(), NOW())
       RETURNING *`,
      [req.session.user.id, subject.trim(), message || null, priority || 'medium']
    );

    logAudit({ userId: req.session.user.id, entityType: 'ticket', entityId: result.rows[0].id, action: 'CREATE', oldValues: null, newValues: result.rows[0], ipAddress: req.ip });
    res.status(201).json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('createTicket error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function updateTicket(req, res) {
  try {
    const { id } = req.params;
    const isAdmin = req.session.user.role === 'admin';

    // Fetch existing ticket
    const existing = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Ticket not found' });
    }

    const ticket = existing.rows[0];

    // Non-admin can only edit their own tickets
    if (!isAdmin && ticket.user_id !== req.session.user.id) {
      return res.status(403).json({ error: 1, success: false, message: 'Forbidden' });
    }

    const { subject, message, status, priority } = req.body;

    const fields = [];
    const params = [];
    let paramIndex = 1;

    const addField = (column, value) => {
      if (value !== undefined) {
        fields.push(`${column} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    };

    // All authenticated users can update subject and message on their own tickets
    addField('subject', subject);
    addField('message', message);

    // Only admin can update status and priority
    if (isAdmin) {
      addField('status', status);
      addField('priority', priority);

      // Set resolved_at when status changes to resolved
      if (status === 'resolved' && ticket.status !== 'resolved') {
        fields.push(`resolved_at = NOW()`);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 1, success: false, message: 'No fields to update' });
    }

    // Always update updated_at
    fields.push(`updated_at = NOW()`);

    params.push(id);
    const result = await pool.query(
      `UPDATE tickets SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    logAudit({ userId: req.session.user.id, entityType: 'ticket', entityId: parseInt(id), action: 'UPDATE', oldValues: ticket, newValues: result.rows[0], ipAddress: req.ip });
    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('updateTicket error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function deleteTicket(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM tickets WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Ticket not found' });
    }

    logAudit({ userId: req.session.user.id, entityType: 'ticket', entityId: parseInt(id), action: 'DELETE', oldValues: result.rows[0], newValues: null, ipAddress: req.ip });
    res.json({ error: 0, success: true, message: 'Ticket deleted' });
  } catch (err) {
    console.error('deleteTicket error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

module.exports = { getTickets, getTicketById, createTicket, updateTicket, deleteTicket };
