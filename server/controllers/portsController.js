const pool = require('../config/db');
const { logAudit } = require('../helpers/auditLog');

const ALLOWED_SORT_COLUMNS = ['id', 'name', 'code', 'country', 'is_active', 'created_at'];
const ALLOWED_ORDER = ['asc', 'desc'];

async function getPorts(req, res) {
  try {
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * limit;
    const keyword = req.query.keyword || '';
    const sortBy = ALLOWED_SORT_COLUMNS.includes(req.query.sort_by) ? req.query.sort_by : 'id';
    const order = ALLOWED_ORDER.includes(req.query.asc) ? req.query.asc : 'desc';
    const { is_active, active } = req.query;
    // Support both 'active' and 'is_active' query parameters
    const activeFilter = active !== undefined ? active : is_active;

    const isAdmin = req.session.user?.role === 'admin';
    const userId = req.session.user?.id;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    // For non-admin users (dealers), only show ports that have containers with their vehicles
    if (!isAdmin && userId) {
      conditions.push(`p.id IN (
        SELECT DISTINCT c.port_id
        FROM containers c
        INNER JOIN vehicles v ON v.container_number = c.container_number
        WHERE c.port_id IS NOT NULL AND v.dealer_id = $${paramIndex}
      )`);
      params.push(userId);
      paramIndex++;
    }

    if (keyword) {
      conditions.push(`(p.name ILIKE $${paramIndex} OR p.code ILIKE $${paramIndex} OR p.country ILIKE $${paramIndex})`);
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (activeFilter !== undefined && activeFilter !== '') {
      conditions.push(`p.is_active = $${paramIndex}`);
      params.push(activeFilter === 'true');
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM ports p ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get ports with container count
    // For dealers, only count containers that have their vehicles
    let containerCountQuery;
    if (!isAdmin && userId) {
      containerCountQuery = `
        LEFT JOIN (
          SELECT c.port_id, COUNT(DISTINCT c.id) AS container_count
          FROM containers c
          INNER JOIN vehicles v ON v.container_number = c.container_number
          WHERE c.port_id IS NOT NULL AND v.dealer_id = $${paramIndex}
          GROUP BY c.port_id
        ) cc ON p.id = cc.port_id`;
      params.push(userId);
      paramIndex++;
    } else {
      containerCountQuery = `
        LEFT JOIN (
          SELECT port_id, COUNT(*) AS container_count
          FROM containers
          WHERE port_id IS NOT NULL
          GROUP BY port_id
        ) cc ON p.id = cc.port_id`;
    }

    const dataResult = await pool.query(
      `SELECT p.*, p.is_active AS active, COALESCE(cc.container_count, 0)::int AS container_count
       FROM ports p
       ${containerCountQuery}
       ${whereClause}
       ORDER BY p.${sortBy} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({ error: 0, success: true, data: dataResult.rows, total });
  } catch (err) {
    console.error('getPorts error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function getPortById(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT *, is_active AS active FROM ports WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Port not found' });
    }

    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('getPortById error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function createPort(req, res) {
  try {
    const { name, code, country, is_active, active } = req.body;
    // Support both 'active' and 'is_active' field names
    const activeValue = active !== undefined ? active : (is_active !== false);

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 1, success: false, message: 'Port name is required' });
    }

    const result = await pool.query(
      `INSERT INTO ports (name, code, country, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING *, is_active AS active`,
      [name.trim(), code || null, country || null, activeValue]
    );

    logAudit({
      userId: req.session.user.id,
      entityType: 'port',
      entityId: result.rows[0].id,
      action: 'CREATE',
      oldValues: null,
      newValues: result.rows[0],
      ipAddress: req.ip
    });

    res.status(201).json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('createPort error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function updatePort(req, res) {
  try {
    const { id } = req.params;
    const oldRecord = await pool.query('SELECT * FROM ports WHERE id = $1', [id]);

    if (oldRecord.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Port not found' });
    }

    const { name, code, country, is_active, active } = req.body;
    // Support both 'active' and 'is_active' field names
    const activeValue = active !== undefined ? active : is_active;

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

    addField('name', name);
    addField('code', code);
    addField('country', country);
    addField('is_active', activeValue);

    if (fields.length === 0) {
      return res.status(400).json({ error: 1, success: false, message: 'No fields to update' });
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE ports SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *, is_active AS active`,
      params
    );

    logAudit({
      userId: req.session.user.id,
      entityType: 'port',
      entityId: parseInt(id),
      action: 'UPDATE',
      oldValues: oldRecord.rows[0],
      newValues: result.rows[0],
      ipAddress: req.ip
    });

    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('updatePort error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function deletePort(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM ports WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Port not found' });
    }

    logAudit({
      userId: req.session.user.id,
      entityType: 'port',
      entityId: parseInt(id),
      action: 'DELETE',
      oldValues: result.rows[0],
      newValues: null,
      ipAddress: req.ip
    });

    res.json({ error: 0, success: true, message: 'Port deleted' });
  } catch (err) {
    console.error('deletePort error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

// Get containers for a specific port
async function getContainersByPort(req, res) {
  try {
    const { id } = req.params;
    const isAdmin = req.session.user?.role === 'admin';
    const userId = req.session.user?.id;

    // Verify port exists
    const portResult = await pool.query('SELECT id, name FROM ports WHERE id = $1', [id]);
    if (portResult.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Port not found' });
    }

    let result;
    if (!isAdmin && userId) {
      // For dealers, only show containers that have their vehicles
      result = await pool.query(
        `SELECT DISTINCT c.*,
                (SELECT COUNT(*) FROM vehicles v WHERE v.container_number = c.container_number AND v.dealer_id = $2) AS vehicle_count
         FROM containers c
         INNER JOIN vehicles v ON v.container_number = c.container_number
         WHERE c.port_id = $1 AND v.dealer_id = $2
         ORDER BY c.id DESC`,
        [id, userId]
      );
    } else {
      // For admins, show all containers
      result = await pool.query(
        `SELECT c.*,
                (SELECT COUNT(*) FROM vehicles v WHERE v.container_number = c.container_number) AS vehicle_count
         FROM containers c
         WHERE c.port_id = $1
         ORDER BY c.id DESC`,
        [id]
      );
    }

    res.json({
      error: 0,
      success: true,
      data: result.rows,
      port: portResult.rows[0],
      total: result.rows.length
    });
  } catch (err) {
    console.error('getContainersByPort error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

module.exports = { getPorts, getPortById, createPort, updatePort, deletePort, getContainersByPort };
