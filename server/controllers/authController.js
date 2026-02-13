const bcrypt = require('bcrypt');
const pool = require('../config/db');

async function login(req, res) {
  const { user, password } = req.body;

  if (!user || !password) {
    return res.status(400).json({ error: 1, success: false, message: 'Username/email and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [user]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 1, success: false, message: 'Invalid credentials' });
    }

    const dbUser = result.rows[0];
    const match = await bcrypt.compare(password, dbUser.password_hash);

    if (!match) {
      return res.status(401).json({ error: 1, success: false, message: 'Invalid credentials' });
    }

    // Update last_login_time
    await pool.query('UPDATE users SET last_login_time = NOW() WHERE id = $1', [dbUser.id]);

    // Build session user object (exclude password_hash)
    const { password_hash, ...userObj } = dbUser;
    req.session.user = userObj;

    res.json({ error: 0, success: true, data: userObj });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

function getUser(req, res) {
  res.json({ error: 0, success: true, data: req.session.user });
}

function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 1, success: false, message: 'Failed to logout' });
    }
    res.clearCookie('connect.sid');
    res.json({ error: 0, success: true, message: 'Logged out' });
  });
}

async function changePassword(req, res) {
  const { old_password, new_password } = req.body;
  const userId = req.session.user.id;

  if (!old_password || !new_password) {
    return res.status(400).json({ error: 1, success: false, message: 'Old password and new password are required' });
  }

  if (new_password.length < 4) {
    return res.status(400).json({ error: 1, success: false, message: 'New password must be at least 4 characters' });
  }

  try {
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'User not found' });
    }

    const match = await bcrypt.compare(old_password, result.rows[0].password_hash);
    if (!match) {
      return res.status(401).json({ error: 1, success: false, message: 'Old password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(new_password, salt);

    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);

    res.json({ error: 0, success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

module.exports = { login, getUser, logout, changePassword };
