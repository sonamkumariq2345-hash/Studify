const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcement.controller');
const { requireApproved, requireAuth, requireRole } = require('../middleware/auth.middleware');

// All users can view announcements
router.get('/', requireAuth, requireApproved, announcementController.getAnnouncements);

// Only admins can create announcements
router.post('/', requireAuth, requireApproved, requireRole(['admin']), announcementController.createAnnouncement);

module.exports = router;
