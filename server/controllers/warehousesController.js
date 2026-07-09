const pool = require('../config/db');

// ---- Warehouses (admin-managed) ----
async function getWarehouses(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, name, code, location, is_active, sort_order, created_at FROM warehouses ORDER BY sort_order, id'
    );
    res.json({ error: 0, success: true, data: result.rows });
  } catch (err) {
    console.error('getWarehouses error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function createWarehouse(req, res) {
  try {
    const { name, code, location, is_active, sort_order } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 1, success: false, message: 'Name is required' });
    const result = await pool.query(
      'INSERT INTO warehouses (name, code, location, is_active, sort_order) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name.trim(), code || null, location || null, is_active === undefined ? true : !!is_active, Number(sort_order) || 0]
    );
    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('createWarehouse error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function updateWarehouse(req, res) {
  try {
    const { id } = req.params;
    const { name, code, location, is_active, sort_order } = req.body;
    const fields = [];
    const params = [];
    let i = 1;
    if (name !== undefined) { fields.push(`name = $${i++}`); params.push(name); }
    if (code !== undefined) { fields.push(`code = $${i++}`); params.push(code); }
    if (location !== undefined) { fields.push(`location = $${i++}`); params.push(location); }
    if (is_active !== undefined) { fields.push(`is_active = $${i++}`); params.push(!!is_active); }
    if (sort_order !== undefined) { fields.push(`sort_order = $${i++}`); params.push(Number(sort_order) || 0); }
    if (!fields.length) return res.status(400).json({ error: 1, success: false, message: 'Nothing to update' });
    params.push(id);
    const result = await pool.query(`UPDATE warehouses SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, params);
    if (!result.rows.length) return res.status(404).json({ error: 1, success: false, message: 'Warehouse not found' });
    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('updateWarehouse error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function deleteWarehouse(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM warehouses WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 1, success: false, message: 'Warehouse not found' });
    res.json({ error: 0, success: true, message: 'Warehouse deleted' });
  } catch (err) {
    console.error('deleteWarehouse error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

module.exports = { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse };
