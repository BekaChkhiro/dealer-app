const pool = require('../config/db');

// ---- Shipping lines (admin-managed container tracking URLs) ----
async function getShippingLines(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, name, tracking_url_template, is_active, sort_order, created_at FROM shipping_lines ORDER BY sort_order, id'
    );
    res.json({ error: 0, success: true, data: result.rows });
  } catch (err) {
    console.error('getShippingLines error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function createShippingLine(req, res) {
  try {
    const { name, tracking_url_template, is_active, sort_order } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 1, success: false, message: 'Name is required' });
    const result = await pool.query(
      'INSERT INTO shipping_lines (name, tracking_url_template, is_active, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [name.trim(), tracking_url_template || null, is_active === undefined ? true : !!is_active, Number(sort_order) || 0]
    );
    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('createShippingLine error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function updateShippingLine(req, res) {
  try {
    const { id } = req.params;
    const { name, tracking_url_template, is_active, sort_order } = req.body;
    const fields = [];
    const params = [];
    let i = 1;
    if (name !== undefined) { fields.push(`name = $${i++}`); params.push(name); }
    if (tracking_url_template !== undefined) { fields.push(`tracking_url_template = $${i++}`); params.push(tracking_url_template || null); }
    if (is_active !== undefined) { fields.push(`is_active = $${i++}`); params.push(!!is_active); }
    if (sort_order !== undefined) { fields.push(`sort_order = $${i++}`); params.push(Number(sort_order) || 0); }
    if (!fields.length) return res.status(400).json({ error: 1, success: false, message: 'Nothing to update' });
    params.push(id);
    const result = await pool.query(`UPDATE shipping_lines SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, params);
    if (!result.rows.length) return res.status(404).json({ error: 1, success: false, message: 'Shipping line not found' });
    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('updateShippingLine error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function deleteShippingLine(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM shipping_lines WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 1, success: false, message: 'Shipping line not found' });
    res.json({ error: 0, success: true, message: 'Shipping line deleted' });
  } catch (err) {
    console.error('deleteShippingLine error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

module.exports = { getShippingLines, createShippingLine, updateShippingLine, deleteShippingLine };
