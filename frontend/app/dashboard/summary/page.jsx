'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Sparkles, Copy, CheckCircle2, Loader2, Upload,
  RefreshCw, FileText, ChevronDown, Target, Zap, Brain,
  BriefcaseBusiness, X, RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { resumeAPI, atsAPI } from '@/lib/resumeAPI';

const ROLE_SUGGESTIONS = [
  'Full Stack Developer', 'Frontend Developer', 'Backend Developer',
  'Software Engineer', 'Data Scientist', 'Machine Learning Engineer',
  'DevOps Engineer', 'Cloud Architect', 'Product Manager',
  'UI/UX Designer', 'Data Analyst', 'Mobile Developer',
];

function ResumeSelector({ resumes, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
        style={{ background: 'rgb(var(--bg-secondary))', border: '1px solid rgb(var(--border-color))', color: 'rgb(var(--text-primary))' }}>
        <FileText size={14} style={{ color: 'rgb(251,191,36)' }} />
        <span className="max-w-[200px] truncate">{selected?.originalName || 'Select Resume'}</span>
        <ChevronDown size={13} style={{ color: 'rgb(var(--text-muted))' }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 mt-1.5 z-20 rounded-xl overflow-hidden shadow-2xl min-w-[260px]"
            style={{ background: 'rgb(var(--bg-secondary))', border: '1px solid rgb(var(--border-color))' }}>
            {resumes.map((r) => (
              <button key={r._id} onClick={() => { onSelect(r); setOpen(false); }}
                className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 transition-colors hover:bg-white/5"
                style={{ color: selected?._id === r._id ? 'rgb(251,191,36)' : 'rgb(var(--text-secondary))' }}>
                <FileText size={13} />
                <span className="truncate flex-1">{r.originalName}</span>
                {r.aiAnalyzedAt && <Sparkles size={11} style={{ color: 'rgb(168,85,247)', flexShrink: 0 }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SummaryDisplay({ summary, jobRole, fitData, onRegenerate, regenerating }) {
  const [copied, setCopied] = useState(false);
  const [variant, setVariant] = useState('professional'); // professional | linkedin | brief

  const variants = {
    professional: summary,
    linkedin: summary ? `💼 ${summary}` : null,
    brief: summary ? summary.split('. ').slice(0, 2).join('. ') + '.' : null,
  };

  const currentText = variants[variant] || summary;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    toast.success('Summary copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const fitColor = fitData?.fitScore >= 80 ? '#22c55e' : fitData?.fitScore >= 60 ? '#3b82f6' : fitData?.fitScore >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="space-y-4">
      {/* Fit Score banner */}
      {fitData && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-4 p-4 rounded-2xl"
          style={{ background: `${fitColor}10`, border: `1px solid ${fitColor}25` }}>
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
              <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
              <circle cx="28" cy="28" r="22" fill="none" stroke={fitColor} strokeWidth="5" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 22}`}
                strokeDashoffset={`${2 * Math.PI * 22 * (1 - (fitData.fitScore || 0) / 100)}`}
                style={{ transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold" style={{ color: fitColor }}>{fitData.fitScore}</span>
            </div>
          </div>
          <div>
            <p className="font-bold" style={{ color: fitColor }}>{fitData.fitLabel}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>
              for <span style={{ color: 'rgb(var(--text-primary))' }}>{fitData.targetRole || jobRole || 'General Role'}</span>
            </p>
            {fitData.verdict && (
              <p className="text-xs mt-1 max-w-md leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
                {fitData.verdict}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Summary card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain size={15} style={{ color: 'rgb(168,85,247)' }} />
            <h3 className="font-semibold text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
              AI-Generated Professional Summary
            </h3>
          </div>
          {/* Variant switcher */}
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgb(var(--bg-tertiary))' }}>
            {['professional', 'linkedin', 'brief'].map((v) => (
              <button key={v} onClick={() => setVariant(v)}
                className="px-2 py-1 rounded-md text-[11px] font-medium transition-all capitalize"
                style={{
                  background: variant === v ? 'rgb(var(--bg-secondary))' : 'transparent',
                  color: variant === v ? 'rgb(var(--text-primary))' : 'rgb(var(--text-muted))',
                }}>
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="relative rounded-2xl p-5 mb-4"
          style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.15)' }}>
          <span className="absolute top-2 left-3 text-3xl font-serif leading-none" style={{ color: 'rgba(168,85,247,0.3)' }}>"</span>
          <p className="px-5 text-sm leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
            {currentText}
          </p>
          <span className="absolute bottom-1 right-4 text-3xl font-serif leading-none" style={{ color: 'rgba(168,85,247,0.3)' }}>"</span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
            style={{ background: copied ? 'rgba(34,197,94,0.1)' : 'rgba(168,85,247,0.1)', color: copied ? 'rgb(34,197,94)' : 'rgb(168,85,247)' }}>
            <Copy size={11} /> {copied ? 'Copied!' : 'Copy summary'}
          </button>
          <button onClick={onRegenerate} disabled={regenerating}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
            style={{ background: 'rgb(var(--bg-secondary))', color: 'rgb(var(--text-muted))' }}>
            {regenerating ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
            {regenerating ? 'Regenerating...' : 'Regenerate'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SummaryPage() {
  const [resumes, setResumes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [jobRole, setJobRole] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => { fetchResumes(); }, []);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const { data } = await resumeAPI.getAll(1, 20);
      const list = data.resumes || [];
      setResumes(list);
      const withAI = list.find((r) => r.aiAnalyzedAt);
      const toSelect = withAI || list.find((r) => ['parsed', 'analyzed'].includes(r.status)) || list[0];
      if (toSelect) handleSelect(toSelect);
    } catch { toast.error('Failed to load resumes'); }
    finally { setLoading(false); }
  };

  const handleSelect = async (resume) => {
    setSelected(resume);
    setAiAnalysis(null);
    if (!resume.aiAnalyzedAt) return;
    setLoadingData(true);
    try {
      const { data } = await atsAPI.getAIAnalysis(resume._id);
      setAiAnalysis(data.aiAnalysis);
      if (data.aiAnalysis?.targetRole) setJobRole(data.aiAnalysis.targetRole);
    } catch { }
    finally { setLoadingData(false); }
  };

  const handleRegenerate = async () => {
    if (!selected) return;
    if (!['parsed', 'analyzed'].includes(selected.status)) {
      toast.error('Resume must be fully parsed');
      return;
    }
    setRegenerating(true);
    try {
      const { data } = await atsAPI.aiAnalyze(selected._id, jobRole);
      setAiAnalysis(data.aiAnalysis);
      toast.success('✨ Summary regenerated!');
      setResumes((prev) => prev.map((r) => r._id === selected._id ? { ...r, aiAnalyzedAt: new Date().toISOString() } : r));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Regeneration failed');
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={24} className="animate-spin" style={{ color: 'rgb(251,191,36)' }} />
        <span style={{ color: 'rgb(var(--text-muted))' }}>Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.15)' }}>
              <Star size={16} style={{ color: 'rgb(251,191,36)' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>AI Summary Generator</h1>
          </div>
          <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
            AI-crafted professional summaries · Powered by Google Gemini
          </p>
        </div>
        <div className="flex items-center gap-2">
          {resumes.length > 0 && <ResumeSelector resumes={resumes} selected={selected} onSelect={handleSelect} />}
          <button onClick={fetchResumes} className="p-2 rounded-xl hover:bg-white/5 transition-colors"
            style={{ color: 'rgb(var(--text-muted))' }}><RefreshCw size={15} /></button>
        </div>
      </div>

      {resumes.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-5">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.1)' }}>
            <Star size={36} style={{ color: 'rgb(251,191,36)' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>No Resumes Found</h2>
            <p className="text-sm mt-2 max-w-sm mx-auto" style={{ color: 'rgb(var(--text-muted))' }}>
              Upload a resume and run AI Analysis to generate professional summaries.
            </p>
          </div>
          <Link href="/dashboard/upload"><button className="btn-primary"><Upload size={15} /> Upload Resume</button></Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="space-y-4">
            {/* Job role input */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <BriefcaseBusiness size={14} style={{ color: 'rgb(var(--text-muted))' }} />
                <h3 className="font-semibold text-sm" style={{ color: 'rgb(var(--text-primary))' }}>Target Role</h3>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  placeholder="e.g. Full Stack Developer"
                  className="input-field pr-8 text-sm"
                />
                {jobRole && (
                  <button onClick={() => setJobRole('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors hover:bg-white/10"
                    style={{ color: 'rgb(var(--text-muted))' }}>
                    <X size={12} />
                  </button>
                )}
              </div>
              {/* Role chips */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {ROLE_SUGGESTIONS.slice(0, 6).map((role) => (
                  <button key={role} onClick={() => setJobRole(role)}
                    className="text-[10px] font-medium px-2 py-1 rounded-lg transition-all"
                    style={{
                      background: jobRole === role ? 'rgba(251,191,36,0.15)' : 'rgb(var(--bg-tertiary))',
                      color: jobRole === role ? 'rgb(251,191,36)' : 'rgb(var(--text-muted))',
                      border: `1px solid ${jobRole === role ? 'rgba(251,191,36,0.4)' : 'transparent'}`,
                    }}>
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={handleRegenerate}
              disabled={regenerating || !selected}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: selected && !regenerating
                  ? 'linear-gradient(135deg, rgba(251,191,36,0.9), rgba(168,85,247,0.8))'
                  : 'rgb(var(--bg-secondary))',
                color: selected && !regenerating ? '#fff' : 'rgb(var(--text-muted))',
                boxShadow: selected && !regenerating ? '0 4px 20px rgba(251,191,36,0.3)' : 'none',
                cursor: selected && !regenerating ? 'pointer' : 'not-allowed',
              }}
            >
              {regenerating ? (
                <><Loader2 size={15} className="animate-spin" /> Generating...</>
              ) : (
                <><Sparkles size={15} /> {aiAnalysis ? 'Regenerate' : 'Generate'} Summary</>
              )}
            </button>

            {/* Cross-links */}
            <div className="card p-3 space-y-2">
              <p className="text-xs font-semibold" style={{ color: 'rgb(var(--text-muted))' }}>More AI Features</p>
              <Link href="/dashboard/ai-analysis">
                <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all hover:bg-white/5"
                  style={{ color: 'rgb(var(--text-secondary))', border: '1px solid rgb(var(--border-color))' }}>
                  <span><Sparkles size={11} className="inline mr-1" style={{ color: 'rgb(168,85,247)' }} />Full AI Analysis</span>
                  <Target size={11} />
                </button>
              </Link>
              <Link href="/dashboard/skills">
                <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all hover:bg-white/5"
                  style={{ color: 'rgb(var(--text-secondary))', border: '1px solid rgb(var(--border-color))' }}>
                  <span><Brain size={11} className="inline mr-1" style={{ color: 'rgb(34,211,238)' }} />Skills Analysis</span>
                  <Target size={11} />
                </button>
              </Link>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {loadingData ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center justify-center min-h-[40vh] gap-3">
                  <Loader2 size={22} className="animate-spin" style={{ color: 'rgb(251,191,36)' }} />
                  <span style={{ color: 'rgb(var(--text-muted))' }}>Loading summary...</span>
                </motion.div>
              ) : aiAnalysis?.professionalSummary ? (
                <motion.div key="summary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <SummaryDisplay
                    summary={aiAnalysis.professionalSummary}
                    jobRole={aiAnalysis.targetRole || jobRole}
                    fitData={aiAnalysis.roleAnalysis}
                    onRegenerate={handleRegenerate}
                    regenerating={regenerating}
                  />
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-5">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(168,85,247,0.1)' }}>
                    <Sparkles size={28} style={{ color: 'rgb(168,85,247)' }} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: 'rgb(var(--text-primary))' }}>
                      {selected ? 'Generate Your Summary' : 'Select a Resume'}
                    </h3>
                    <p className="text-sm mt-1 max-w-xs mx-auto" style={{ color: 'rgb(var(--text-muted))' }}>
                      {selected
                        ? 'Click "Generate Summary" to create a professional AI-written summary for your resume.'
                        : 'Choose a resume from the dropdown to get started.'}
                    </p>
                  </div>
                  {selected && !regenerating && (
                    <button onClick={handleRegenerate}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.9), rgba(168,85,247,0.8))', color: '#fff', boxShadow: '0 4px 20px rgba(251,191,36,0.3)' }}>
                      <Sparkles size={14} /> Generate Summary
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
