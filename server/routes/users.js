const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const uploadDocument = require('../middleware/uploadDocument');

router.get('/', requireAdmin, usersController.getUsers);
router.get('/:id/balance', requireAdmin, usersController.getUserBalance);
router.post('/:id/balance', requireAdmin, usersController.adjustBalance);
router.get('/:id', requireAdmin, usersController.getUserById);
router.post('/', requireAdmin, usersController.createUser);
router.put('/:id', requireAdmin, usersController.updateUser);
router.delete('/:id', requireAdmin, usersController.deleteUser);

// ID Document routes
router.post('/:id/upload-id', requireAdmin, uploadDocument.single('id_document'), usersController.uploadIdDocument);
router.put('/:id/verify', requireAdmin, usersController.verifyIdDocument);
router.delete('/:id/id-document', requireAdmin, usersController.deleteIdDocument);

module.exports = router;
