'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Code2, Users, Wrench, Loader2, Upload, RefreshCw,
  FileText, Search, ChevronDown, Sparkles, Target
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { resumeAPI, atsAPI } from '@/lib/resumeAPI';

const SKILL_CATEGORIES = [
  { key: 'technical', label: 'Technical Skills', icon: Code2, color: 'rgb(34,211,238)', bg: 'rgba(34,211,238,0.1)' },
  { key: 'soft',      label: 'Soft Skills',      icon: Users, color: 'rgb(168,85,247)', bg: 'rgba(168,85,247,0.1)' },
  { key: 'tools',     label: 'Tools & Platforms', icon: Wrench, color: 'rgb(251,191,36)', bg: 'rgba(251,191,36,0.1)' },
];

function ResumeSelector({ resumes, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
        style={{ background: 'rgb(var(--bg-secondary))', border: '1px solid rgb(var(--border-color))', color: 'rgb(var(--text-primary))' }}
      >
        <FileText size={14} style={{ color: 'rgb(99,102,241)' }} />
        <span className="max-w-[200px] truncate">{selected?.originalName || 'Select Resume'}</span>
        <ChevronDown size={13} style={{ color: 'rgb(var(--text-muted))' }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 mt-1.5 z-20 rounded-xl overflow-hidden shadow-2xl min-w-[260px]"
            style={{ background: 'rgb(var(--bg-secondary))', border: '1px solid rgb(var(--border-color))' }}
          >
            {resumes.map((r) => (
              <button key={r._id} onClick={() => { onSelect(r); setOpen(false); }}
                className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 transition-colors hover:bg-white/5"
                style={{ color: selected?._id === r._id ? 'rgb(99,102,241)' : 'rgb(var(--text-secondary))' }}>
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

function SkillTag({ skill, color, bg, index }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.025 }}
      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
      style={{ background: bg, color }}
    >
      {skill}
    </motion.span>
  );
}

function CategorySection({ category, skills, searchQuery }) {
  const { key, label, icon: Icon, color, bg } = category;
  const items = (skills[key] || []).filter((s) =>
    !searchQuery || s.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!items.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
            <Icon size={16} style={{ color }} />
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'rgb(var(--text-primary))' }}>{label}</h3>
            <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>{items.length} detected</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
          style={{ background: bg, color }}>
          {items.length}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((skill, i) => (
          <SkillTag key={skill} skill={skill} color={color} bg={bg} index={i} />
        ))}
      </div>
    </motion.div>
  );
}

