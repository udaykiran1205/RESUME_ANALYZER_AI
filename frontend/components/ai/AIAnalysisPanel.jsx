'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Copy, CheckCircle, XCircle, AlertTriangle,
  ChevronDown, ChevronUp, Zap, Target, Brain, BookOpen,
  TrendingUp, Star, ArrowRight, Lightbulb, Code2, Users, Wrench,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PRIORITY_STYLES = {
  high:   { color: 'rgb(239,68,68)',   bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',   label: 'High' },
  medium: { color: 'rgb(251,191,36)',  bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)',  label: 'Medium' },
  low:    { color: 'rgb(34,197,94)',   bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)',   label: 'Low' },
};

const FIT_COLORS = {
  'Excellent Fit': '#22c55e',
  'Good Fit':      '#3b82f6',
  'Partial Fit':   '#f59e0b',
  'Needs Work':    '#f97316',
  'Poor Fit':      '#ef4444',
};

function PriorityBadge({ priority }) {
  const s = PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium;
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  );
}

function SectionCard({ icon: Icon, iconColor, iconBg, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgb(var(--bg-secondary))', border: '1px solid rgb(var(--border-color))' }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
            <Icon size={15} style={{ color: iconColor }} />
          </div>
          <span className="font-semibold text-sm" style={{ color: 'rgb(var(--text-primary))' }}>{title}</span>
        </div>
        {open ? <ChevronUp size={14} style={{ color: 'rgb(var(--text-muted))' }} /> : <ChevronDown size={14} style={{ color: 'rgb(var(--text-muted))' }} />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── 1. Professional Summary ──────────────────────────────────────────────────
function ProfessionalSummary({ summary }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success('Summary copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SectionCard icon={Brain} iconColor="rgb(168,85,247)" iconBg="rgba(168,85,247,0.1)" title="AI-Generated Professional Summary">
      <div
        className="relative rounded-xl p-4 text-sm leading-relaxed"
        style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.15)', color: 'rgb(var(--text-secondary))' }}
      >
        {/* Decorative quotes */}
        <span className="absolute top-2 left-3 text-3xl font-serif leading-none" style={{ color: 'rgba(168,85,247,0.3)' }}>"</span>
        <p className="px-4">{summary}</p>
        <span className="absolute bottom-1 right-4 text-3xl font-serif leading-none" style={{ color: 'rgba(168,85,247,0.3)' }}>"</span>
      </div>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all mt-1"
        style={{ background: copied ? 'rgba(34,197,94,0.1)' : 'rgba(168,85,247,0.1)', color: copied ? 'rgb(34,197,94)' : 'rgb(168,85,247)' }}
      >
        <Copy size={11} /> {copied ? 'Copied!' : 'Copy to clipboard'}
      </button>
    </SectionCard>
  );
}

// ─── 2. Skills Detection ──────────────────────────────────────────────────────
function SkillsDetection({ skills }) {
  const categories = [
    { key: 'technical', label: 'Technical Skills', icon: Code2, color: 'rgb(34,211,238)', bg: 'rgba(34,211,238,0.1)' },
    { key: 'soft',      label: 'Soft Skills',      icon: Users, color: 'rgb(168,85,247)',  bg: 'rgba(168,85,247,0.1)' },
    { key: 'tools',     label: 'Tools & Platforms', icon: Wrench, color: 'rgb(251,191,36)', bg: 'rgba(251,191,36,0.1)' },
  ];

  const totalSkills = Object.values(skills).flat().length;

  return (
    <SectionCard icon={Code2} iconColor="rgb(34,211,238)" iconBg="rgba(34,211,238,0.1)" title={`Skills Detected (${totalSkills} total)`}>
      {categories.map(({ key, label, icon: Icon, color, bg }) => {
        const items = skills[key] || [];
        if (!items.length) return null;
        return (
          <div key={key}>
            <div className="flex items-center gap-1.5 mb-2">
              <Icon size={11} style={{ color }} />
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
                {label} ({items.length})
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {items.map((skill, i) => (
                <motion.span
                  key={skill}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.025 }}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium"
                  style={{ background: bg, color }}
                >
                  {skill}
                </motion.span>
              ))}
            </div>
          </div>
        );
      })}
    </SectionCard>
  );
}

