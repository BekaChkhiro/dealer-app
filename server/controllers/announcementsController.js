const pool = require('../config/db');

// ---- Announcements (admin-managed, shown to all dealers) ----

// Active announcements — visible to any authenticated user (dealer dashboard banner).
async function getActiveAnnouncements(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM announcements WHERE is_active = TRUE ORDER BY created_at DESC'
    );
    res.json({ error: 0, success: true, data: result.rows });
  } catch (err) {
    console.error('getActiveAnnouncements error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

// All announcements — admin management view.
async function getAnnouncements(req, res) {
  try {
    const result = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
    res.json({ error: 0, success: true, data: result.rows });
  } catch (err) {
    console.error('getAnnouncements error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function createAnnouncement(req, res) {
  try {
    const { message, is_active } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: 1, success: false, message: 'Message is required' });
    const result = await pool.query(
      'INSERT INTO announcements (message, is_active, created_by) VALUES ($1, $2, $3) RETURNING *',
      [message.trim(), is_active === undefined ? true : !!is_active, req.session.user.id]
    );
    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('createAnnouncement error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function updateAnnouncement(req, res) {
  try {
    const { id } = req.params;
    const { message, is_active } = req.body;
    const fields = [];
    const params = [];
    let i = 1;
    if (message !== undefined) { fields.push(`message = $${i++}`); params.push(message); }
    if (is_active !== undefined) { fields.push(`is_active = $${i++}`); params.push(!!is_active); }
    if (!fields.length) return res.status(400).json({ error: 1, success: false, message: 'Nothing to update' });
    params.push(id);
    const result = await pool.query(`UPDATE announcements SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, params);
    if (!result.rows.length) return res.status(404).json({ error: 1, success: false, message: 'Announcement not found' });
    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('updateAnnouncement error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function deleteAnnouncement(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM announcements WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 1, success: false, message: 'Announcement not found' });
    res.json({ error: 0, success: true, message: 'Announcement deleted' });
  } catch (err) {
    console.error('deleteAnnouncement error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

module.exports = { getActiveAnnouncements, getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement };
