const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/multer');
const {
  uploadResume,
  getResumeStatus,
  getUserResumes,
  getResumeById,
  deleteResume,
  getResumeText,
} = require('../controllers/uploadController');

const router = express.Router();

// ─── All routes protected ─────────────────────────────────────────────────────
router.use(protect);

// ─── Upload ───────────────────────────────────────────────────────────────────
router.post(
  '/',
  upload.single('resume'),
  (err, req, res, next) => {
    // Handle multer errors (file type, size, etc.)
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error.',
      });
    }
    next(err);
  },
  uploadResume
);

// ─── Status Polling ───────────────────────────────────────────────────────────
router.get('/status/:id', getResumeStatus);

// ─── Resume CRUD ──────────────────────────────────────────────────────────────
router.get('/resumes', getUserResumes);
router.get('/resumes/:id', getResumeById);
router.delete('/resumes/:id', deleteResume);
router.get('/resumes/:id/text', getResumeText);

module.exports = router;
