const pool = require('../config/db');

const ALLOWED_SORT_COLUMNS = ['id', 'container_number', 'vin', 'purchase_date', 'manufacturer', 'model', 'manufacturer_year', 'buyer_name', 'booking', 'delivery_location', 'container_open_date', 'line', 'personal_number', 'lot_number', 'loading_port', 'container_loaded_date', 'container_receive_date', 'boat_name', 'status'];
const ALLOWED_ORDER = ['asc', 'desc'];

async function getContainers(req, res) {
  try {
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * limit;
    const keyword = req.query.keyword || '';
    const sortBy = ALLOWED_SORT_COLUMNS.includes(req.query.sort_by) ? req.query.sort_by : 'id';
    const order = ALLOWED_ORDER.includes(req.query.asc) ? req.query.asc : 'desc';
    const { start_date, end_date, status } = req.query;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (keyword) {
      conditions.push(`(c.vin ILIKE $${paramIndex} OR c.container_number ILIKE $${paramIndex} OR c.buyer_name ILIKE $${paramIndex} OR c.booking ILIKE $${paramIndex})`);
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (start_date) {
      conditions.push(`c.purchase_date >= $${paramIndex}`);
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      conditions.push(`c.purchase_date <= $${paramIndex}`);
      params.push(end_date);
      paramIndex++;
    }

    if (status) {
      conditions.push(`c.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    // Non-admin users only see their own containers
    if (req.session.user.role !== 'admin') {
      conditions.push(`c.user_id = $${paramIndex}`);
      params.push(req.session.user.id);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM containers c ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(
      `SELECT c.* FROM containers c ${whereClause} ORDER BY c.${sortBy} ${order} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({ error: 0, success: true, data: dataResult.rows, total });
  } catch (err) {
    console.error('getContainers error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function createContainer(req, res) {
  try {
    const {
      container_number, vin, purchase_date, manufacturer, model,
      manufacturer_year, buyer_name, booking, delivery_location,
      container_open_date, line, personal_number, lot_number,
      loading_port, container_loaded_date, container_receive_date,
      boat_id, boat_name, user_id, status
    } = req.body;

    const result = await pool.query(
      `INSERT INTO containers (
        container_number, vin, purchase_date, manufacturer, model,
        manufacturer_year, buyer_name, booking, delivery_location,
        container_open_date, line, personal_number, lot_number,
        loading_port, container_loaded_date, container_receive_date,
        boat_id, boat_name, user_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        container_number || null, vin || null, purchase_date || null,
        manufacturer || null, model || null, manufacturer_year || null,
        buyer_name || null, booking || null, delivery_location || null,
        container_open_date || null, line || null, personal_number || null,
        lot_number || null, loading_port || null, container_loaded_date || null,
        container_receive_date || null, boat_id || null, boat_name || null,
        user_id || null, status || 'booked'
      ]
    );

    res.status(201).json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('createContainer error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function updateContainer(req, res) {
  try {
    const { id } = req.params;
    const {
      container_number, vin, purchase_date, manufacturer, model,
      manufacturer_year, buyer_name, booking, delivery_location,
      container_open_date, line, personal_number, lot_number,
      loading_port, container_loaded_date, container_receive_date,
      boat_id, boat_name, user_id, status
    } = req.body;

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

    addField('container_number', container_number);
    addField('vin', vin);
    addField('purchase_date', purchase_date);
    addField('manufacturer', manufacturer);
    addField('model', model);
    addField('manufacturer_year', manufacturer_year);
    addField('buyer_name', buyer_name);
    addField('booking', booking);
    addField('delivery_location', delivery_location);
    addField('container_open_date', container_open_date);
    addField('line', line);
    addField('personal_number', personal_number);
    addField('lot_number', lot_number);
    addField('loading_port', loading_port);
    addField('container_loaded_date', container_loaded_date);
    addField('container_receive_date', container_receive_date);
    addField('boat_id', boat_id);
    addField('boat_name', boat_name);
    addField('user_id', user_id);
    addField('status', status);

    if (fields.length === 0) {
      return res.status(400).json({ error: 1, success: false, message: 'No fields to update' });
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE containers SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Container not found' });
    }

    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('updateContainer error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function deleteContainer(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM containers WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Container not found' });
    }

    res.json({ error: 0, success: true, message: 'Container deleted' });
  } catch (err) {
    console.error('deleteContainer error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

module.exports = { getContainers, createContainer, updateContainer, deleteContainer };
