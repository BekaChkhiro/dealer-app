const pool = require('../config/db');

// Frequent receivers: reusable recipient records. Dealers see their own;
// admins see all.
async function getFrequentReceivers(req, res) {
  try {
    const isAdmin = req.session.user.role === 'admin';
    const result = isAdmin
      ? await pool.query('SELECT * FROM frequent_receivers ORDER BY fullname')
      : await pool.query('SELECT * FROM frequent_receivers WHERE user_id = $1 ORDER BY fullname', [req.session.user.id]);
    res.json({ error: 0, success: true, data: result.rows });
  } catch (err) {
    console.error('getFrequentReceivers error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function createFrequentReceiver(req, res) {
  try {
    const { fullname, identity_number, phone } = req.body;
    if (!fullname || !fullname.trim()) {
      return res.status(400).json({ error: 1, success: false, message: 'Fullname is required' });
    }
    const result = await pool.query(
      `INSERT INTO frequent_receivers (user_id, fullname, identity_number, phone)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [
        req.session.user.id,
        fullname.trim().toUpperCase(),
        (identity_number || '').trim().toUpperCase() || null,
        (phone || '').trim() || null,
      ]
    );
    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('createFrequentReceiver error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function updateFrequentReceiver(req, res) {
  try {
    const { id } = req.params;
    const { fullname, identity_number, phone } = req.body;
    const isAdmin = req.session.user.role === 'admin';
    const owner = await pool.query('SELECT user_id FROM frequent_receivers WHERE id = $1', [id]);
    if (!owner.rows.length) return res.status(404).json({ error: 1, success: false, message: 'Not found' });
    if (!isAdmin && owner.rows[0].user_id !== req.session.user.id) {
      return res.status(403).json({ error: 1, success: false, message: 'Forbidden' });
    }
    const result = await pool.query(
      `UPDATE frequent_receivers
          SET fullname = $1, identity_number = $2, phone = $3
        WHERE id = $4 RETURNING *`,
      [
        (fullname || '').trim().toUpperCase(),
        (identity_number || '').trim().toUpperCase() || null,
        (phone || '').trim() || null,
        id,
      ]
    );
    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('updateFrequentReceiver error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function deleteFrequentReceiver(req, res) {
  try {
    const { id } = req.params;
    const isAdmin = req.session.user.role === 'admin';
    const owner = await pool.query('SELECT user_id FROM frequent_receivers WHERE id = $1', [id]);
    if (!owner.rows.length) return res.status(404).json({ error: 1, success: false, message: 'Not found' });
    if (!isAdmin && owner.rows[0].user_id !== req.session.user.id) {
      return res.status(403).json({ error: 1, success: false, message: 'Forbidden' });
    }
    await pool.query('DELETE FROM frequent_receivers WHERE id = $1', [id]);
    res.json({ error: 0, success: true, message: 'Deleted' });
  } catch (err) {
    console.error('deleteFrequentReceiver error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

module.exports = {
  getFrequentReceivers,
  createFrequentReceiver,
  updateFrequentReceiver,
  deleteFrequentReceiver,
};
