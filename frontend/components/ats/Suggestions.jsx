'use client';

import { motion } from 'framer-motion';
import { Lightbulb, ArrowRight, CheckCircle, AlertTriangle, Star, Zap } from 'lucide-react';

const PRIORITY_COLORS = {
  high:   { dot: 'rgb(239,68,68)',  bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)' },
  medium: { dot: 'rgb(251,191,36)', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)' },
  low:    { dot: 'rgb(34,197,94)',  bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)' },
};

function getPriority(impact) {
  if (impact >= 5) return 'high';
  if (impact >= 3) return 'medium';
  return 'low';
}

function SuggestionItem({ suggestion, index }) {
  const priority = getPriority(suggestion.impact);
  const colors = PRIORITY_COLORS[priority];

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className="flex items-start gap-3 p-3.5 rounded-xl"
      style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
    >
      {/* Priority Indicator */}
      <div className="flex flex-col items-center gap-1 pt-0.5 flex-shrink-0">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: colors.dot }} />
        <span className="text-[9px] uppercase font-bold tracking-wider"
          style={{ color: colors.dot }}>
          {priority}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-relaxed"
          style={{ color: 'rgb(var(--text-primary))' }}>
          {suggestion.tip}
        </p>
        <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-muted))' }}>
          {suggestion.category} · +{suggestion.impact} pts potential
        </p>
      </div>

      {/* Impact badge */}
      <div className="flex-shrink-0 px-2 py-1 rounded-lg text-xs font-bold"
        style={{ background: colors.bg, color: colors.dot }}>
        +{suggestion.impact}
      </div>
    </motion.div>
  );
}

export default function Suggestions({ suggestions }) {
  if (!suggestions?.length) {
    return (
      <div className="card text-center py-10">
        <CheckCircle size={32} className="mx-auto mb-3" style={{ color: 'rgb(34,197,94)' }} />
        <p className="font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>
          Looking great!
        </p>
        <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-muted))' }}>
          Your resume scores well across all categories. No critical improvements needed.
        </p>
      </div>
    );
  }

  const totalPotential = suggestions.reduce((s, sg) => s + sg.impact, 0);

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(251,191,36,0.1)' }}>
            <Lightbulb size={15} style={{ color: 'rgb(251,191,36)' }} />
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
              Improvement Suggestions
            </h3>
            <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
              {suggestions.length} suggestions · up to +{totalPotential} pts
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(99,102,241,0.1)', color: 'rgb(99,102,241)' }}>
          <Zap size={11} /> Fix these to boost score
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-[10px] uppercase tracking-wider font-semibold"
        style={{ color: 'rgb(var(--text-muted))' }}>
        {Object.entries(PRIORITY_COLORS).map(([key, { dot }]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: dot }} />
            {key}
          </div>
        ))}
      </div>

      {/* Suggestion List */}
      <div className="space-y-2.5">
        {suggestions.map((s, i) => (
          <SuggestionItem key={i} suggestion={s} index={i} />
        ))}
      </div>
    </div>
  );
}
