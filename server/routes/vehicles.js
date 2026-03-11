const express = require('express');
const router = express.Router();
const vehiclesController = require('../controllers/vehiclesController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const uploadDocument = require('../middleware/uploadDocument');

router.get('/', requireAuth, vehiclesController.getVehicles);
router.get('/invoices/list', requireAuth, vehiclesController.getInvoicesList);
router.post('/bulk-delete', requireAdmin, vehiclesController.bulkDeleteVehicles);
router.get('/:id', requireAuth, vehiclesController.getVehicleById);
router.post('/', requireAdmin, upload.single('profile_image'), vehiclesController.createVehicle);
router.put('/:id', requireAdmin, upload.single('profile_image'), vehiclesController.updateVehicle);
router.delete('/:id', requireAdmin, vehiclesController.deleteVehicle);

// Receiver ID document upload
router.post('/:id/upload-receiver-id', requireAuth, uploadDocument.single('receiver_id_document'), vehiclesController.uploadReceiverIdDocument);

// Generate vehicle invoice
router.get('/:id/invoice', requireAuth, vehiclesController.generateVehicleInvoice);

// Generate transportation invoice
router.get('/:id/invoice/transport', requireAuth, vehiclesController.generateTransportInvoice);

// Vehicle files endpoints
router.get('/:id/files', requireAuth, vehiclesController.getVehicleFiles);
router.post('/:id/files', requireAuth, uploadDocument.single('file'), vehiclesController.uploadVehicleFile);
router.delete('/files/:fileId', requireAuth, vehiclesController.deleteVehicleFile);

module.exports = router;
