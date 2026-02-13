const express = require('express');
const router = express.Router();
const calculatorController = require('../controllers/calculatorController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAuth, calculatorController.getCalculator);
router.post('/', requireAdmin, calculatorController.createCalculator);
router.put('/:id', requireAdmin, calculatorController.updateCalculator);
router.delete('/:id', requireAdmin, calculatorController.deleteCalculator);

module.exports = router;
