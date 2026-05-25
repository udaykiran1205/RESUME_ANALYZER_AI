const Resume = require('../models/Resume');
const { calculateATSScore, getScoreLabel } = require('../utils/atsScorer');
const { analyzeWithGemini } = require('../utils/geminiAnalyzer');

// ─── @route   POST /api/ats/analyze/:id ──────────────────────────────────────
// ─── @desc    Run ATS analysis on a parsed resume ────────────────────────────
// ─── @access  Private ─────────────────────────────────────────────────────────
const analyzeResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }

    if (resume.status === 'processing' || resume.status === 'uploading') {
      return res.status(400).json({
        success: false,
        message: 'Resume is still being processed. Please wait.',
      });
    }

    if (resume.status === 'error') {
      return res.status(400).json({
        success: false,
        message: `Resume parsing failed: ${resume.parseError}`,
      });
    }

    // Run the ATS scoring engine
    const analysis = calculateATSScore(resume);

    // Persist results
    const updated = await Resume.findByIdAndUpdate(
      resume._id,
      {
        atsScore: analysis.totalScore,
        atsAnalysis: analysis,
        status: 'analyzed',
        analyzedAt: new Date(),
      },
      { new: true }
    ).select('-rawText -filePath -storedName');

    res.json({
      success: true,
      message: 'ATS analysis complete.',
      resumeId: resume._id,
      analysis,
    });

    console.log(`✅ ATS analyzed: ${resume._id} — Score: ${analysis.totalScore}/100 (${analysis.label})`);
  } catch (error) {
    next(error);
  }
};

// ─── @route   GET /api/ats/score/:id ─────────────────────────────────────────
// ─── @desc    Get stored ATS analysis for a resume ───────────────────────────
// ─── @access  Private ─────────────────────────────────────────────────────────
const getATSScore = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).select('atsScore atsAnalysis status analyzedAt originalName');

    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }

    if (!resume.atsAnalysis) {
      return res.status(404).json({
        success: false,
        message: 'No ATS analysis found. Run POST /api/ats/analyze/:id first.',
        status: resume.status,
      });
    }

    res.json({
      success: true,
      resumeId: resume._id,
      originalName: resume.originalName,
      atsScore: resume.atsScore,
      analyzedAt: resume.analyzedAt,
      analysis: resume.atsAnalysis,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route   GET /api/ats/overview ──────────────────────────────────────────
// ─── @desc    Get ATS score overview for all user resumes ────────────────────
// ─── @access  Private ─────────────────────────────────────────────────────────
const getUserATSOverview = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('originalName atsScore status analyzedAt createdAt fileType atsAnalysis');

    // Build overview data
    const analyzed = resumes.filter((r) => r.atsScore !== null);
    const avgScore = analyzed.length > 0
      ? Math.round(analyzed.reduce((sum, r) => sum + r.atsScore, 0) / analyzed.length)
      : null;

    const bestResume = analyzed.sort((a, b) => b.atsScore - a.atsScore)[0] || null;

    // Score trend (last 6 analyzed resumes chronologically)
    const trend = [...analyzed]
      .sort((a, b) => new Date(a.analyzedAt) - new Date(b.analyzedAt))
      .slice(-6)
      .map((r) => ({
        name: r.originalName.replace(/\.[^.]+$/, '').slice(0, 15),
        score: r.atsScore,
        date: r.analyzedAt,
      }));

    // Category averages across all analyzed resumes
    const categoryAverages = {};
    for (const resume of analyzed) {
      if (resume.atsAnalysis?.categories) {
        for (const cat of resume.atsAnalysis.categories) {
          if (!categoryAverages[cat.category]) {
            categoryAverages[cat.category] = { total: 0, count: 0, weight: cat.weight };
          }
          categoryAverages[cat.category].total += cat.score;
          categoryAverages[cat.category].count += 1;
        }
      }
    }

    const avgCategories = Object.entries(categoryAverages).map(([name, data]) => ({
      category: name,
      avgScore: round2(data.total / data.count),
      weight: data.weight,
      percentage: Math.round((data.total / data.count / data.weight) * 100),
    }));

    res.json({
      success: true,
      overview: {
        total: resumes.length,
        analyzed: analyzed.length,
        pending: resumes.length - analyzed.length,
        avgScore,
        bestScore: bestResume?.atsScore || null,
        bestResume: bestResume ? {
          id: bestResume._id,
          name: bestResume.originalName,
          score: bestResume.atsScore,
          label: getScoreLabel(bestResume.atsScore).label,
        } : null,
        trend,
        categoryAverages: avgCategories,
      },
      resumes: resumes.map((r) => ({
        _id: r._id,
        originalName: r.originalName,
        atsScore: r.atsScore,
        status: r.status,
        fileType: r.fileType,
        label: r.atsScore !== null ? getScoreLabel(r.atsScore).label : null,
        analyzedAt: r.analyzedAt,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route   POST /api/ats/ai-analyze/:id ───────────────────────────────────────────
// ─── @desc    Run Gemini AI analysis on a resume ──────────────────────────────
// ─── @body    { jobRole: string }  (optional) ────────────────────────────────
// ─── @access  Private ─────────────────────────────────────────────────────────
const runAIAnalysis = async (req, res, next) => {
  try {
    const { jobRole = '' } = req.body;

    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }

    if (['uploading', 'processing'].includes(resume.status)) {
      return res.status(400).json({
        success: false,
        message: 'Resume is still being processed. Please wait.',
      });
    }

    if (resume.status === 'error') {
      return res.status(400).json({
        success: false,
        message: `Resume parsing failed: ${resume.parseError}`,
      });
    }

    if (!resume.rawText || resume.rawText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Resume has insufficient text content for AI analysis.',
      });
    }

    // Run Gemini AI analysis
    const aiAnalysis = await analyzeWithGemini(resume, jobRole);

    // Persist the result
    await Resume.findByIdAndUpdate(resume._id, {
      aiAnalysis,
      aiAnalyzedAt: new Date(),
    });

    console.log(`✨ AI analysis saved for resume ${resume._id} (role: "${jobRole || 'General'}")`);

    res.json({
      success: true,
      message: 'AI analysis complete.',
      resumeId: resume._id,
      jobRole: jobRole || 'General Professional',
      aiAnalysis,
    });
  } catch (error) {
    if (error.message?.includes('GEMINI_API_KEY')) {
      return res.status(400).json({
        success: false,
        message: 'AI service not configured. Please add GEMINI_API_KEY to your .env file.',
      });
    }
    next(error);
  }
};

// ─── @route   GET /api/ats/ai-analysis/:id ──────────────────────────────────────────
// ─── @desc    Get stored Gemini AI analysis for a resume ────────────────────────
// ─── @access  Private ─────────────────────────────────────────────────────────
const getAIAnalysis = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).select('aiAnalysis aiAnalyzedAt originalName status');

    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }

    if (!resume.aiAnalysis) {
      return res.status(404).json({
        success: false,
        message: 'No AI analysis found. Run POST /api/ats/ai-analyze/:id first.',
        status: resume.status,
      });
    }

    res.json({
      success: true,
      resumeId: resume._id,
      originalName: resume.originalName,
      aiAnalyzedAt: resume.aiAnalyzedAt,
      aiAnalysis: resume.aiAnalysis,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Helper ─────────────────────────────────────────────────────────────────────────────
const round2 = (v) => Math.round(v * 100) / 100;

module.exports = { analyzeResume, getATSScore, getUserATSOverview, runAIAnalysis, getAIAnalysis };
