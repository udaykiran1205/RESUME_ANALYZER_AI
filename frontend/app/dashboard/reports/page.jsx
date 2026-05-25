'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, Loader2, RefreshCw, Upload,
  Award, Calendar, Target, ChevronRight, Eye, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { resumeAPI, atsAPI } from '@/lib/resumeAPI';
import DownloadReportButton from '@/components/ats/DownloadReportButton';

function ScorePill({ score }) {
  const color = score >= 80 ? 'rgb(34,197,94)' : score >= 60 ? 'rgb(99,102,241)' : score >= 40 ? 'rgb(251,191,36)' : 'rgb(239,68,68)';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Average' : 'Needs Work';
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl font-bold" style={{ color }}>{score}</span>
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{ background: `${color}18`, color }}>{label}</span>
    </div>
  );
}

function ReportCard({ resume, onLoadAnalysis, loadingId }) {
  const [analysis, setAnalysis] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const isLoading = loadingId === resume._id;
  const hasScore = resume.atsScore !== null && resume.atsScore !== undefined;

  const handleExpand = async () => {
    if (!expanded && !analysis && hasScore) {
      onLoadAnalysis(resume._id, setAnalysis);
    }
    setExpanded((p) => !p);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden"
    >
      {/* Card Header */}
      <div className="flex items-start gap-4">
        {/* File icon */}
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: resume.fileType === 'pdf' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)' }}>
          <FileText size={20} style={{ color: resume.fileType === 'pdf' ? 'rgb(239,68,68)' : 'rgb(99,102,241)' }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate" style={{ color: 'rgb(var(--text-primary))' }}>
            {resume.originalName}
          </p>
          <div className="flex items-center flex-wrap gap-3 mt-1">
            <span className="flex items-center gap-1 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
              <Calendar size={11} />
              {resume.analyzedAt ? new Date(resume.analyzedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not analyzed'}
            </span>
            <span className="text-xs capitalize px-2 py-0.5 rounded-full"
              style={{ background: 'rgb(var(--bg-tertiary))', color: 'rgb(var(--text-muted))' }}>
              .{resume.fileType}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {hasScore && <ScorePill score={resume.atsScore} />}
          {!hasScore && (
            <span className="text-xs px-2 py-1 rounded-lg capitalize"
              style={{ background: 'rgba(251,191,36,0.1)', color: 'rgb(251,191,36)' }}>
              {resume.status}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: '1px solid rgb(var(--border-color))' }}>
        {hasScore && (
          <>
            <button
              onClick={handleExpand}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'rgb(var(--bg-secondary))', color: 'rgb(var(--text-secondary))' }}
            >
              {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
              {expanded ? 'Hide Report' : 'Preview Report'}
            </button>

            {analysis && <DownloadReportButton analysis={analysis} resume={resume} />}

            <Link href="/dashboard/ats" className="ml-auto">
              <button className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                style={{ color: 'rgb(99,102,241)' }}>
                Full Analysis <ChevronRight size={12} />
              </button>
            </Link>
          </>
        )}
        {!hasScore && (
          <Link href="/dashboard/ats">
            <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'rgba(99,102,241,0.1)', color: 'rgb(99,102,241)' }}>
              <Target size={12} /> Run ATS Analysis
            </button>
          </Link>
        )}
      </div>

      {/* Expanded analysis preview */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgb(var(--border-color))' }}>
              {isLoading && (
                <div className="flex items-center gap-2 py-4" style={{ color: 'rgb(var(--text-muted))' }}>
                  <Loader2 size={16} className="animate-spin" /> Loading analysis...
                </div>
              )}
              {analysis && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
                    Category Scores
                  </p>
                  {analysis.categories?.map((cat) => (
                    <div key={cat.category}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: 'rgb(var(--text-secondary))' }}>{cat.category}</span>
                        <span className="font-semibold" style={{ color: 'rgb(99,102,241)' }}>{cat.score}/{cat.weight}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgb(var(--bg-tertiary))' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${cat.percentage}%` }}
                          transition={{ duration: 0.8 }}
                          className="h-full rounded-full"
                          style={{ background: 'rgb(99,102,241)' }}
                        />
                      </div>
                    </div>
                  ))}
                  {analysis.suggestions?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgb(var(--text-muted))' }}>
                        Top Suggestions
                      </p>
                      {analysis.suggestions.slice(0, 3).map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs mb-2" style={{ color: 'rgb(var(--text-secondary))' }}>
                          <span className="w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                            style={{ background: 'rgba(251,191,36,0.15)', color: 'rgb(251,191,36)' }}>{i + 1}</span>
                          {s.tip}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {!isLoading && !analysis && (
                <p className="text-xs py-2" style={{ color: 'rgb(var(--text-muted))' }}>Analysis not available. Run ATS Analysis first.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ReportsPage() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => { fetchResumes(); }, []);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const { data } = await resumeAPI.getAll(1, 20);
      setResumes(data.resumes || []);
    } catch {
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadAnalysis = async (resumeId, setAnalysis) => {
    setLoadingId(resumeId);
    try {
      const { data } = await atsAPI.getScore(resumeId);
      setAnalysis(data.analysis);
    } catch {
      toast.error('Could not load analysis for this resume');
    } finally {
      setLoadingId(null);
    }
  };

  const analyzed = resumes.filter((r) => r.atsScore !== null);
  const pending = resumes.filter((r) => r.atsScore === null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={24} className="animate-spin" style={{ color: 'rgb(34,197,94)' }} />
        <span style={{ color: 'rgb(var(--text-muted))' }}>Loading reports...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)' }}>
              <FileText size={16} style={{ color: 'rgb(34,197,94)' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>PDF Reports</h1>
          </div>
          <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
            Download professional ATS analysis reports for your resumes
          </p>
        </div>
        <button onClick={fetchResumes} className="p-2 rounded-xl hover:bg-white/5 transition-colors"
          style={{ color: 'rgb(var(--text-muted))' }}>
          <RefreshCw size={16} />
        </button>
      </div>

      {resumes.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-5">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)' }}>
            <FileText size={36} style={{ color: 'rgb(34,197,94)' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>No Reports Yet</h2>
            <p className="text-sm mt-2 max-w-sm mx-auto" style={{ color: 'rgb(var(--text-muted))' }}>
              Upload a resume and run ATS analysis to generate your first PDF report.
            </p>
          </div>
          <Link href="/dashboard/upload">
            <button className="btn-primary"><Upload size={15} /> Upload Resume</button>
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {/* Summary Bar */}
          <div className="flex items-center gap-4 p-4 rounded-2xl"
            style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
            <div className="flex items-center gap-2 text-sm">
              <Award size={15} style={{ color: 'rgb(34,197,94)' }} />
              <span style={{ color: 'rgb(var(--text-secondary))' }}>
                <strong style={{ color: 'rgb(34,197,94)' }}>{analyzed.length}</strong> reports ready to download
              </span>
            </div>
            {pending.length > 0 && (
              <div className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
                · {pending.length} need analysis
              </div>
            )}
            <Link href="/dashboard/ats" className="ml-auto">
              <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(34,197,94,0.12)', color: 'rgb(34,197,94)' }}>
                <Sparkles size={11} /> Run Analysis
              </button>
            </Link>
          </div>

          {/* Analyzed resumes with PDF download */}
          {analyzed.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
                ✓ Ready for Download ({analyzed.length})
              </h2>
              {analyzed.map((r) => (
                <ReportCard key={r._id} resume={r} onLoadAnalysis={handleLoadAnalysis} loadingId={loadingId} />
              ))}
            </div>
          )}

          {/* Pending resumes */}
          {pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
                ○ Needs Analysis ({pending.length})
              </h2>
              {pending.map((r) => (
                <ReportCard key={r._id} resume={r} onLoadAnalysis={handleLoadAnalysis} loadingId={loadingId} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
