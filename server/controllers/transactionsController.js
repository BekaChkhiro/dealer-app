const pool = require('../config/db');

const ALLOWED_SORT_COLUMNS = ['id', 'payer', 'create_date', 'vin', 'mark', 'model', 'year', 'personal_number', 'paid_amount', 'payment_type'];
const ALLOWED_ORDER = ['asc', 'desc'];

async function getTransactions(req, res) {
  try {
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * limit;
    const keyword = req.query.keyword || '';
    const sortBy = ALLOWED_SORT_COLUMNS.includes(req.query.sort_by) ? req.query.sort_by : 'id';
    const order = ALLOWED_ORDER.includes(req.query.asc) ? req.query.asc : 'desc';
    const { start_date, end_date } = req.query;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (keyword) {
      conditions.push(`(vin ILIKE $${paramIndex} OR payer ILIKE $${paramIndex} OR mark ILIKE $${paramIndex} OR model ILIKE $${paramIndex} OR personal_number ILIKE $${paramIndex})`);
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (start_date) {
      conditions.push(`create_date >= $${paramIndex}`);
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      conditions.push(`create_date <= $${paramIndex}`);
      params.push(end_date);
      paramIndex++;
    }

    // Non-admin users only see transactions for their own vehicles
    if (req.session.user.role !== 'admin') {
      conditions.push(`vin IN (SELECT vin FROM vehicles WHERE dealer_id = $${paramIndex})`);
      params.push(req.session.user.id);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM transactions ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(
      `SELECT * FROM transactions ${whereClause} ORDER BY ${sortBy} ${order} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({ error: 0, success: true, data: dataResult.rows, total });
  } catch (err) {
    console.error('getTransactions error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function createTransaction(req, res) {
  try {
    const { payer, vin, mark, model, year, buyer, personal_number, paid_amount, payment_type, addToBalanseAmount } = req.body;

    if (!payment_type) {
      return res.status(400).json({ error: 1, success: false, message: 'Payment type is required' });
    }

    const result = await pool.query(
      `INSERT INTO transactions (payer, vin, mark, model, year, buyer, personal_number, paid_amount, payment_type, "addToBalanseAmount")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [payer || null, vin || null, mark || null, model || null, year || null, buyer || null, personal_number || null, paid_amount || 0, payment_type, addToBalanseAmount || 0]
    );

    res.status(201).json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('createTransaction error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function updateTransaction(req, res) {
  try {
    const { id } = req.params;
    const { payer, vin, mark, model, year, buyer, personal_number, paid_amount, payment_type, addToBalanseAmount } = req.body;

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

    addField('payer', payer);
    addField('vin', vin);
    addField('mark', mark);
    addField('model', model);
    addField('year', year);
    addField('buyer', buyer);
    addField('personal_number', personal_number);
    addField('paid_amount', paid_amount);
    addField('payment_type', payment_type);

    if (addToBalanseAmount !== undefined) {
      fields.push(`"addToBalanseAmount" = $${paramIndex}`);
      params.push(addToBalanseAmount);
      paramIndex++;
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 1, success: false, message: 'No fields to update' });
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE transactions SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Transaction not found' });
    }

    res.json({ error: 0, success: true, data: result.rows[0] });
  } catch (err) {
    console.error('updateTransaction error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

async function deleteTransaction(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM transactions WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 1, success: false, message: 'Transaction not found' });
    }

    res.json({ error: 0, success: true, message: 'Transaction deleted' });
  } catch (err) {
    console.error('deleteTransaction error:', err);
    res.status(500).json({ error: 1, success: false, message: 'Internal server error' });
  }
}

module.exports = { getTransactions, createTransaction, updateTransaction, deleteTransaction };
