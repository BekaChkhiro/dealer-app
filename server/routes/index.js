const express = require('express');
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Public endpoints (no authentication required)
const vehiclesController = require('../controllers/vehiclesController');
router.get('/public/track/:vin', vehiclesController.getPublicTracking);

// Route modules will be added here as they are built:
router.use('/', require('./auth'));
router.use('/users', require('./users'));
router.use('/vehicles', require('./vehicles'));
router.use('/booking', require('./booking'));
router.use('/containers', require('./containers'));
router.use('/ports', require('./ports'));
router.use('/calculator', require('./calculator'));
router.use('/transactions', require('./transactions'));
router.use('/tickets', require('./tickets'));
router.use('/messages', require('./messages'));
router.use('/audit-logs', require('./auditLogs'));

// Top-level endpoints
const { requireAuth } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');
router.get('/dashboard/stats', requireAuth, dashboardController.getStats);

router.get('/cities', requireAuth, vehiclesController.getCities);
router.get('/search', requireAuth, vehiclesController.searchVehicles);

// Dropdown data endpoints for booking/containers forms
const bookingController = require('../controllers/bookingController');
router.get('/vin-codes/booking', requireAuth, bookingController.getVinCodes);
router.get('/containers-list/booking', requireAuth, bookingController.getContainersList);

module.exports = router;
