const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAdmin, usersController.getUsers);
router.get('/:id/balance', requireAdmin, usersController.getUserBalance);
router.post('/:id/balance', requireAdmin, usersController.adjustBalance);
router.get('/:id', requireAdmin, usersController.getUserById);
router.post('/', requireAdmin, usersController.createUser);
router.put('/:id', requireAdmin, usersController.updateUser);
router.delete('/:id', requireAdmin, usersController.deleteUser);

module.exports = router;
