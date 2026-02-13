const express = require('express');
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Route modules will be added here as they are built:
router.use('/', require('./auth'));
router.use('/users', require('./users'));
router.use('/vehicles', require('./vehicles'));
router.use('/booking', require('./booking'));
router.use('/containers', require('./containers'));
router.use('/boats', require('./boats'));
router.use('/calculator', require('./calculator'));
router.use('/transactions', require('./transactions'));

// Top-level endpoints
const { requireAuth } = require('../middleware/auth');
const vehiclesController = require('../controllers/vehiclesController');
router.get('/cities', requireAuth, vehiclesController.getCities);

// Dropdown data endpoints for booking/containers forms
const bookingController = require('../controllers/bookingController');
router.get('/vin-codes/booking', requireAuth, bookingController.getVinCodes);
router.get('/containers-list/booking', requireAuth, bookingController.getContainersList);

module.exports = router;
