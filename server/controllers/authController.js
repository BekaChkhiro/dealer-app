const crypto = require('crypto');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { sendPasswordResetEmail } = require('../config/email');

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

async function searchByPrivateCode(req, res) {
  const { code } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ error: 1, success: false, message: 'Private code is required' });
  }

  try {
    const result = await pool.query(
      `SELECT id, mark, model, year, vin, lot_number, auction, current_status,
              profile_image_url, purchase_date, container_number, booking, line,
              destination_port, container_loading_date, estimated_receive_date,
              receive_date, container_open_date
       FROM vehicles
       WHERE receiver_identity_number = $1
       ORDER BY create_date DESC`,
      [code.trim()]
    );

    res.json({ error: 0, success: true, data: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('Private code search error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function forgotPassword(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 1, success: false, message: 'Email is required' });
  }

  try {
    const result = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]);

    // Always return success to avoid revealing whether email exists
    if (result.rows.length === 0) {
      return res.json({ error: 0, success: true, message: 'If that email exists, a reset link has been sent' });
    }

    const user = result.rows[0];
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [hashedToken, expires, user.id]
    );

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const resetUrl = `${appUrl}/reset-password/${rawToken}`;

    await sendPasswordResetEmail(user.email, resetUrl);

    res.json({ error: 0, success: true, message: 'If that email exists, a reset link has been sent' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function resetPassword(req, res) {
  const { token, new_password } = req.body;

  if (!token || !new_password) {
    return res.status(400).json({ error: 1, success: false, message: 'Token and new password are required' });
  }

  if (new_password.length < 4) {
    return res.status(400).json({ error: 1, success: false, message: 'New password must be at least 4 characters' });
  }

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const result = await pool.query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [hashedToken]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 1, success: false, message: 'Invalid or expired reset token' });
    }

    const user = result.rows[0];
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(new_password, salt);

    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [newHash, user.id]
    );

    res.json({ error: 0, success: true, message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function updateProfile(req, res) {
  const userId = req.session.user.id;
  const { name, surname, email, phone } = req.body;

  try {
    // Check email uniqueness (exclude self)
    if (email) {
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 1, success: false, message: 'Email is already in use' });
      }
    }

    const result = await pool.query(
      `UPDATE users SET name = $1, surname = $2, email = $3, phone = $4 WHERE id = $5
       RETURNING id, username, name, surname, email, phone, role, balance, debt, superviser_fee,
                 calculator_category, identity_number, signup_date, last_login_time, last_purchase_date, creator`,
      [name || null, surname || null, email || null, phone || null, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'User not found' });
    }

    // Update session with new data
    req.session.user = { ...req.session.user, ...result.rows[0] };

    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

module.exports = { login, getUser, logout, changePassword, searchByPrivateCode, forgotPassword, resetPassword, updateProfile };
