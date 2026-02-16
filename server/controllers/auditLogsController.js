const pool = require('../config/db');

const ALLOWED_SORT_COLUMNS = ['id', 'entity_type', 'action', 'created_at', 'user_id'];
const ALLOWED_ORDER = ['asc', 'desc'];

async function getAuditLogs(req, res) {
  try {
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * limit;
    const keyword = req.query.keyword || '';
    const sortBy = ALLOWED_SORT_COLUMNS.includes(req.query.sort_by) ? req.query.sort_by : 'id';
    const order = ALLOWED_ORDER.includes(req.query.asc) ? req.query.asc : 'desc';
    const { entity_type, action, user_id, start_date, end_date } = req.query;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (keyword) {
      conditions.push(`(a.entity_type ILIKE $${paramIndex} OR a.action ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex} OR u.surname ILIKE $${paramIndex} OR CAST(a.entity_id AS TEXT) ILIKE $${paramIndex})`);
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (entity_type) {
      conditions.push(`a.entity_type = $${paramIndex}`);
      params.push(entity_type);
      paramIndex++;
    }

    if (action) {
      conditions.push(`a.action = $${paramIndex}`);
      params.push(action);
      paramIndex++;
    }

    if (user_id) {
      conditions.push(`a.user_id = $${paramIndex}`);
      params.push(user_id);
      paramIndex++;
    }

    if (start_date) {
      conditions.push(`a.created_at >= $${paramIndex}`);
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      conditions.push(`a.created_at <= $${paramIndex}`);
      params.push(end_date);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const sortColumn = sortBy === 'user_id' ? 'a.user_id' : `a.${sortBy}`;
    const dataResult = await pool.query(
      `SELECT a.*, u.name AS user_name, u.surname AS user_surname
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       ${whereClause}
       ORDER BY ${sortColumn} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({ error: 0, success: true, data: dataResult.rows, total });
  } catch (err) {
    console.error('getAuditLogs error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

module.exports = { getAuditLogs };
