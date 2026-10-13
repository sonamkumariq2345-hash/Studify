const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollment.controller');
const { requireApproved, requireAuth, requireRole } = require('../middleware/auth.middleware');

router.use(requireAuth);
router.use(requireApproved);

// This sits at /api/enrollments
router.get('/me', requireRole('student'), enrollmentController.getMyEnrollments);
router.get('/', requireRole('admin'), enrollmentController.getAllEnrollments);

module.exports = router;
