const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const messagesController = require('../controllers/messagesController');

// All routes require authentication
router.use(requireAuth);

// GET /api/messages - List messages (filtered by role)
router.get('/', messagesController.getMessages);

// GET /api/messages/unread-count - Get unread message count
router.get('/unread-count', messagesController.getUnreadCount);

// GET /api/messages/:id - Get single message
router.get('/:id', messagesController.getMessageById);

// POST /api/messages - Create new message (admin only)
router.post('/', messagesController.createMessage);

// PATCH /api/messages/:id/read - Mark message as read
router.patch('/:id/read', messagesController.markAsRead);

// DELETE /api/messages/:id - Delete message (admin only)
router.delete('/:id', messagesController.deleteMessage);

module.exports = router;
