const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progress.controller');
const { requireApproved, requireAuth, requireRole } = require('../middleware/auth.middleware');

router.use(requireAuth);
router.use(requireApproved);
router.use(requireRole('student'));

router.get('/', progressController.getMyProgress);
router.put('/:courseId', progressController.updateProgress);

module.exports = router;
