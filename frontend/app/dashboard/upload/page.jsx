'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Zap, Shield, FileCheck, Clock, List,
  AlertCircle, Trash2, Eye, RefreshCw, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import DropZone from '@/components/upload/DropZone';
import ParseResult from '@/components/upload/ParseResult';
import { useResumes } from '@/hooks/useResume';
import toast from 'react-hot-toast';

// ─── Tips Sidebar ─────────────────────────────────────────────────────────────
const tips = [
  { icon: FileCheck, title: 'Use Standard Headings', desc: 'Label sections clearly: "Experience", "Education", "Skills"' },
  { icon: Zap,       title: 'ATS-Friendly Format',   desc: 'Avoid tables, columns, or text boxes. Use plain text.' },
  { icon: Shield,    title: 'Quantify Achievements',  desc: 'Use numbers: "Increased sales by 40%" vs "Increased sales"' },
  { icon: Clock,     title: 'Reverse Chronological',  desc: 'List your most recent experience first.' },
];

// ─── Recent Resume Row ────────────────────────────────────────────────────────
function ResumeRow({ resume, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const statusColor = {
    parsed:     'rgb(34,197,94)',
    processing: 'rgb(251,191,36)',
    error:      'rgb(239,68,68)',
    analyzed:   'rgb(34,211,238)',
    uploading:  'rgb(148,163,184)',
  }[resume.status] || 'rgb(148,163,184)';

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${resume.originalName}"?`)) return;
    setDeleting(true);
    await onDelete(resume._id);
    setDeleting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="flex items-center gap-3 p-3 rounded-xl transition-colors"
      style={{ background: 'rgb(var(--bg-secondary))', border: '1px solid rgb(var(--border-color))' }}
    >
      {/* Icon */}
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: resume.fileType === 'pdf' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)' }}>
        <span className="text-xs font-bold"
          style={{ color: resume.fileType === 'pdf' ? 'rgb(239,68,68)' : 'rgb(99,102,241)' }}>
          {resume.fileType?.toUpperCase()}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'rgb(var(--text-primary))' }}>
          {resume.originalName}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
          <span className="text-xs capitalize" style={{ color: 'rgb(var(--text-muted))' }}>
            {resume.status}
          </span>
          {resume.wordCount > 0 && (
            <span className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
              · {resume.wordCount?.toLocaleString()} words
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {(resume.status === 'parsed' || resume.status === 'analyzed') && (
          <Link href={`/dashboard/resume/${resume._id}`}>
            <button className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: 'rgb(var(--text-muted))' }} title="View analysis">
              <Eye size={14} />
            </button>
          </Link>
        )}
        <button onClick={handleDelete} disabled={deleting}
          className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
          style={{ color: deleting ? 'rgb(var(--text-muted))' : 'rgb(239,68,68)' }}
          title="Delete">
          {deleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Upload Page ─────────────────────────────────────────────────────────
export default function UploadPage() {
  const [parsedResume, setParsedResume] = useState(null);
  const { resumes, loading, fetchResumes, deleteResume } = useResumes();

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const handleParsed = (resume) => {
    if (resume) {
      setParsedResume(resume);
      fetchResumes(); // Refresh list
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
            Upload Resume
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-muted))' }}>
            AI-powered text extraction and section parsing
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs px-3 py-2 rounded-xl"
          style={{ background: 'rgba(34,197,94,0.1)', color: 'rgb(34,197,94)' }}>
          <Shield size={13} />
          Secure · Encrypted
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Upload + Result */}
        <div className="xl:col-span-2 space-y-6">
          {/* Drop Zone Card */}
          <div className="card">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.1)' }}>
                <Upload size={15} style={{ color: 'rgb(99,102,241)' }} />
              </div>
              <h2 className="font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
                Upload New Resume
              </h2>
            </div>
            <DropZone onParsed={handleParsed} />
          </div>

          {/* Parse Result */}
          <AnimatePresence>
            {parsedResume && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="card"
              >
                <ParseResult resume={parsedResume} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* My Resumes List */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.1)' }}>
                  <List size={15} style={{ color: 'rgb(99,102,241)' }} />
                </div>
                <h2 className="font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
                  My Resumes
                  {resumes.length > 0 && (
                    <span className="ml-2 badge badge-primary">{resumes.length}</span>
                  )}
                </h2>
              </div>
              <button onClick={() => fetchResumes()}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
                style={{ color: 'rgb(var(--text-muted))' }}>
                <RefreshCw size={14} />
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 rounded-xl animate-pulse"
                    style={{ background: 'rgb(var(--bg-secondary))' }} />
                ))}
              </div>
            ) : resumes.length > 0 ? (
              <AnimatePresence>
                <div className="space-y-2">
                  {resumes.map((resume) => (
                    <ResumeRow key={resume._id} resume={resume} onDelete={deleteResume} />
                  ))}
                </div>
              </AnimatePresence>
            ) : (
              <div className="text-center py-10">
                <Upload size={28} className="mx-auto mb-3" style={{ color: 'rgb(var(--text-muted))' }} />
                <p className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
                  No resumes yet
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-muted))' }}>
                  Upload your first resume above to get started
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Tips */}
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={15} style={{ color: 'rgb(251,191,36)' }} />
              <h3 className="font-semibold text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
                ATS Tips
              </h3>
            </div>
            <div className="space-y-4">
              {tips.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: 'rgba(99,102,241,0.1)' }}>
                    <Icon size={14} style={{ color: 'rgb(99,102,241)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>{title}</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'rgb(var(--text-muted))' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supported formats */}
          <div className="card">
            <h3 className="font-semibold text-sm mb-3" style={{ color: 'rgb(var(--text-primary))' }}>
              Supported Formats
            </h3>
            <div className="space-y-2">
              {[
                { fmt: 'PDF', desc: 'Best text extraction', ok: true },
                { fmt: 'DOCX', desc: 'Microsoft Word', ok: true },
                { fmt: 'DOC', desc: 'Legacy Word format', ok: true },
              ].map(({ fmt, desc, ok }) => (
                <div key={fmt} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-primary text-xs">.{fmt}</span>
                    <span className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>{desc}</span>
                  </div>
                  <div className="w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(34,197,94,0.1)' }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: 'rgb(34,197,94)' }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs mt-3 pt-3" style={{ borderTop: '1px solid rgb(var(--border-color))', color: 'rgb(var(--text-muted))' }}>
              Max file size: 10 MB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