// ─── 3. Missing Keywords ──────────────────────────────────────────────────────
function MissingKeywords({ keywords, targetRole }) {
  return (
    <SectionCard icon={Target} iconColor="rgb(239,68,68)" iconBg="rgba(239,68,68,0.1)" title={`Missing Keywords for "${targetRole}"`}>
      <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
        Add these role-specific keywords to improve your ATS match rate.
      </p>
      <div className="space-y-2">
        {keywords.map((kw, i) => {
          const s = PRIORITY_STYLES[kw.priority] || PRIORITY_STYLES.medium;
          return (
            <motion.div
              key={kw.keyword}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background: s.bg, border: `1px solid ${s.border}` }}
            >
              <XCircle size={14} style={{ color: s.color, flexShrink: 0, marginTop: 1 }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>{kw.keyword}</span>
                  <PriorityBadge priority={kw.priority} />
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>{kw.reason}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ─── 4. Improvement Tips ─────────────────────────────────────────────────────
function ImprovementTips({ tips }) {
  return (
    <SectionCard icon={Lightbulb} iconColor="rgb(251,191,36)" iconBg="rgba(251,191,36,0.1)" title="AI Improvement Tips">
      <div className="space-y-2.5">
        {tips.map((tip, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-3.5 rounded-xl"
            style={{ background: 'rgb(var(--bg-primary))', border: '1px solid rgb(var(--border-color))' }}
          >
            <div className="flex items-start gap-3">
              {/* Impact ring */}
              <div className="relative w-9 h-9 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="14" fill="none"
                    stroke={tip.impact >= 8 ? '#ef4444' : tip.impact >= 5 ? '#f59e0b' : '#22c55e'}
                    strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 14}`}
                    strokeDashoffset={`${2 * Math.PI * 14 * (1 - tip.impact / 10)}`}
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                </svg>
                <span
                  className="absolute inset-0 flex items-center justify-center text-[10px] font-bold"
                  style={{ color: tip.impact >= 8 ? '#ef4444' : tip.impact >= 5 ? '#f59e0b' : '#22c55e' }}
                >
                  {tip.impact}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                    style={{ background: 'rgba(99,102,241,0.1)', color: 'rgb(99,102,241)' }}>
                    {tip.category}
                  </span>
                </div>
                <p className="text-sm font-medium leading-relaxed" style={{ color: 'rgb(var(--text-primary))' }}>{tip.tip}</p>
                {tip.example && (
                  <p className="text-xs mt-1.5 pl-2 italic border-l-2"
                    style={{ color: 'rgb(var(--text-muted))', borderColor: 'rgba(99,102,241,0.4)' }}>
                    {tip.example}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── 5. Role Fit Analysis ─────────────────────────────────────────────────────
function RoleAnalysis({ roleAnalysis }) {
  const fitColor = FIT_COLORS[roleAnalysis.fitLabel] || '#f59e0b';
  const fitScore = roleAnalysis.fitScore || 0;

  return (
    <SectionCard icon={Target} iconColor="rgb(99,102,241)" iconBg="rgba(99,102,241,0.1)" title="Job Role Fit Analysis" defaultOpen={true}>
      {/* Fit score ring + label */}
      <div className="flex items-center gap-5 p-4 rounded-xl"
        style={{ background: `${fitColor}10`, border: `1px solid ${fitColor}25` }}>
        {/* Ring */}
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
            <circle
              cx="40" cy="40" r="32" fill="none" stroke={fitColor} strokeWidth="7" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 32}`}
              strokeDashoffset={`${2 * Math.PI * 32 * (1 - fitScore / 100)}`}
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold" style={{ color: fitColor }}>{fitScore}</span>
            <span className="text-[9px] font-semibold" style={{ color: 'rgb(var(--text-muted))' }}>/100</span>
          </div>
        </div>
        <div>
          <p className="text-base font-bold" style={{ color: fitColor }}>{roleAnalysis.fitLabel}</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>
            for <span style={{ color: 'rgb(var(--text-primary))' }}>{roleAnalysis.targetRole}</span>
          </p>
          <p className="text-xs mt-2 leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
            {roleAnalysis.verdict}
          </p>
        </div>
      </div>

      {/* Strengths */}
      {roleAnalysis.strengths?.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgb(34,197,94)' }}>
            ✓ Strengths
          </p>
          <div className="space-y-1.5">
            {roleAnalysis.strengths.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
                <CheckCircle size={12} style={{ color: 'rgb(34,197,94)', flexShrink: 0 }} />
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gaps */}
      {roleAnalysis.gaps?.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgb(239,68,68)' }}>
            ✗ Gaps to Address
          </p>
          <div className="space-y-1.5">
            {roleAnalysis.gaps.map((g, i) => (
              <div key={i} className="flex items-center gap-2 text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
                <XCircle size={12} style={{ color: 'rgb(239,68,68)', flexShrink: 0 }} />
                {g}
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ─── 6. Dynamic Recommendations ──────────────────────────────────────────────
function DynamicRecommendations({ recommendations }) {
  return (
    <SectionCard icon={Zap} iconColor="rgb(99,102,241)" iconBg="rgba(99,102,241,0.1)" title="Dynamic Recommendations">
      <div className="space-y-2.5">
        {recommendations.map((rec, i) => {
          const s = PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.medium;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-start gap-3 p-3.5 rounded-xl"
              style={{ background: 'rgb(var(--bg-primary))', border: '1px solid rgb(var(--border-color))' }}
            >
              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: s.bg }}>
                <ArrowRight size={11} style={{ color: s.color }} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-sm font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>{rec.title}</p>
                  <PriorityBadge priority={rec.priority} />
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'rgb(var(--text-muted))' }}>{rec.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ─── Fallback Warning Banner ──────────────────────────────────────────────────
function FallbackBanner() {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl mb-4"
      style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
      <AlertTriangle size={15} style={{ color: 'rgb(251,191,36)', flexShrink: 0, marginTop: 1 }} />
      <p className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>
        <strong style={{ color: 'rgb(251,191,36)' }}>Gemini AI unavailable</strong> — showing general analysis.
        Add a valid <code className="px-1 rounded" style={{ background: 'rgba(0,0,0,0.3)' }}>GEMINI_API_KEY</code> in your
        backend <code className="px-1 rounded" style={{ background: 'rgba(0,0,0,0.3)' }}>.env</code> file for full AI analysis.
      </p>
    </div>
  );
}

// ─── Main AI Analysis Panel ───────────────────────────────────────────────────
export default function AIAnalysisPanel({ aiAnalysis }) {
  if (!aiAnalysis) return null;

  const {
    professionalSummary,
    detectedSkills,
    missingKeywords,
    improvementTips,
    roleAnalysis,
    dynamicRecommendations,
    targetRole,
    analyzedAt,
    model,
    _fallback,
  } = aiAnalysis;

  return (
    <div className="space-y-4">
      {/* Meta bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles size={13} style={{ color: 'rgb(168,85,247)' }} />
          <span className="text-xs font-medium" style={{ color: 'rgb(var(--text-muted))' }}>
            AI Analysis · {targetRole || 'General'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px]" style={{ color: 'rgb(var(--text-muted))' }}>
          <span className="px-2 py-0.5 rounded-full"
            style={{ background: model === 'fallback' ? 'rgba(251,191,36,0.1)' : 'rgba(168,85,247,0.1)', color: model === 'fallback' ? 'rgb(251,191,36)' : 'rgb(168,85,247)' }}>
            {model === 'fallback' ? '⚠ Fallback Mode' : `✨ ${model || 'Gemini 2.0 Flash'}`}
          </span>
          {analyzedAt && <span>{new Date(analyzedAt).toLocaleString()}</span>}
        </div>
      </div>

      {/* Fallback warning */}
      {_fallback && <FallbackBanner />}

      {/* Section panels */}
      {roleAnalysis && <RoleAnalysis roleAnalysis={roleAnalysis} />}
      {professionalSummary && <ProfessionalSummary summary={professionalSummary} />}
      {detectedSkills && <SkillsDetection skills={detectedSkills} />}
      {missingKeywords?.length > 0 && <MissingKeywords keywords={missingKeywords} targetRole={targetRole || 'this role'} />}
      {improvementTips?.length > 0 && <ImprovementTips tips={improvementTips} />}
      {dynamicRecommendations?.length > 0 && <DynamicRecommendations recommendations={dynamicRecommendations} />}
    </div>
  );
}
