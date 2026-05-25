const path = require('path');
const Resume = require('../models/Resume');
const User = require('../models/User');
const { parseResume } = require('../utils/resumeParser');
const { deleteFile, getFileType } = require('../config/multer');

// ─── Helper: format resume for response ───────────────────────────────────────
const formatResume = (resume) => ({
  _id: resume._id,
  originalName: resume.originalName,
  fileType: resume.fileType,
  fileSize: resume.fileSize,
  fileSizeFormatted: resume.fileSizeFormatted,
  pageCount: resume.pageCount,
  wordCount: resume.wordCount,
  characterCount: resume.characterCount,
  status: resume.status,
  contact: resume.contact,
  sections: resume.sections,
  detectedSkills: resume.detectedSkills,
  atsScore: resume.atsScore,
  parseError: resume.parseError,
  parsedAt: resume.parsedAt,
  createdAt: resume.createdAt,
  updatedAt: resume.updatedAt,
});

// ─── @route   POST /api/upload ────────────────────────────────────────────────
// ─── @desc    Upload and parse a resume ───────────────────────────────────────
// ─── @access  Private ─────────────────────────────────────────────────────────
const uploadResume = async (req, res, next) => {
  let filePath = null;

  try {
    // Validate file was received
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select a PDF or DOCX file.',
      });
    }

    const { originalname, filename, mimetype, size, path: uploadedPath } = req.file;
    filePath = uploadedPath;
    const fileType = getFileType(originalname);

    // Extra validation
    if (fileType === 'unknown') {
      deleteFile(filePath);
      return res.status(400).json({
        success: false,
        message: 'Unsupported file format. Only PDF, DOCX, and DOC are allowed.',
      });
    }

    // Check file size (extra guard beyond multer)
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;
    if (size > maxSize) {
      deleteFile(filePath);
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${maxSize / (1024 * 1024)} MB.`,
      });
    }

    // Create initial Resume record with 'processing' status
    const resume = await Resume.create({
      user: req.user._id,
      originalName: originalname,
      storedName: filename,
      fileType,
      mimeType: mimetype,
      fileSize: size,
      filePath: uploadedPath,
      status: 'processing',
    });

    // Respond immediately so client sees the upload succeeded
    res.status(202).json({
      success: true,
      message: 'Resume uploaded. Parsing in progress...',
      resumeId: resume._id,
      status: 'processing',
    });

    // ── Parse in background (async, after response sent) ─────────────────────
    setImmediate(async () => {
      try {
        const parsed = await parseResume(filePath, fileType);

        if (parsed.success) {
          await Resume.findByIdAndUpdate(resume._id, {
            rawText: parsed.rawText,
            pageCount: parsed.pageCount,
            wordCount: parsed.wordCount,
            characterCount: parsed.characterCount,
            contact: parsed.contact,
            sections: parsed.sections,
            detectedSkills: parsed.detectedSkills,
            status: 'parsed',
            parsedAt: new Date(),
            parseError: null,
          });

          // Update user resume count
          await User.findByIdAndUpdate(req.user._id, {
            $inc: { resumeCount: 1 },
          });

          console.log(`✅ Resume parsed: ${resume._id} — ${parsed.wordCount} words, ${parsed.sections.length} sections, ${parsed.detectedSkills.length} skills`);
        } else {
          await Resume.findByIdAndUpdate(resume._id, {
            status: 'error',
            parseError: parsed.error,
          });
          console.error(`❌ Resume parse failed: ${resume._id} — ${parsed.error}`);
        }
      } catch (parseError) {
        await Resume.findByIdAndUpdate(resume._id, {
          status: 'error',
          parseError: parseError.message,
        }).catch(() => {});
        console.error('Background parse error:', parseError.message);
      }
    });

  } catch (error) {
    // Cleanup file if DB creation failed
    if (filePath) deleteFile(filePath);
    next(error);
  }
};

// ─── @route   GET /api/upload/status/:id ─────────────────────────────────────
// ─── @desc    Poll parse status for a resume ─────────────────────────────────
// ─── @access  Private ─────────────────────────────────────────────────────────
const getResumeStatus = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }

    res.json({
      success: true,
      resumeId: resume._id,
      status: resume.status,
      parseError: resume.parseError,
      ...(resume.status === 'parsed' && {
        wordCount: resume.wordCount,
        pageCount: resume.pageCount,
        sectionCount: resume.sections.length,
        skillCount: resume.detectedSkills.length,
      }),
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route   GET /api/upload/resumes ────────────────────────────────────────
// ─── @desc    Get all resumes for current user ────────────────────────────────
// ─── @access  Private ─────────────────────────────────────────────────────────
const getUserResumes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [resumes, total] = await Promise.all([
      Resume.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-rawText -filePath -storedName'), // exclude heavy fields in list
      Resume.countDocuments({ user: req.user._id }),
    ]);

    res.json({
      success: true,
      resumes: resumes.map(formatResume),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route   GET /api/upload/resumes/:id ────────────────────────────────────
// ─── @desc    Get single resume with full parsed content ──────────────────────
// ─── @access  Private ─────────────────────────────────────────────────────────
const getResumeById = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).select('-filePath -storedName'); // don't expose internal paths

    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }

    res.json({ success: true, resume: formatResume(resume) });
  } catch (error) {
    next(error);
  }
};

// ─── @route   DELETE /api/upload/resumes/:id ─────────────────────────────────
// ─── @desc    Delete a resume ─────────────────────────────────────────────────
// ─── @access  Private ─────────────────────────────────────────────────────────
const deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }

    // Delete physical file
    deleteFile(resume.filePath);

    // Delete database record
    await resume.deleteOne();

    // Decrement user resume count
    await User.findByIdAndUpdate(req.user._id, { $inc: { resumeCount: -1 } });

    res.json({ success: true, message: 'Resume deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ─── @route   GET /api/upload/resumes/:id/text ───────────────────────────────
// ─── @desc    Get raw extracted text of a resume ─────────────────────────────
// ─── @access  Private ─────────────────────────────────────────────────────────
const getResumeText = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).select('rawText status originalName');

    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }
    if (resume.status !== 'parsed' && resume.status !== 'analyzed') {
      return res.status(400).json({ success: false, message: `Resume is not yet parsed. Status: ${resume.status}` });
    }

    res.json({
      success: true,
      originalName: resume.originalName,
      rawText: resume.rawText,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadResume,
  getResumeStatus,
  getUserResumes,
  getResumeById,
  deleteResume,
  getResumeText,
};