function AtsSkillMatch({ analysis }) {
  if (!analysis) return null;
  const kw = analysis.categories?.find((c) => c.category === 'Keyword & Skills');
  if (!kw) return null;

  const detected = kw.detectedSkills || [];
  const found = kw.foundKeywords || [];
  const matchPct = kw.percentage || 0;
  const matchColor = matchPct >= 80 ? 'rgb(34,197,94)' : matchPct >= 60 ? 'rgb(99,102,241)' : matchPct >= 40 ? 'rgb(251,191,36)' : 'rgb(239,68,68)';

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Target size={15} style={{ color: 'rgb(99,102,241)' }} />
        <h3 className="font-semibold text-sm" style={{ color: 'rgb(var(--text-primary))' }}>ATS Keyword Match</h3>
      </div>
      {/* Match ring */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
            <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <circle cx="32" cy="32" r="26" fill="none" stroke={matchColor} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 26}`}
              strokeDashoffset={`${2 * Math.PI * 26 * (1 - matchPct / 100)}`}
              style={{ transition: 'stroke-dashoffset 1s ease' }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold" style={{ color: matchColor }}>{matchPct}%</span>
          </div>
        </div>
        <div>
          <p className="font-semibold" style={{ color: matchColor }}>
            {matchPct >= 80 ? 'Strong Match' : matchPct >= 60 ? 'Good Match' : matchPct >= 40 ? 'Partial Match' : 'Low Match'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>
            {kw.score}/{kw.weight} keyword score
          </p>
        </div>
      </div>

      {detected.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgb(34,211,238)' }}>
            Detected Technical Skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {detected.map((s, i) => (
              <span key={i} className="px-2 py-1 rounded-lg text-xs font-medium"
                style={{ background: 'rgba(34,211,238,0.1)', color: 'rgb(34,211,238)' }}>{s}</span>
            ))}
          </div>
        </div>
      )}
      {found.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgb(34,197,94)' }}>
            Industry Keywords Found
          </p>
          <div className="flex flex-wrap gap-1.5">
            {found.map((s, i) => (
              <span key={i} className="px-2 py-1 rounded-lg text-xs font-medium"
                style={{ background: 'rgba(34,197,94,0.1)', color: 'rgb(34,197,94)' }}>{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SkillsPage() {
  const [resumes, setResumes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [atsAnalysis, setAtsAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => { fetchResumes(); }, []);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const { data } = await resumeAPI.getAll(1, 20);
      const list = data.resumes || [];
      setResumes(list);
      // Auto-select first with AI analysis, else first analyzed
      const withAI = list.find((r) => r.aiAnalyzedAt);
      const analyzed = list.find((r) => r.atsScore !== null);
      const toSelect = withAI || analyzed || list[0];
      if (toSelect) handleSelect(toSelect);
    } catch {
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (resume) => {
    setSelected(resume);
    setAiAnalysis(null);
    setAtsAnalysis(null);
    setLoadingData(true);
    try {
      const promises = [];
      if (resume.aiAnalyzedAt) promises.push(atsAPI.getAIAnalysis(resume._id).then((r) => setAiAnalysis(r.data.aiAnalysis)).catch(() => {}));
      if (resume.atsScore !== null) promises.push(atsAPI.getScore(resume._id).then((r) => setAtsAnalysis(r.data.analysis)).catch(() => {}));
      await Promise.all(promises);
    } finally {
      setLoadingData(false);
    }
  };

  const skills = aiAnalysis?.detectedSkills || {};
  const totalSkills = Object.values(skills).flat().length;

  const filteredCategories = activeFilter === 'all'
    ? SKILL_CATEGORIES
    : SKILL_CATEGORIES.filter((c) => c.key === activeFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={24} className="animate-spin" style={{ color: 'rgb(168,85,247)' }} />
        <span style={{ color: 'rgb(var(--text-muted))' }}>Loading skills...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.15)' }}>
              <Brain size={16} style={{ color: 'rgb(168,85,247)' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>Skills Analysis</h1>
          </div>
          <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
            AI-detected skills from your resume · {totalSkills} skills found
          </p>
        </div>
        <div className="flex items-center gap-2">
          {resumes.length > 0 && <ResumeSelector resumes={resumes} selected={selected} onSelect={handleSelect} />}
          <button onClick={fetchResumes} className="p-2 rounded-xl hover:bg-white/5 transition-colors"
            style={{ color: 'rgb(var(--text-muted))' }}>
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {resumes.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-5">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.1)' }}>
            <Brain size={36} style={{ color: 'rgb(168,85,247)' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>No Skills Data</h2>
            <p className="text-sm mt-2 max-w-sm mx-auto" style={{ color: 'rgb(var(--text-muted))' }}>
              Upload a resume and run AI Analysis to detect your skills.
            </p>
          </div>
          <Link href="/dashboard/upload">
            <button className="btn-primary"><Upload size={15} /> Upload Resume</button>
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[200px]"
              style={{ background: 'rgb(var(--bg-secondary))', border: '1px solid rgb(var(--border-color))' }}>
              <Search size={13} style={{ color: 'rgb(var(--text-muted))' }} />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skills..." className="bg-transparent text-sm outline-none flex-1"
                style={{ color: 'rgb(var(--text-primary))' }} />
            </div>
            {/* Filter tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgb(var(--bg-secondary))' }}>
              {[{ key: 'all', label: 'All' }, ...SKILL_CATEGORIES.map((c) => ({ key: c.key, label: c.label.split(' ')[0] }))].map(({ key, label }) => (
                <button key={key} onClick={() => setActiveFilter(key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: activeFilter === key ? 'rgb(var(--bg-primary))' : 'transparent',
                    color: activeFilter === key ? 'rgb(var(--text-primary))' : 'rgb(var(--text-muted))',
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loadingData ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <Loader2 size={20} className="animate-spin" style={{ color: 'rgb(168,85,247)' }} />
              <span style={{ color: 'rgb(var(--text-muted))' }}>Loading skills data...</span>
            </div>
          ) : !aiAnalysis ? (
            <div className="card text-center py-12">
              <Sparkles size={28} className="mx-auto mb-3" style={{ color: 'rgb(168,85,247)' }} />
              <p className="font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>AI Analysis Required</p>
              <p className="text-sm mt-1 max-w-sm mx-auto" style={{ color: 'rgb(var(--text-muted))' }}>
                Run AI Analysis on this resume to detect skills with Gemini AI.
              </p>
              <Link href="/dashboard/ai-analysis">
                <button className="btn-primary mt-4 text-sm">
                  <Sparkles size={14} /> Run AI Analysis
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Skills by category */}
              <div className="lg:col-span-2 space-y-4">
                {totalSkills === 0 ? (
                  <div className="card text-center py-8">
                    <p style={{ color: 'rgb(var(--text-muted))' }}>No skills detected in this resume.</p>
                  </div>
                ) : (
                  filteredCategories.map((cat) => (
                    <CategorySection key={cat.key} category={cat} skills={skills} searchQuery={searchQuery} />
                  ))
                )}
              </div>
              {/* ATS Match sidebar */}
              <div className="space-y-4">
                <AtsSkillMatch analysis={atsAnalysis} />
                {/* Total skill count card */}
                <div className="card">
                  <h3 className="font-semibold text-sm mb-3" style={{ color: 'rgb(var(--text-primary))' }}>Skill Summary</h3>
                  <div className="space-y-2">
                    {SKILL_CATEGORIES.map((cat) => {
                      const count = (skills[cat.key] || []).length;
                      return (
                        <div key={cat.key} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: cat.bg }}>
                              <cat.icon size={11} style={{ color: cat.color }} />
                            </div>
                            <span className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>{cat.label}</span>
                          </div>
                          <span className="text-xs font-bold" style={{ color: cat.color }}>{count}</span>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgb(var(--border-color))' }}>
                      <span className="text-xs font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>Total</span>
                      <span className="text-xs font-bold" style={{ color: 'rgb(99,102,241)' }}>{totalSkills}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
