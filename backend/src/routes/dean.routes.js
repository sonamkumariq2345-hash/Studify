const express = require('express');
const router = express.Router();
const deanController = require('../controllers/dean.controller');
const { requireApproved, requireAuth, requireRole } = require('../middleware/auth.middleware');

router.use(requireAuth);
router.use(requireApproved);
router.use(requireRole('dean'));

router.get('/dashboard', deanController.getDashboard);
router.get('/department', deanController.getDepartment);
router.get('/students', deanController.getStudents);
router.get('/student-requests', deanController.getStudentRequests);
router.patch('/student-requests/:id', deanController.reviewStudentRegistration);
router.get('/teachers', deanController.getTeachers);
router.get('/reports', deanController.getReports);

module.exports = router;
