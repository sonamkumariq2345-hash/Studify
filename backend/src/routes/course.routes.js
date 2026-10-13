const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const { requireApproved, requireAuth, requireRole } = require('../middleware/auth.middleware');

const multer = require('multer');
const enrollmentController = require('../controllers/enrollment.controller');

const upload = multer({ storage: multer.memoryStorage() });

router.use(requireAuth);
router.use(requireApproved);

router.get('/', courseController.getCourses);
router.get('/:id', courseController.getCourseById);

router.post('/', requireRole('admin'), courseController.createCourse);
router.put('/:id', requireRole('admin'), courseController.updateCourse);
router.delete('/:id', requireRole('admin'), courseController.deleteCourse);

router.post('/:id/enroll', requireRole('student'), enrollmentController.enrollInCourse);

// Course Resources
router.get('/:id/resources', courseController.getCourseResources);
router.post('/:id/resources', requireRole('admin'), upload.single('file'), courseController.uploadCourseResource);
router.delete('/:id/resources/:resourceId', requireRole('admin'), courseController.deleteCourseResource);


module.exports = router;
