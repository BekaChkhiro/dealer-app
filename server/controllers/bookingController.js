const pool = require('../config/db');

const ALLOWED_SORT_COLUMNS = ['id', 'vin', 'buyer_fullname', 'booking_number', 'line', 'container', 'delivery_location', 'loading_port', 'container_loaded_date', 'container_receive_date', 'terminal', 'est_opening_date', 'open_date', 'create_date'];
const ALLOWED_ORDER = ['asc', 'desc'];

async function getBookings(req, res) {
  try {
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * limit;
    const keyword = req.query.keyword || '';
    const sortBy = ALLOWED_SORT_COLUMNS.includes(req.query.sort_by) ? req.query.sort_by : 'id';
    const order = ALLOWED_ORDER.includes(req.query.asc) ? req.query.asc : 'desc';
    const { start_date, end_date, loading_port, line } = req.query;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (keyword) {
      conditions.push(`(b.vin ILIKE $${paramIndex} OR b.buyer_fullname ILIKE $${paramIndex} OR b.booking_number ILIKE $${paramIndex} OR b.container ILIKE $${paramIndex})`);
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (start_date) {
      conditions.push(`b.create_date >= $${paramIndex}`);
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      conditions.push(`b.create_date <= $${paramIndex}`);
      params.push(end_date);
      paramIndex++;
    }

    if (loading_port) {
      conditions.push(`b.loading_port = $${paramIndex}`);
      params.push(loading_port);
      paramIndex++;
    }

    if (line) {
      conditions.push(`b.line = $${paramIndex}`);
      params.push(line);
      paramIndex++;
    }

    // Non-admin users only see their own bookings
    if (req.session.user.role !== 'admin') {
      conditions.push(`b.user_id = $${paramIndex}`);
      params.push(req.session.user.id);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM booking b ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(
      `SELECT b.* FROM booking b ${whereClause} ORDER BY b.${sortBy} ${order} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({ error: 0, success: true, data: dataResult.rows, total });
  } catch (err) {
    console.error('getBookings error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function createBooking(req, res) {
  try {
    const {
      vin, buyer_fullname, booking_number, booking_paid, container,
      container_loaded_date, container_receiver, container_receive_date,
      container_released, delivery_location, estimated_arrival_date,
      line, open_date, est_opening_date, loading_port, terminal,
      car_details, lot_number, user_id, boat_id, boat_name
    } = req.body;

    const result = await pool.query(
      `INSERT INTO booking (
        vin, buyer_fullname, booking_number, booking_paid, container,
        container_loaded_date, container_receiver, container_receive_date,
        container_released, delivery_location, estimated_arrival_date,
        line, open_date, est_opening_date, loading_port, terminal,
        car_details, lot_number, user_id, boat_id, boat_name, create_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW())
      RETURNING *`,
      [
        vin || null, buyer_fullname || null, booking_number || null,
        booking_paid || false, container || null,
        container_loaded_date || null, container_receiver || null,
        container_receive_date || null, container_released || false,
        delivery_location || null, estimated_arrival_date || null,
        line || null, open_date || null, est_opening_date || null,
        loading_port || null, terminal || null, car_details || null,
        lot_number || null, user_id || null, boat_id || null, boat_name || null
      ]
    );

    res.status(201).json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('createBooking error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function updateBooking(req, res) {
  try {
    const { id } = req.params;
    const {
      vin, buyer_fullname, booking_number, booking_paid, container,
      container_loaded_date, container_receiver, container_receive_date,
      container_released, delivery_location, estimated_arrival_date,
      line, open_date, est_opening_date, loading_port, terminal,
      car_details, lot_number, user_id, boat_id, boat_name
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

    addField('vin', vin);
    addField('buyer_fullname', buyer_fullname);
    addField('booking_number', booking_number);
    addField('booking_paid', booking_paid);
    addField('container', container);
    addField('container_loaded_date', container_loaded_date);
    addField('container_receiver', container_receiver);
    addField('container_receive_date', container_receive_date);
    addField('container_released', container_released);
    addField('delivery_location', delivery_location);
    addField('estimated_arrival_date', estimated_arrival_date);
    addField('line', line);
    addField('open_date', open_date);
    addField('est_opening_date', est_opening_date);
    addField('loading_port', loading_port);
    addField('terminal', terminal);
    addField('car_details', car_details);
    addField('lot_number', lot_number);
    addField('user_id', user_id);
    addField('boat_id', boat_id);
    addField('boat_name', boat_name);

    if (fields.length === 0) {
      return res.status(400).json({ error: 1, success: false, message: 'No fields to update' });
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE booking SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Booking not found' });
    }

    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('updateBooking error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function deleteBooking(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM booking WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Booking not found' });
    }

    res.json({ error: 0, success: true, message: 'Booking deleted' });
  } catch (err) {
    console.error('deleteBooking error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function getVinCodes(req, res) {
  try {
    let query = `SELECT DISTINCT vin FROM vehicles WHERE vin IS NOT NULL AND vin != ''`;
    const params = [];

    // Non-admin users only see VINs for their own vehicles
    if (req.session.user.role !== 'admin') {
      query += ` AND dealer_id = $1`;
      params.push(req.session.user.id);
    }

    query += ` ORDER BY vin`;
    const result = await pool.query(query, params);

    res.json({ error: 0, success: true, data: result.rows });
  } catch (err) {
    console.error('getVinCodes error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function getContainersList(req, res) {
  try {
    const result = await pool.query(
      `SELECT DISTINCT container FROM booking WHERE container IS NOT NULL AND container != '' ORDER BY container`
    );

    res.json({ error: 0, success: true, data: result.rows });
  } catch (err) {
    console.error('getContainersList error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

module.exports = { getBookings, createBooking, updateBooking, deleteBooking, getVinCodes, getContainersList };
