'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, FileText, Loader2, RefreshCw, Upload,
  Zap, BriefcaseBusiness, AlertCircle, CheckCircle2,
  ChevronRight, X, Search,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { atsAPI, resumeAPI } from '@/lib/resumeAPI';
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel';
import { ScoreBadge } from '@/components/ats/ScoreGauge';

// ─── Suggested job roles ──────────────────────────────────────────────────────
const ROLE_SUGGESTIONS = [
  'Full Stack Developer', 'Frontend Developer', 'Backend Developer',
  'Software Engineer', 'Data Scientist', 'Machine Learning Engineer',
  'DevOps Engineer', 'Cloud Architect', 'Product Manager',
  'UI/UX Designer', 'Data Analyst', 'Cybersecurity Engineer',
  'Mobile Developer', 'Site Reliability Engineer', 'QA Engineer',
];

// ─── Progress steps for AI analysis ──────────────────────────────────────────
const ANALYSIS_STEPS = [
  'Parsing resume content…',
  'Detecting skills & keywords…',
  'Evaluating role fit…',
  'Generating improvement tips…',
  'Crafting professional summary…',
  'Finalising recommendations…',
];

// ─── Resume Sidebar Card ──────────────────────────────────────────────────────
function ResumeCard({ resume, isSelected, onSelect }) {
  const hasAI = !!resume.aiAnalyzedAt;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect(resume)}
      className="p-3.5 rounded-xl cursor-pointer transition-all"
      style={{
        background: isSelected ? 'rgba(168,85,247,0.1)' : 'rgb(var(--bg-primary))',
        border: `1.5px solid ${isSelected ? 'rgba(168,85,247,0.5)' : 'rgb(var(--border-color))'}`,
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: resume.fileType === 'pdf' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)' }}>
          <FileText size={15}
            style={{ color: resume.fileType === 'pdf' ? 'rgb(239,68,68)' : 'rgb(99,102,241)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'rgb(var(--text-primary))' }}>
            {resume.originalName}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs capitalize" style={{ color: 'rgb(var(--text-muted))' }}>
              {resume.status}
            </span>
            {hasAI && (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold"
                style={{ color: 'rgb(168,85,247)' }}>
                <Sparkles size={9} /> AI Ready
              </span>
            )}
          </div>
        </div>
        {resume.atsScore !== null && <ScoreBadge score={resume.atsScore} />}
      </div>
    </motion.div>
  );
}

// ─── Role Input with suggestions ─────────────────────────────────────────────
function RoleInput({ value, onChange, onClear }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  const filtered = ROLE_SUGGESTIONS.filter((r) =>
    r.toLowerCase().includes(value.toLowerCase()) && r.toLowerCase() !== value.toLowerCase()
  ).slice(0, 6);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
        style={{ background: 'rgb(var(--bg-primary))', border: '1.5px solid rgb(var(--border-color))' }}>
        <BriefcaseBusiness size={14} style={{ color: 'rgb(var(--text-muted))', flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="e.g. Senior React Developer, Data Scientist…"
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'rgb(var(--text-primary))' }}
        />
        {value && (
          <button onClick={onClear} className="p-0.5 rounded transition-colors hover:bg-white/10">
            <X size={12} style={{ color: 'rgb(var(--text-muted))' }} />
          </button>
        )}
      </div>

      {/* Autocomplete suggestions */}
      <AnimatePresence>
        {showSuggestions && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-20 w-full mt-1.5 rounded-xl overflow-hidden shadow-2xl"
            style={{ background: 'rgb(var(--bg-secondary))', border: '1px solid rgb(var(--border-color))' }}
          >
            {filtered.map((role) => (
              <button
                key={role}
                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors hover:bg-white/5"
                style={{ color: 'rgb(var(--text-secondary))' }}
                onMouseDown={() => { onChange(role); setShowSuggestions(false); }}
              >
                <Search size={11} style={{ color: 'rgb(var(--text-muted))' }} />
                {role}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Analysis Progress Overlay ────────────────────────────────────────────────
function AnalysisProgress({ step }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[40vh] gap-6 text-center"
    >
      <div className="relative">
        <div className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(168,85,247,0.1)', border: '2px solid rgba(168,85,247,0.3)' }}>
          <Sparkles size={32} style={{ color: 'rgb(168,85,247)' }} className="animate-pulse" />
        </div>
        {/* Rotating ring */}
        <div className="absolute inset-0 rounded-full border-t-2 animate-spin"
          style={{ borderColor: 'rgb(168,85,247)', borderStyle: 'solid' }} />
      </div>
      <div>
        <h3 className="font-bold text-lg" style={{ color: 'rgb(var(--text-primary))' }}>
          AI Analysis in Progress
        </h3>
        <motion.p
          key={step}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm mt-1"
          style={{ color: 'rgb(var(--text-muted))' }}
        >
          {ANALYSIS_STEPS[step % ANALYSIS_STEPS.length]}
        </motion.p>
      </div>
      <div className="flex gap-1.5">
        {ANALYSIS_STEPS.map((_, i) => (
          <div key={i}
            className="h-1 rounded-full transition-all duration-500"
            style={{
              width: i <= step ? 24 : 8,
              background: i <= step ? 'rgb(168,85,247)' : 'rgb(var(--border-color))',
            }}
          />
        ))}
      </div>
    </motion.div>
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
        style={{ background: 'rgba(168,85,247,0.1)' }}>
        <Sparkles size={36} style={{ color: 'rgb(168,85,247)' }} />
      </div>
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
          {hasResumes ? 'Select a Resume' : 'No Resumes Found'}
        </h2>
        <p className="text-sm mt-2 max-w-xs mx-auto" style={{ color: 'rgb(var(--text-muted))' }}>
          {hasResumes
            ? 'Pick a resume from the sidebar, enter a target job role, and let Gemini AI analyse your resume.'
            : 'Upload a resume first, then come back here for AI-powered analysis.'}
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AIAnalysisPage() {
  const [resumes, setResumes]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedResume, setSelectedResume] = useState(null);
  const [jobRole, setJobRole]           = useState('');
  const [analyzing, setAnalyzing]       = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [aiAnalysis, setAiAnalysis]     = useState(null);
  const [loadingStored, setLoadingStored] = useState(false);

  // Step ticker during analysis
  const stepTimerRef = useRef(null);

  const startStepTicker = () => {
    let step = 0;
    stepTimerRef.current = setInterval(() => {
      step++;
      setAnalysisStep(step);
    }, 1800);
  };

  const stopStepTicker = () => {
    clearInterval(stepTimerRef.current);
    setAnalysisStep(0);
  };

  // Load resumes on mount
  useEffect(() => {
    fetchResumes();
    return () => stopStepTicker();
  }, []);

  const fetchResumes = async () => {
    try {
      const { data } = await resumeAPI.getAll(1, 20);
      const list = data.resumes || [];
      setResumes(list);
      // Auto-select first parsed/analyzed resume
      const first = list.find((r) => ['parsed', 'analyzed'].includes(r.status));
      if (first) handleSelect(first, false);
    } catch {
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  // Select a resume and try to load its stored AI analysis
  const handleSelect = useCallback(async (resume, showToast = true) => {
    setSelectedResume(resume);
    setAiAnalysis(null);

    if (resume.aiAnalyzedAt) {
      setLoadingStored(true);
      try {
        const { data } = await atsAPI.getAIAnalysis(resume._id);
        setAiAnalysis(data.aiAnalysis);
        if (data.aiAnalysis?.targetRole) setJobRole(data.aiAnalysis.targetRole);
      } catch {
        // No stored analysis yet — that's fine
      } finally {
        setLoadingStored(false);
      }
    }
  }, []);

  // Run AI analysis
  const handleAnalyze = async () => {
    if (!selectedResume) return;

    if (!['parsed', 'analyzed'].includes(selectedResume.status)) {
      toast.error('Resume must be fully parsed before AI analysis.');
      return;
    }

    setAnalyzing(true);
    setAiAnalysis(null);
    startStepTicker();

    try {
      const { data } = await atsAPI.aiAnalyze(selectedResume._id, jobRole);
      setAiAnalysis(data.aiAnalysis);
      toast.success('✨ AI analysis complete!');

      // Mark resume as having AI analysis
      setResumes((prev) =>
        prev.map((r) =>
          r._id === selectedResume._id ? { ...r, aiAnalyzedAt: new Date().toISOString() } : r
        )
      );
    } catch (err) {
      const msg = err.response?.data?.message || 'AI analysis failed. Please try again.';
      toast.error(msg);
    } finally {
      stopStepTicker();
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] gap-3">
        <Loader2 size={22} className="animate-spin" style={{ color: 'rgb(168,85,247)' }} />
        <span style={{ color: 'rgb(var(--text-muted))' }}>Loading resumes…</span>
      </div>
    );
  }

  const canAnalyze = selectedResume && ['parsed', 'analyzed'].includes(selectedResume.status);

  return (
    <div className="space-y-6">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(168,85,247,0.15)' }}>
              <Sparkles size={16} style={{ color: 'rgb(168,85,247)' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
              AI Resume Analysis
            </h1>
          </div>
          <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
            Powered by Google Gemini · Skills, keywords, role fit & personalised improvements
          </p>
        </div>
        {aiAnalysis?.roleAnalysis && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
            <Sparkles size={12} style={{ color: 'rgb(168,85,247)' }} />
            <span className="text-sm font-semibold" style={{ color: 'rgb(168,85,247)' }}>
              Fit Score: {aiAnalysis.roleAnalysis.fitScore}/100
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* ─── Sidebar ────────────────────────────────────────────── */}
        <div className="xl:col-span-1 space-y-4">
          {/* Resume list */}
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
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {resumes.map((r) => (
                  <ResumeCard
                    key={r._id}
                    resume={r}
                    isSelected={selectedResume?._id === r._id}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Upload size={22} className="mx-auto mb-2" style={{ color: 'rgb(var(--text-muted))' }} />
                <p className="text-xs mb-3" style={{ color: 'rgb(var(--text-muted))' }}>No resumes yet</p>
                <Link href="/dashboard/upload">
                  <button className="btn-primary text-xs px-3 py-1.5">Upload First</button>
                </Link>
              </div>
            )}
          </div>

          {/* Job role input */}
          {selectedResume && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card space-y-3">
              <div>
                <h3 className="font-semibold text-sm mb-0.5" style={{ color: 'rgb(var(--text-primary))' }}>
                  Target Job Role
                </h3>
                <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                  Specify the role for context-aware analysis
                </p>
              </div>
              <RoleInput value={jobRole} onChange={setJobRole} onClear={() => setJobRole('')} />

              {/* Quick role chips */}
              <div className="flex flex-wrap gap-1.5">
                {['Full Stack Dev', 'Data Scientist', 'DevOps', 'Product Manager'].map((role) => (
                  <button
                    key={role}
                    onClick={() => setJobRole(role)}
                    className="text-[10px] font-medium px-2 py-1 rounded-lg transition-all"
                    style={{
                      background: jobRole === role ? 'rgba(168,85,247,0.15)' : 'rgb(var(--bg-primary))',
                      color: jobRole === role ? 'rgb(168,85,247)' : 'rgb(var(--text-muted))',
                      border: `1px solid ${jobRole === role ? 'rgba(168,85,247,0.4)' : 'rgb(var(--border-color))'}`,
                    }}
                  >
                    {role}
                  </button>
                ))}
              </div>

              {/* Analyze button */}
              <button
                onClick={handleAnalyze}
                disabled={analyzing || !canAnalyze}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: canAnalyze && !analyzing
                    ? 'linear-gradient(135deg, rgba(168,85,247,0.9), rgba(99,102,241,0.9))'
                    : 'rgb(var(--bg-primary))',
                  color: canAnalyze && !analyzing ? '#fff' : 'rgb(var(--text-muted))',
                  cursor: canAnalyze && !analyzing ? 'pointer' : 'not-allowed',
                  boxShadow: canAnalyze && !analyzing ? '0 4px 20px rgba(168,85,247,0.35)' : 'none',
                }}
              >
                {analyzing ? (
                  <><Loader2 size={15} className="animate-spin" /> Analysing…</>
                ) : (
                  <><Sparkles size={15} /> Run AI Analysis</>
                )}
              </button>

              {!canAnalyze && selectedResume && (
                <p className="text-[11px] text-center" style={{ color: 'rgb(var(--text-muted))' }}>
                  Resume must be fully parsed to analyse
                </p>
              )}
            </motion.div>
          )}

          {/* Cross-link to ATS */}
          <div className="card p-3">
            <p className="text-xs mb-2" style={{ color: 'rgb(var(--text-muted))' }}>Also available</p>
            <Link href="/dashboard/ats">
              <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all hover:bg-white/5"
                style={{ color: 'rgb(var(--text-secondary))', border: '1px solid rgb(var(--border-color))' }}>
                <span>📊 ATS Score & Breakdown</span>
                <ChevronRight size={12} />
              </button>
            </Link>
          </div>
        </div>

        {/* ─── Main Content ────────────────────────────────────────── */}
        <div className="xl:col-span-3">
          <AnimatePresence mode="wait">
            {analyzing ? (
              <motion.div key="progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AnalysisProgress step={analysisStep} />
              </motion.div>
            ) : loadingStored ? (
              <div className="flex items-center justify-center min-h-[40vh] gap-3">
                <Loader2 size={22} className="animate-spin" style={{ color: 'rgb(168,85,247)' }} />
                <span style={{ color: 'rgb(var(--text-muted))' }}>Loading analysis…</span>
              </div>
            ) : aiAnalysis ? (
              <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <AIAnalysisPanel aiAnalysis={aiAnalysis} />
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EmptyState hasResumes={resumes.length > 0} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
