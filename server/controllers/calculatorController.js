const pool = require('../config/db');

const ALLOWED_SORT_COLUMNS = ['id', 'auction', 'city', 'destination', 'land_price', 'container_price', 'total_price', 'port'];
const ALLOWED_ORDER = ['asc', 'desc'];

async function getCalculator(req, res) {
  try {
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * limit;
    const keyword = req.query.keyword || '';
    const sortBy = ALLOWED_SORT_COLUMNS.includes(req.query.sort_by) ? req.query.sort_by : 'id';
    const order = ALLOWED_ORDER.includes(req.query.asc) ? req.query.asc : 'desc';
    const { auction, port } = req.query;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (keyword) {
      conditions.push(`(auction ILIKE $${paramIndex} OR city ILIKE $${paramIndex} OR destination ILIKE $${paramIndex} OR port ILIKE $${paramIndex})`);
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (auction) {
      conditions.push(`auction = $${paramIndex}`);
      params.push(auction);
      paramIndex++;
    }

    if (port) {
      conditions.push(`port = $${paramIndex}`);
      params.push(port);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM calculator ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(
      `SELECT * FROM calculator ${whereClause} ORDER BY ${sortBy} ${order} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({ error: 0, success: true, data: dataResult.rows, total });
  } catch (err) {
    console.error('getCalculator error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function createCalculator(req, res) {
  try {
    const { auction, city, destination, land_price, container_price, total_price, port } = req.body;

    if (!auction) {
      return res.status(400).json({ error: 1, success: false, message: 'Auction is required' });
    }

    const result = await pool.query(
      `INSERT INTO calculator (auction, city, destination, land_price, container_price, total_price, port)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [auction, city || null, destination || null, land_price || 0, container_price || 0, total_price || 0, port || null]
    );

    res.status(201).json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('createCalculator error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function updateCalculator(req, res) {
  try {
    const { id } = req.params;
    const { auction, city, destination, land_price, container_price, total_price, port } = req.body;

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

    addField('auction', auction);
    addField('city', city);
    addField('destination', destination);
    addField('land_price', land_price);
    addField('container_price', container_price);
    addField('total_price', total_price);
    addField('port', port);

    if (fields.length === 0) {
      return res.status(400).json({ error: 1, success: false, message: 'No fields to update' });
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE calculator SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Calculator entry not found' });
    }

    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('updateCalculator error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function deleteCalculator(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM calculator WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Calculator entry not found' });
    }

    res.json({ error: 0, success: true, message: 'Calculator entry deleted' });
  } catch (err) {
    console.error('deleteCalculator error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

module.exports = { getCalculator, createCalculator, updateCalculator, deleteCalculator };
