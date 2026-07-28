const express = require('express');
const router = express.Router();
const vehiclesController = require('../controllers/vehiclesController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const uploadDocument = require('../middleware/uploadDocument');
const uploadZip = require('../middleware/uploadZip');

router.get('/', requireAuth, vehiclesController.getVehicles);
router.get('/invoices/list', requireAuth, vehiclesController.getInvoicesList);
router.post('/bulk-delete', requireAdmin, vehiclesController.bulkDeleteVehicles);
router.get('/:id', requireAuth, vehiclesController.getVehicleById);
// Dealers may create and edit vehicles; ownership is enforced in the controller
// (a dealer's new cars auto-assign to them, and they can only edit their own).
router.post('/', requireAuth, upload.single('profile_image'), vehiclesController.createVehicle);
router.put('/:id', requireAuth, upload.single('profile_image'), vehiclesController.updateVehicle);
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
router.post('/:id/files/zip', requireAuth, uploadZip.single('file'), vehiclesController.uploadVehicleFilesZip);
router.delete('/files/:fileId', requireAuth, vehiclesController.deleteVehicleFile);
router.patch('/:id/main-photo', requireAuth, vehiclesController.setMainPhoto);
router.patch('/files/:fileId/category', requireAuth, vehiclesController.updateVehicleFileCategory);

module.exports = router;
