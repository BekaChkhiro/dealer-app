const express = require('express');
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Public endpoints (no authentication required)
const vehiclesController = require('../controllers/vehiclesController');
router.get('/public/track/:vin', vehiclesController.getPublicTracking);

const calculatorPublicController = require('../controllers/calculatorController');
router.get('/public/calculator/options', calculatorPublicController.getPublicOptions);
router.get('/public/calculator/quote', calculatorPublicController.getPublicQuote);
router.get('/public/calculator/matrix', calculatorPublicController.getPublicMatrix);
router.get('/public/calculator/lot-quote', calculatorPublicController.getLotQuote);
router.get('/public/calculator/vehicle-types', calculatorPublicController.getVehicleTypes);
router.get('/public/calculator/ports', calculatorPublicController.getCalcPorts);

// Public geography reads (no auth) so the vehicle form / public pages can read them
const geographyController = require('../controllers/geographyController');
router.get('/public/geo/countries', geographyController.getCountries);
router.get('/public/geo/states', geographyController.getStates);
router.get('/public/geo/cities', geographyController.getCities2);
router.get('/public/geo/loading-ports', geographyController.getLoadingPorts);

// Route modules will be added here as they are built:
router.use('/', require('./auth'));
router.use('/users', require('./users'));
router.use('/vehicles', require('./vehicles'));
router.use('/booking', require('./booking'));
router.use('/containers', require('./containers'));
router.use('/ports', require('./ports'));
router.use('/car-brands', require('./carBrands'));
router.use('/car-models', require('./carModels'));
router.use('/calculator', require('./calculator'));
router.use('/transactions', require('./transactions'));
router.use('/tickets', require('./tickets'));
router.use('/messages', require('./messages'));
router.use('/audit-logs', require('./auditLogs'));

// Top-level endpoints
const { requireAuth, requireAdmin } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');
router.get('/dashboard/stats', requireAuth, dashboardController.getStats);
router.get('/dashboard/analytics', requireAuth, dashboardController.getAnalytics);

// Vehicle types (admin-managed calculator price modifiers)
router.get('/vehicle-types', requireAuth, calculatorPublicController.getVehicleTypes);
router.post('/vehicle-types', requireAdmin, calculatorPublicController.createVehicleType);
router.put('/vehicle-types/:id', requireAdmin, calculatorPublicController.updateVehicleType);
router.delete('/vehicle-types/:id', requireAdmin, calculatorPublicController.deleteVehicleType);

// Calculator ports (admin-managed loading & destination ports)
router.get('/calc-ports', requireAuth, calculatorPublicController.getCalcPorts);
router.post('/calc-ports', requireAdmin, calculatorPublicController.createCalcPort);
router.put('/calc-ports/:id', requireAdmin, calculatorPublicController.updateCalcPort);
router.delete('/calc-ports/:id', requireAdmin, calculatorPublicController.deleteCalcPort);

// Geography (admin-managed countries, states, cities, loading ports)
router.get('/geo/countries', requireAuth, geographyController.getCountries);
router.post('/geo/countries', requireAdmin, geographyController.createCountry);
router.put('/geo/countries/:id', requireAdmin, geographyController.updateCountry);
router.delete('/geo/countries/:id', requireAdmin, geographyController.deleteCountry);

router.get('/geo/states', requireAuth, geographyController.getStates);
router.post('/geo/states', requireAdmin, geographyController.createState);
router.put('/geo/states/:id', requireAdmin, geographyController.updateState);
router.delete('/geo/states/:id', requireAdmin, geographyController.deleteState);

router.get('/geo/cities', requireAuth, geographyController.getCities2);
router.post('/geo/cities', requireAdmin, geographyController.createCity);
router.put('/geo/cities/:id', requireAdmin, geographyController.updateCity);
router.delete('/geo/cities/:id', requireAdmin, geographyController.deleteCity);

router.get('/geo/loading-ports', requireAuth, geographyController.getLoadingPorts);
router.post('/geo/loading-ports', requireAdmin, geographyController.createLoadingPort);
router.put('/geo/loading-ports/:id', requireAdmin, geographyController.updateLoadingPort);
router.delete('/geo/loading-ports/:id', requireAdmin, geographyController.deleteLoadingPort);

// Warehouses (admin-managed)
const warehousesController = require('../controllers/warehousesController');
router.get('/warehouses', requireAuth, warehousesController.getWarehouses);
router.post('/warehouses', requireAdmin, warehousesController.createWarehouse);
router.put('/warehouses/:id', requireAdmin, warehousesController.updateWarehouse);
router.delete('/warehouses/:id', requireAdmin, warehousesController.deleteWarehouse);

// Frequent receivers (saved recipient records)
const frequentReceiversController = require('../controllers/frequentReceiversController');
router.get('/frequent-receivers', requireAuth, frequentReceiversController.getFrequentReceivers);
router.post('/frequent-receivers', requireAuth, frequentReceiversController.createFrequentReceiver);
router.put('/frequent-receivers/:id', requireAuth, frequentReceiversController.updateFrequentReceiver);
router.delete('/frequent-receivers/:id', requireAuth, frequentReceiversController.deleteFrequentReceiver);

router.get('/cities', requireAuth, vehiclesController.getCities);
router.get('/search', requireAuth, vehiclesController.searchVehicles);
router.get('/invoices', requireAuth, vehiclesController.getInvoicesList);

// Dropdown data endpoints for booking/containers forms
const bookingController = require('../controllers/bookingController');
router.get('/vin-codes/booking', requireAuth, bookingController.getVinCodes);
router.get('/containers-list/booking', requireAuth, bookingController.getContainersList);

module.exports = router;
