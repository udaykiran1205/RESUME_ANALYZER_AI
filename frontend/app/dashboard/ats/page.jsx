'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, FileText, Loader2, ChevronRight, RefreshCw,
  AlertCircle, Upload, Zap, BarChart3, Eye, TrendingUp, Award, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ScoreGauge, { ScoreBadge } from '@/components/ats/ScoreGauge';
import ScoreBreakdown, { CategoryBars } from '@/components/ats/ScoreBreakdown';
import KeywordAnalysis from '@/components/ats/KeywordAnalysis';
import Suggestions from '@/components/ats/Suggestions';
import { atsAPI, resumeAPI } from '@/lib/resumeAPI';
import DownloadReportButton from '@/components/ats/DownloadReportButton';

// ─── Tab configuration ────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',  label: 'Overview',  icon: BarChart3 },
  { id: 'breakdown', label: 'Score Breakdown', icon: Target },
  { id: 'keywords',  label: 'Keywords & Skills', icon: Zap },
  { id: 'tips',      label: 'Suggestions', icon: TrendingUp },
];

// ─── Resume Select Card ──────────────────────────────────────────────────────
function ResumeCard({ resume, isSelected, onSelect, onAnalyze, analyzing }) {
  const hasScore = resume.atsScore !== null && resume.atsScore !== undefined;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect(resume)}
      className="p-3.5 rounded-xl cursor-pointer transition-all"
      style={{
        background: isSelected ? 'rgba(99,102,241,0.1)' : 'rgb(var(--bg-secondary))',
        border: `1.5px solid ${isSelected ? 'rgba(99,102,241,0.5)' : 'rgb(var(--border-color))'}`,
      }}
    >
      <div className="flex items-center gap-3">
        {/* File icon */}
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: resume.fileType === 'pdf' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)' }}>
          <FileText size={17}
            style={{ color: resume.fileType === 'pdf' ? 'rgb(239,68,68)' : 'rgb(99,102,241)' }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'rgb(var(--text-primary))' }}>
            {resume.originalName}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs capitalize" style={{ color: 'rgb(var(--text-muted))' }}>
              {resume.status}
            </span>
            {hasScore && (
              <span className="text-xs font-bold" style={{ color: 'rgb(99,102,241)' }}>
                Score: {resume.atsScore}
              </span>
            )}
          </div>
        </div>

        {/* Score badge or Analyze button */}
        {hasScore ? (
          <ScoreBadge score={resume.atsScore} />
        ) : (resume.status === 'parsed' || resume.status === 'analyzed') ? (
          <button
            onClick={(e) => { e.stopPropagation(); onAnalyze(resume._id); }}
            disabled={analyzing}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{ background: 'rgba(99,102,241,0.15)', color: 'rgb(99,102,241)' }}
          >
            {analyzing ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
            Analyze
          </button>
        ) : null}
      </div>
    </motion.div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ analysis }) {
  return (
    <div className="space-y-6">
      {/* Score + Category Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card flex flex-col items-center py-6">
          <ScoreGauge score={analysis.totalScore} />
        </div>
        <div className="card">
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'rgb(var(--text-primary))' }}>
            Category Scores
          </h3>
          <CategoryBars categories={analysis.categories} />
          {/* Meta stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4"
            style={{ borderTop: '1px solid rgb(var(--border-color))' }}>
            {[
              { label: 'Pages',    value: analysis.meta?.pageCount },
              { label: 'Words',    value: analysis.meta?.wordCount?.toLocaleString() },
              { label: 'Sections', value: analysis.meta?.sectionCount },
              { label: 'Skills',   value: analysis.meta?.skillCount },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-lg font-bold" style={{ color: 'rgb(99,102,241)' }}>{value ?? '—'}</p>
                <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top suggestions preview */}
      {analysis.suggestions?.length > 0 && (
        <div className="card space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} style={{ color: 'rgb(251,191,36)' }} />
            <h3 className="font-semibold text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
              Top Improvements
            </h3>
          </div>
          {analysis.suggestions.slice(0, 3).map((s, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm"
              style={{ color: 'rgb(var(--text-secondary))' }}>
              <span className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold"
                style={{ background: 'rgba(251,191,36,0.15)', color: 'rgb(251,191,36)' }}>
                {i + 1}
              </span>
              <span className="leading-relaxed">{s.tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ hasResumes }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-5"
    >
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(99,102,241,0.1)' }}>
        <Target size={36} style={{ color: 'rgb(99,102,241)' }} />
      </div>
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
          {hasResumes ? 'Select a Resume to Analyze' : 'No Resumes Found'}
        </h2>
        <p className="text-sm mt-2 max-w-sm mx-auto" style={{ color: 'rgb(var(--text-muted))' }}>
          {hasResumes
            ? 'Choose a parsed resume from the sidebar, then click "Analyze" to get your ATS score.'
            : 'Upload a resume first, then come back here for ATS analysis.'}
        </p>
      </div>
      {!hasResumes && (
        <Link href="/dashboard/upload">
          <button className="btn-primary">
            <Upload size={15} /> Upload Resume
          </button>
        </Link>
      )}
    </motion.div>
  );
}

// ─── Main ATS Page ────────────────────────────────────────────────────────────
export default function ATSPage() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResume, setSelectedResume] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loadingScore, setLoadingScore] = useState(false);
  const router = useRouter();

  // Fetch resumes on mount
  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const { data } = await resumeAPI.getAll(1);
      setResumes(data.resumes || []);
      // Auto-select first analyzed resume
      const analyzed = (data.resumes || []).find((r) => r.atsScore !== null);
      if (analyzed) {
        handleSelect(analyzed);
      }
    } catch (err) {
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  // Select a resume and load its analysis
  const handleSelect = useCallback(async (resume) => {
    setSelectedResume(resume);
    setActiveTab('overview');

    if (resume.atsScore !== null && resume.atsScore !== undefined) {
      setLoadingScore(true);
      try {
        const { data } = await atsAPI.getScore(resume._id);
        setAnalysis(data.analysis);
      } catch {
        // Score might not be stored yet — offer to analyze
        setAnalysis(null);
      } finally {
        setLoadingScore(false);
      }
    } else {
      setAnalysis(null);
    }
  }, []);

  // Run ATS analysis
  const handleAnalyze = async (resumeId) => {
    setAnalyzing(true);
    try {
      const { data } = await atsAPI.analyze(resumeId);
      setAnalysis(data.analysis);
      toast.success(`ATS Score: ${data.analysis.totalScore}/100 (${data.analysis.label})`);

      // Update local resume list with new score
      setResumes((prev) =>
        prev.map((r) =>
          r._id === resumeId
            ? { ...r, atsScore: data.analysis.totalScore, status: 'analyzed' }
            : r
        )
      );
      // Select this resume
      setSelectedResume((prev) =>
        prev?._id === resumeId
          ? { ...prev, atsScore: data.analysis.totalScore, status: 'analyzed' }
          : prev
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] gap-3">
        <Loader2 size={24} className="animate-spin" style={{ color: 'rgb(99,102,241)' }} />
        <span style={{ color: 'rgb(var(--text-muted))' }}>Loading resumes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
            ATS Analysis
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-muted))' }}>
            AI-powered resume scoring against Applicant Tracking Systems
          </p>
        </div>
        {analysis && (
          <div className="hidden sm:flex items-center gap-2">
            <ScoreBadge score={analysis.totalScore} showGrade />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* ─── Left Sidebar: Resume List ───────────────────────────── */}
        <div className="xl:col-span-1 space-y-3">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
                Your Resumes
                {resumes.length > 0 && (
                  <span className="ml-2 badge badge-primary">{resumes.length}</span>
                )}
              </h3>
              <button onClick={fetchResumes}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
                style={{ color: 'rgb(var(--text-muted))' }}>
                <RefreshCw size={13} />
              </button>
            </div>

            {resumes.length > 0 ? (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {resumes.map((r) => (
                  <ResumeCard
                    key={r._id}
                    resume={r}
                    isSelected={selectedResume?._id === r._id}
                    onSelect={handleSelect}
                    onAnalyze={handleAnalyze}
                    analyzing={analyzing}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Upload size={22} className="mx-auto mb-2" style={{ color: 'rgb(var(--text-muted))' }} />
                <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>No resumes yet</p>
                <Link href="/dashboard/upload">
                  <button className="btn-primary text-xs mt-3 px-3 py-1.5">
                    Upload First
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ─── Main Content ─────────────────────────────────────── */}
        <div className="xl:col-span-3">
          {!selectedResume || (!analysis && !loadingScore) ? (
            <EmptyState hasResumes={resumes.length > 0} />
          ) : loadingScore ? (
            <div className="flex items-center justify-center min-h-[40vh] gap-3">
              <Loader2 size={22} className="animate-spin" style={{ color: 'rgb(99,102,241)' }} />
              <span style={{ color: 'rgb(var(--text-muted))' }}>Loading analysis...</span>
            </div>
          ) : !analysis ? (
            /* Resume selected but not yet analyzed */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-5"
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.1)' }}>
                <Zap size={28} style={{ color: 'rgb(99,102,241)' }} />
              </div>
              <div>
                <h3 className="font-bold text-lg" style={{ color: 'rgb(var(--text-primary))' }}>
                  Ready to Analyze
                </h3>
                <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-muted))' }}>
                  {selectedResume.originalName}
                </p>
              </div>
              <button
                onClick={() => handleAnalyze(selectedResume._id)}
                disabled={analyzing}
                className="btn-primary"
              >
                {analyzing
                  ? <><Loader2 size={15} className="animate-spin" /> Analyzing...</>
                  : <><Zap size={15} /> Run ATS Analysis</>}
              </button>
            </motion.div>
          ) : (
            /* Analysis available — show tabs */
            <div className="space-y-5">
              {/* Tab Bar */}
              <div className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto"
                style={{ background: 'rgb(var(--bg-secondary))' }}>
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
                    style={{
                      background: activeTab === id ? 'rgb(var(--bg-primary))' : 'transparent',
                      color: activeTab === id ? 'rgb(var(--text-primary))' : 'rgb(var(--text-muted))',
                      boxShadow: activeTab === id ? '0 1px 4px rgba(0,0,0,0.2)' : 'none',
                    }}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                ))}

                {/* Re-analyze button */}
                <button
                  onClick={() => handleAnalyze(selectedResume._id)}
                  disabled={analyzing}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                  style={{ color: 'rgb(99,102,241)' }}
                >
                  {analyzing
                    ? <Loader2 size={12} className="animate-spin" />
                    : <RefreshCw size={12} />}
                  Re-analyze
                </button>

                {/* Cross-link to AI Analysis */}
                <button
                  onClick={() => router.push(`/dashboard/ai-analysis`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
                  style={{ background: 'rgba(168,85,247,0.12)', color: 'rgb(168,85,247)' }}
                >
                  <Sparkles size={12} /> AI Analysis
                </button>

                {/* Download PDF Button */}
                <DownloadReportButton analysis={analysis} resume={selectedResume} />
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div key="overview"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <OverviewTab analysis={analysis} />
                  </motion.div>
                )}

                {activeTab === 'breakdown' && (
                  <motion.div key="breakdown"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <ScoreBreakdown categories={analysis.categories} />
                  </motion.div>
                )}

                {activeTab === 'keywords' && (
                  <motion.div key="keywords"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <KeywordAnalysis analysis={analysis} />
                  </motion.div>
                )}

                {activeTab === 'tips' && (
                  <motion.div key="tips"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <Suggestions suggestions={analysis.suggestions} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
