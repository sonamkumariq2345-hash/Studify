const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { requireApproved, requireAuth, requireRole } = require('../middleware/auth.middleware');

router.use(requireAuth);
router.use(requireApproved);
router.use(requireRole('admin'));

router.get('/stats', userController.getAdminStats);
router.get('/requests/teachers', userController.getTeacherRequests);
router.patch('/requests/teachers/:id', userController.reviewTeacherRegistration);
router.get('/requests/students', userController.getStudentRequests);
router.patch('/requests/students/:id', userController.reviewStudentRegistration);
router.get('/departments', userController.getDepartments);
router.post('/departments', userController.createDepartment);
router.put('/departments/:id', userController.updateDepartment);
router.get('/teachers/approved', userController.getApprovedTeachers);
router.get('/deans', userController.getDeans);
router.post('/deans/register', userController.registerDean);
router.post('/deans/assign', userController.assignDean);
router.delete('/deans/:id', userController.removeDean);
router.get('/', userController.getUsers);
router.put('/:id/status', userController.updateUserStatus);

module.exports = router;
