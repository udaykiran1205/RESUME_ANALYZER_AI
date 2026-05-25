'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, FileText, Calendar, Clock, CheckCircle, AlertCircle,
  Copy, Download, BarChart2, Loader2, Trash2, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ParseResult from '@/components/upload/ParseResult';
import { resumeAPI } from '@/lib/resumeAPI';

export default function ResumeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('sections'); // sections | text
  const [rawText, setRawText] = useState(null);
  const [loadingText, setLoadingText] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchResume = async () => {
      try {
        const { data } = await resumeAPI.getById(params.id);
        setResume(data.resume);
      } catch (err) {
        setError(err.response?.data?.message || 'Resume not found');
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchResume();
  }, [params.id]);

  const loadRawText = async () => {
    if (rawText) return;
    setLoadingText(true);
    try {
      const { data } = await resumeAPI.getText(params.id);
      setRawText(data.rawText);
    } catch (err) {
      toast.error('Failed to load raw text');
    } finally {
      setLoadingText(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'text') loadRawText();
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${resume?.originalName}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await resumeAPI.delete(params.id);
      toast.success('Resume deleted');
      router.push('/dashboard/upload');
    } catch (err) {
      toast.error('Delete failed');
      setDeleting(false);
    }
  };

  const copyText = () => {
    if (rawText) {
      navigator.clipboard.writeText(rawText);
      toast.success('Text copied to clipboard!');
    }
  };

  // ── Loading State ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 size={32} className="animate-spin" style={{ color: 'rgb(99,102,241)' }} />
        <p style={{ color: 'rgb(var(--text-muted))' }}>Loading resume...</p>
      </div>
    );
  }

  // ── Error State ──────────────────────────────────────────────────────────────
  if (error || !resume) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.1)' }}>
          <AlertCircle size={28} style={{ color: 'rgb(239,68,68)' }} />
        </div>
        <div>
          <p className="font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>Resume Not Found</p>
          <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-muted))' }}>{error}</p>
        </div>
        <Link href="/dashboard/upload">
          <button className="btn-primary">Back to Uploads</button>
        </Link>
      </div>
    );
  }

  const statusColor = {
    parsed:     { text: 'rgb(34,197,94)',  bg: 'rgba(34,197,94,0.1)' },
    error:      { text: 'rgb(239,68,68)',  bg: 'rgba(239,68,68,0.1)' },
    processing: { text: 'rgb(251,191,36)', bg: 'rgba(251,191,36,0.1)' },
    analyzed:   { text: 'rgb(34,211,238)', bg: 'rgba(34,211,238,0.1)' },
  }[resume.status] || { text: 'rgb(148,163,184)', bg: 'rgba(148,163,184,0.1)' };

  const tabs = [
    { id: 'sections', label: 'Parsed Sections' },
    { id: 'text',     label: 'Raw Text' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/upload">
          <button className="flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: 'rgb(var(--text-muted))' }}>
            <ArrowLeft size={15} /> Back
          </button>
        </Link>
        <span style={{ color: 'rgb(var(--border-color))' }}>/</span>
        <span className="text-sm truncate" style={{ color: 'rgb(var(--text-primary))' }}>
          {resume.originalName}
        </span>
      </div>

      {/* Resume Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="card">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* File Icon */}
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: resume.fileType === 'pdf' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)' }}>
            <FileText size={26} style={{ color: resume.fileType === 'pdf' ? 'rgb(239,68,68)' : 'rgb(99,102,241)' }} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate" style={{ color: 'rgb(var(--text-primary))' }}>
              {resume.originalName}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold capitalize"
                style={{ background: statusColor.bg, color: statusColor.text }}>
                {resume.status}
              </span>
              <span className="flex items-center gap-1 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                <Calendar size={11} />
                {new Date(resume.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
              </span>
              {resume.parsedAt && (
                <span className="flex items-center gap-1 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                  <Clock size={11} />
                  Parsed {new Date(resume.parsedAt).toLocaleTimeString()}
                </span>
              )}
              <span className="badge badge-primary text-xs">
                {resume.fileType?.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleDelete} disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={{ background: 'rgba(239,68,68,0.1)', color: 'rgb(239,68,68)' }}>
              {deleting ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
              Delete
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: 'rgb(var(--bg-secondary))' }}>
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => handleTabChange(tab.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === tab.id ? 'rgb(var(--bg-primary))' : 'transparent',
              color: activeTab === tab.id ? 'rgb(var(--text-primary))' : 'rgb(var(--text-muted))',
              boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.2)' : 'none',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'sections' && (
          <motion.div key="sections"
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <ParseResult resume={resume} />
          </motion.div>
        )}

        {activeTab === 'text' && (
          <motion.div key="text"
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
                  Extracted Raw Text
                </h3>
                {rawText && (
                  <button onClick={copyText}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(99,102,241,0.1)', color: 'rgb(99,102,241)' }}>
                    <Copy size={12} /> Copy
                  </button>
                )}
              </div>

              {loadingText ? (
                <div className="flex items-center justify-center py-12 gap-3"
                  style={{ color: 'rgb(var(--text-muted))' }}>
                  <Loader2 size={18} className="animate-spin" /> Loading raw text...
                </div>
              ) : rawText ? (
                <pre className="text-xs leading-relaxed whitespace-pre-wrap overflow-x-auto max-h-[600px] overflow-y-auto p-4 rounded-xl"
                  style={{
                    background: 'rgb(var(--bg-tertiary))',
                    color: 'rgb(var(--text-secondary))',
                    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                  }}>
                  {rawText}
                </pre>
              ) : (
                <div className="py-8 text-center" style={{ color: 'rgb(var(--text-muted))' }}>
                  <p className="text-sm">Loading text...</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
