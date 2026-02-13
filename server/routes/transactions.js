const express = require('express');
const router = express.Router();
const transactionsController = require('../controllers/transactionsController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAuth, transactionsController.getTransactions);
router.post('/', requireAdmin, transactionsController.createTransaction);
router.put('/:id', requireAdmin, transactionsController.updateTransaction);
router.delete('/:id', requireAdmin, transactionsController.deleteTransaction);

module.exports = router;
