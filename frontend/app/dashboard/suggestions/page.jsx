'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb, Loader2, Upload, RefreshCw, FileText,
  ChevronDown, Zap, Target, CheckCircle2, Filter, ArrowUpDown, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { resumeAPI, atsAPI } from '@/lib/resumeAPI';

const PRIORITY_CONFIG = {
  high:   { label: 'High',   color: 'rgb(239,68,68)',   bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',   dot: 'rgb(239,68,68)' },
  medium: { label: 'Medium', color: 'rgb(251,191,36)',  bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)',  dot: 'rgb(251,191,36)' },
  low:    { label: 'Low',    color: 'rgb(34,197,94)',   bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)',   dot: 'rgb(34,197,94)' },
};

function getPriority(impact) {
  if (impact >= 5) return 'high';
  if (impact >= 3) return 'medium';
  return 'low';
}

function SuggestionCard({ suggestion, index, done, onToggle, source }) {
  const priority = suggestion.priority || getPriority(suggestion.impact || suggestion.score || 3);
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-start gap-3 p-4 rounded-2xl transition-all ${done ? 'opacity-50' : ''}`}
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(suggestion.tip || suggestion.title || `s_${index}`)}
        className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
        style={{
          borderColor: done ? cfg.color : cfg.border,
          background: done ? cfg.bg : 'transparent',
        }}
      >
        {done && <CheckCircle2 size={12} style={{ color: cfg.color }} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
          <p className={`text-sm font-medium leading-relaxed ${done ? 'line-through' : ''}`}
            style={{ color: 'rgb(var(--text-primary))' }}>
            {suggestion.tip || suggestion.title || suggestion.description}
          </p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
              {cfg.label}
            </span>
            {(suggestion.impact || suggestion.score) && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: cfg.bg, color: cfg.color }}>
                +{suggestion.impact || suggestion.score}
              </span>
            )}
          </div>
        </div>
        <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
          {suggestion.category || suggestion.example || source}
          {suggestion.category && suggestion.impact ? ` · +${suggestion.impact} pts potential` : ''}
        </p>
        {suggestion.example && suggestion.category !== suggestion.example && (
          <p className="text-xs mt-1.5 pl-2 italic border-l-2" style={{ color: 'rgb(var(--text-muted))', borderColor: `${cfg.color}60` }}>
            {suggestion.example}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function ResumeSelector({ resumes, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
        style={{ background: 'rgb(var(--bg-secondary))', border: '1px solid rgb(var(--border-color))', color: 'rgb(var(--text-primary))' }}>
        <FileText size={14} style={{ color: 'rgb(99,102,241)' }} />
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
                style={{ color: selected?._id === r._id ? 'rgb(99,102,241)' : 'rgb(var(--text-secondary))' }}>
                <FileText size={13} />
                <span className="truncate flex-1">{r.originalName}</span>
                {r.atsScore !== null && (
                  <span className="text-xs font-bold" style={{ color: 'rgb(99,102,241)' }}>{r.atsScore}</span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SuggestionsPage() {
  const [resumes, setResumes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [atsSuggestions, setAtsSuggestions] = useState([]);
  const [aiTips, setAiTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('impact');
  const [done, setDone] = useState(new Set());

  useEffect(() => { fetchResumes(); }, []);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const { data } = await resumeAPI.getAll(1, 20);
      const list = data.resumes || [];
      setResumes(list);
      const best = list.find((r) => r.atsScore !== null) || list[0];
      if (best) handleSelect(best);
    } catch { toast.error('Failed to load resumes'); }
    finally { setLoading(false); }
  };

  const handleSelect = async (resume) => {
    setSelected(resume);
    setAtsSuggestions([]);
    setAiTips([]);
    setDone(new Set());
    setLoadingData(true);
    try {
      const promises = [];
      if (resume.atsScore !== null) {
        promises.push(
          atsAPI.getScore(resume._id)
            .then((r) => setAtsSuggestions(r.data.analysis?.suggestions || []))
            .catch(() => {})
        );
      }
      if (resume.aiAnalyzedAt) {
        promises.push(
          atsAPI.getAIAnalysis(resume._id)
            .then((r) => setAiTips(r.data.aiAnalysis?.improvementTips || []))
            .catch(() => {})
        );
      }
      await Promise.all(promises);
    } finally { setLoadingData(false); }
  };

  const toggleDone = (id) => {
    setDone((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Combine suggestions with source tag
  const allSuggestions = [
    ...atsSuggestions.map((s) => ({ ...s, _source: 'ATS' })),
    ...aiTips.map((s) => ({ ...s, _source: 'AI', priority: s.impact >= 8 ? 'high' : s.impact >= 5 ? 'medium' : 'low' })),
  ];

  const filtered = allSuggestions
    .filter((s) => {
      const priority = s.priority || getPriority(s.impact || 3);
      return priorityFilter === 'all' || priority === priorityFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'impact') return (b.impact || 3) - (a.impact || 3);
      if (sortBy === 'priority') {
        const order = { high: 0, medium: 1, low: 2 };
        const pa = s => order[s.priority || getPriority(s.impact || 3)] ?? 1;
        return pa(a) - pa(b);
      }
      return 0;
    });

  const doneCount = done.size;
  const totalPotential = allSuggestions.reduce((sum, s) => sum + (s.impact || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={24} className="animate-spin" style={{ color: 'rgb(251,191,36)' }} />
        <span style={{ color: 'rgb(var(--text-muted))' }}>Loading suggestions...</span>
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
              <Lightbulb size={16} style={{ color: 'rgb(251,191,36)' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>AI Suggestions</h1>
          </div>
          <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
            Actionable improvements to boost your ATS score · {allSuggestions.length} suggestions
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
            <Lightbulb size={36} style={{ color: 'rgb(251,191,36)' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>No Suggestions Yet</h2>
            <p className="text-sm mt-2 max-w-sm mx-auto" style={{ color: 'rgb(var(--text-muted))' }}>
              Upload a resume and run ATS Analysis to get personalized improvement suggestions.
            </p>
          </div>
          <Link href="/dashboard/upload"><button className="btn-primary"><Upload size={15} /> Upload Resume</button></Link>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {/* Progress bar */}
          {allSuggestions.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="card"
              style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap size={14} style={{ color: 'rgb(251,191,36)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
                    Progress: {doneCount}/{allSuggestions.length} completed
                  </span>
                </div>
                {totalPotential > 0 && (
                  <span className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                    Up to +{totalPotential} pts potential
                  </span>
                )}
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${allSuggestions.length > 0 ? (doneCount / allSuggestions.length) * 100 : 0}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, rgb(251,191,36), rgb(34,197,94))' }}
                />
              </div>
            </motion.div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgb(var(--bg-secondary))' }}>
              {['all', 'high', 'medium', 'low'].map((p) => {
                const cfg = PRIORITY_CONFIG[p];
                return (
                  <button key={p} onClick={() => setPriorityFilter(p)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
                    style={{
                      background: priorityFilter === p ? (cfg?.bg || 'rgb(var(--bg-primary))') : 'transparent',
                      color: priorityFilter === p ? (cfg?.color || 'rgb(var(--text-primary))') : 'rgb(var(--text-muted))',
                    }}>
                    {p === 'all' ? 'All' : p}
                    {p !== 'all' && (
                      <span className="ml-1">
                        ({allSuggestions.filter((s) => (s.priority || getPriority(s.impact || 3)) === p).length})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setSortBy((p) => p === 'impact' ? 'priority' : 'impact')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ml-auto"
              style={{ background: 'rgb(var(--bg-secondary))', color: 'rgb(var(--text-muted))', border: '1px solid rgb(var(--border-color))' }}>
              <ArrowUpDown size={12} /> Sort by {sortBy === 'impact' ? 'priority' : 'impact'}
            </button>
          </div>

          {loadingData ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <Loader2 size={20} className="animate-spin" style={{ color: 'rgb(251,191,36)' }} />
              <span style={{ color: 'rgb(var(--text-muted))' }}>Loading suggestions...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card text-center py-10">
              {allSuggestions.length > 0 ? (
                <>
                  <Filter size={24} className="mx-auto mb-2" style={{ color: 'rgb(var(--text-muted))' }} />
                  <p style={{ color: 'rgb(var(--text-muted))' }}>No {priorityFilter} priority suggestions</p>
                </>
              ) : (
                <>
                  <Target size={28} className="mx-auto mb-3" style={{ color: 'rgb(var(--text-muted))' }} />
                  <p className="font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>No suggestions available</p>
                  <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-muted))' }}>
                    Run ATS Analysis or AI Analysis on this resume to get suggestions.
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Link href="/dashboard/ats">
                      <button className="text-sm px-3 py-2 rounded-xl font-medium"
                        style={{ background: 'rgba(99,102,241,0.1)', color: 'rgb(99,102,241)' }}>
                        ATS Analysis
                      </button>
                    </Link>
                    <Link href="/dashboard/ai-analysis">
                      <button className="text-sm px-3 py-2 rounded-xl font-medium"
                        style={{ background: 'rgba(168,85,247,0.1)', color: 'rgb(168,85,247)' }}>
                        <Sparkles size={13} className="inline mr-1" />AI Analysis
                      </button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map((s, i) => {
                const id = s.tip || s.title || `s_${i}`;
                return (
                  <SuggestionCard
                    key={id + i}
                    suggestion={s}
                    index={i}
                    done={done.has(id)}
                    onToggle={toggleDone}
                    source={s._source}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
