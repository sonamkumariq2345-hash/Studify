const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fileController = require('../controllers/file.controller');
const { requireApproved, requireAuth, requireRole } = require('../middleware/auth.middleware');

// Local upload folder
const uploadDir = path.join(__dirname, '../../uploads/documents');

// Create folder automatically if it does not exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      '-' +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});
// Create upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.use(requireAuth);
router.use(requireApproved);

router.post('/upload', requireRole('student'), upload.single('file'), fileController.uploadFile);
router.get('/', requireRole(['student', 'admin']), fileController.getFiles);
router.delete('/:id', requireRole(['student', 'admin']), fileController.deleteFile);

module.exports = router;
