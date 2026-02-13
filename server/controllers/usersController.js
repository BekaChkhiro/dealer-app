const bcrypt = require('bcrypt');
const pool = require('../config/db');

const ALLOWED_SORT_COLUMNS = ['id', 'name', 'surname', 'email', 'username', 'role', 'last_login_time', 'last_purchase_date', 'superviser_fee', 'signup_date'];
const ALLOWED_ORDER = ['asc', 'desc'];

async function getUsers(req, res) {
  try {
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * limit;
    const keyword = req.query.keyword || '';
    const sortBy = ALLOWED_SORT_COLUMNS.includes(req.query.sort_by) ? req.query.sort_by : 'id';
    const order = ALLOWED_ORDER.includes(req.query.asc) ? req.query.asc : 'desc';
    const { calculator_category, role } = req.query;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (keyword) {
      conditions.push(`(name ILIKE $${paramIndex} OR surname ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR username ILIKE $${paramIndex})`);
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (calculator_category) {
      conditions.push(`calculator_category = $${paramIndex}`);
      params.push(calculator_category);
      paramIndex++;
    }

    if (role) {
      conditions.push(`role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(
      `SELECT * FROM users ${whereClause} ORDER BY ${sortBy} ${order} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    const users = dataResult.rows.map(({ password_hash, ...user }) => user);

    res.json({ error: 0, success: true, data: users, total });
  } catch (err) {
    console.error('getUsers error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function createUser(req, res) {
  try {
    const { name, surname, email, username, password, phone, calculator_category, role, identity_number, superviser_fee } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: 1, success: false, message: 'Email, username, and password are required' });
    }

    const duplicate = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    if (duplicate.rows.length > 0) {
      return res.status(409).json({ error: 1, success: false, message: 'Email or username already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const creator = req.session.user.id;

    const result = await pool.query(
      `INSERT INTO users (name, surname, email, username, password_hash, phone, calculator_category, role, identity_number, superviser_fee, creator, signup_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
       RETURNING *`,
      [name, surname, email, username, password_hash, phone, calculator_category, role, identity_number, superviser_fee, creator]
    );

    const { password_hash: _, ...user } = result.rows[0];
    res.status(201).json({ error: 0, success: true, data: user });
  } catch (err) {
    console.error('createUser error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, surname, email, username, password, phone, calculator_category, role, identity_number, superviser_fee } = req.body;

    if (email || username) {
      const conditions = [];
      const params = [];
      let paramIndex = 1;

      if (email) {
        conditions.push(`email = $${paramIndex}`);
        params.push(email);
        paramIndex++;
      }
      if (username) {
        conditions.push(`username = $${paramIndex}`);
        params.push(username);
        paramIndex++;
      }

      const duplicate = await pool.query(
        `SELECT id FROM users WHERE (${conditions.join(' OR ')}) AND id != $${paramIndex}`,
        [...params, id]
      );
      if (duplicate.rows.length > 0) {
        return res.status(409).json({ error: 1, success: false, message: 'Email or username already exists' });
      }
    }

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
    addField('surname', surname);
    addField('email', email);
    addField('username', username);
    addField('phone', phone);
    addField('calculator_category', calculator_category);
    addField('role', role);
    addField('identity_number', identity_number);
    addField('superviser_fee', superviser_fee);

    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      fields.push(`password_hash = $${paramIndex}`);
      params.push(password_hash);
      paramIndex++;
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 1, success: false, message: 'No fields to update' });
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'User not found' });
    }

    const { password_hash: _, ...user } = result.rows[0];
    res.json({ error: 0, success: true, data: user });
  } catch (err) {
    console.error('updateUser error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    if (req.session.user.id === parseInt(id)) {
      return res.status(400).json({ error: 1, success: false, message: 'Cannot delete yourself' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'User not found' });
    }

    res.json({ error: 0, success: true, message: 'User deleted' });
  } catch (err) {
    console.error('deleteUser error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

module.exports = { getUsers, createUser, updateUser, deleteUser };
