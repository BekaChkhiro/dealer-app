const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/login', authController.login);
router.get('/user', requireAuth, authController.getUser);
router.post('/logout', authController.logout);
router.post('/change-password', requireAuth, authController.changePassword);

module.exports = router;
