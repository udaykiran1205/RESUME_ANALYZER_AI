const mongoose = require('mongoose');

// ─── Sub-schema: Individual Resume Section ────────────────────────────────────
const sectionSchema = new mongoose.Schema({
  key:     { type: String, default: '' },     // e.g. 'experience', 'skills'
  title:   { type: String, required: true },
  content: { type: String, default: '' },
  items:   [{ type: String }],                // bullet-point items if detected
  order:   { type: Number, default: 0 },
}, { _id: false });

// ─── Sub-schema: Contact Info (extracted) ────────────────────────────────────
const contactSchema = new mongoose.Schema({
  name:     { type: String, default: '' },
  email:    { type: String, default: '' },
  phone:    { type: String, default: '' },
  location: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  github:   { type: String, default: '' },
  website:  { type: String, default: '' },
}, { _id: false });

// ─── Main Resume Schema ───────────────────────────────────────────────────────
const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // ── File Metadata ──────────────────────────────────────────────────────────
    originalName: { type: String, required: true },
    storedName:   { type: String, required: true }, // UUID-based filename on disk
    fileType:     { type: String, enum: ['pdf', 'docx', 'doc'], required: true },
    mimeType:     { type: String, required: true },
    fileSize:     { type: Number, required: true }, // bytes
    filePath:     { type: String, required: true },

    // ── Extracted Content ──────────────────────────────────────────────────────
    rawText: { type: String, default: '' },         // full extracted plain text
    pageCount: { type: Number, default: 1 },
    wordCount: { type: Number, default: 0 },
    characterCount: { type: Number, default: 0 },

    // ── Parsed Sections ────────────────────────────────────────────────────────
    contact: { type: contactSchema, default: () => ({}) },
    sections: [sectionSchema],

    // ── Detected Skills (flat list for quick access) ───────────────────────────
    detectedSkills: [{ type: String }],

    // ── Status ─────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['uploading', 'processing', 'parsed', 'analyzed', 'error'],
      default: 'uploading',
    },
    parseError: { type: String, default: null },

    // ── ATS Analysis ───────────────────────────────────────────────────────────
    atsScore: { type: Number, default: null },       // 0-100
    atsAnalysis: { type: mongoose.Schema.Types.Mixed, default: null },

    // ── AI Analysis (Gemini-powered) ───────────────────────────────────────────
    aiAnalysis: { type: mongoose.Schema.Types.Mixed, default: null },
    aiAnalyzedAt: { type: Date, default: null },

    // ── Timestamps ─────────────────────────────────────────────────────────────
    parsedAt:  { type: Date, default: null },
    analyzedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
resumeSchema.index({ user: 1, createdAt: -1 });
resumeSchema.index({ status: 1 });

// ─── Virtual: fileSizeFormatted ────────────────────────────────────────────────
resumeSchema.virtual('fileSizeFormatted').get(function () {
  const bytes = this.fileSize;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
});

// ─── Virtual: hasContact ──────────────────────────────────────────────────────
resumeSchema.virtual('hasContact').get(function () {
  return !!(this.contact?.email || this.contact?.phone);
});

// ─── Static: get user resume count ───────────────────────────────────────────
resumeSchema.statics.countForUser = function (userId) {
  return this.countDocuments({ user: userId });
};

const Resume = mongoose.model('Resume', resumeSchema);
module.exports = Resume;
