const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  analyzeResume, getATSScore, getUserATSOverview,
  runAIAnalysis, getAIAnalysis,
} = require('../controllers/atsController');

const router = express.Router();

router.use(protect);

// Analyze a resume (trigger ATS scoring)
router.post('/analyze/:id', analyzeResume);

// Get stored ATS score for one resume
router.get('/score/:id', getATSScore);

// Overview across all user resumes
router.get('/overview', getUserATSOverview);

// ─── AI-Powered Analysis Routes ──────────────────────────────────────────────────────────
// Trigger Gemini AI analysis (accepts { jobRole } in body)
router.post('/ai-analyze/:id', runAIAnalysis);

// Retrieve stored AI analysis
router.get('/ai-analysis/:id', getAIAnalysis);

module.exports = router;
