'use client';

import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, TrendingUp, Info } from 'lucide-react';

// ─── Category colour map ──────────────────────────────────────────────────────
const CAT_COLORS = {
  'Contact Completeness': { bar: 'rgb(99,102,241)',  bg: 'rgba(99,102,241,0.1)'  },
  'Section Completeness': { bar: 'rgb(168,85,247)',  bg: 'rgba(168,85,247,0.1)'  },
  'Content Quality':      { bar: 'rgb(34,211,238)',  bg: 'rgba(34,211,238,0.1)'  },
  'Keyword & Skills':     { bar: 'rgb(34,197,94)',   bg: 'rgba(34,197,94,0.1)'   },
  'Formatting Quality':   { bar: 'rgb(251,191,36)',  bg: 'rgba(251,191,36,0.1)'  },
};
const DEFAULT_COLOR = { bar: 'rgb(148,163,184)', bg: 'rgba(148,163,184,0.1)' };

// ─── Animated Progress Bar ────────────────────────────────────────────────────
function ProgressBar({ percentage, color, delay = 0 }) {
  return (
    <div className="w-full h-2 rounded-full overflow-hidden"
      style={{ background: 'rgb(var(--bg-tertiary))' }}>
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1, delay, ease: 'easeOut' }}
        style={{ background: color }}
      />
    </div>
  );
}

// ─── Sub-item breakdown row ───────────────────────────────────────────────────
function BreakdownItem({ item, catColor }) {
  const pct = Math.round((item.score / item.max) * 100);
  const isGood = pct >= 70;
  const isFair = pct >= 40;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>{item.label}</span>
        <span className="text-xs font-bold tabular-nums" style={{ color: catColor }}>
          {item.score}/{item.max}
        </span>
      </div>
      <ProgressBar percentage={pct} color={catColor} delay={0.2} />
      {item.tip && (
        <p className="text-xs leading-relaxed" style={{ color: 'rgb(var(--text-muted))' }}>
          {item.tip}
        </p>
      )}
    </div>
  );
}

// ─── Category Card ────────────────────────────────────────────────────────────
function CategoryCard({ category, index }) {
  const { bar, bg } = CAT_COLORS[category.category] || DEFAULT_COLOR;
  const pct = category.percentage;
  const isGood = pct >= 70;
  const isFair = pct >= 40;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="card space-y-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: bar }} />
            <h4 className="font-semibold text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
              {category.category}
            </h4>
            <span className="text-xs ml-auto" style={{ color: 'rgb(var(--text-muted))' }}>
              weight: {category.weight}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black" style={{ color: bar }}>
              {category.score}
            </span>
            <span className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
              / {category.weight}
            </span>
            <span className="ml-auto text-sm font-semibold" style={{
              color: isGood ? 'rgb(34,197,94)' : isFair ? 'rgb(251,191,36)' : 'rgb(239,68,68)'
            }}>
              {pct}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <ProgressBar percentage={pct} color={bar} delay={index * 0.08} />

      {/* Tip */}
      {category.tip && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg"
          style={{ background: isGood ? 'rgba(34,197,94,0.07)' : 'rgba(251,191,36,0.07)' }}>
          <Info size={12} className="flex-shrink-0 mt-0.5"
            style={{ color: isGood ? 'rgb(34,197,94)' : 'rgb(251,191,36)' }} />
          <p className="text-xs leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
            {category.tip}
          </p>
        </div>
      )}

      {/* Sub-breakdowns */}
      {category.breakdown?.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs font-medium select-none list-none flex items-center gap-1.5"
            style={{ color: bar }}>
            <TrendingUp size={11} />
            View breakdown ({category.breakdown.length} items)
          </summary>
          <div className="mt-3 space-y-4 pt-3"
            style={{ borderTop: '1px solid rgb(var(--border-color))' }}>
            {category.breakdown.map((item, i) => (
              <BreakdownItem key={i} item={item} catColor={bar} />
            ))}
          </div>
        </details>
      )}
    </motion.div>
  );
}

// ─── Main ScoreBreakdown Component ───────────────────────────────────────────
export default function ScoreBreakdown({ categories }) {
  if (!categories?.length) return null;
  return (
    <div className="space-y-4">
      {categories.map((cat, i) => (
        <CategoryCard key={cat.category} category={cat} index={i} />
      ))}
    </div>
  );
}

// ─── Horizontal Overview Bar (compact, for summary views) ─────────────────────
export function CategoryBars({ categories }) {
  if (!categories?.length) return null;
  return (
    <div className="space-y-3">
      {categories.map((cat, i) => {
        const { bar } = CAT_COLORS[cat.category] || DEFAULT_COLOR;
        return (
          <div key={cat.category} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: 'rgb(var(--text-secondary))' }}>
                {cat.category}
              </span>
              <span className="text-xs font-bold tabular-nums" style={{ color: bar }}>
                {cat.score}/{cat.weight}
              </span>
            </div>
            <ProgressBar percentage={cat.percentage} color={bar} delay={i * 0.1} />
          </div>
        );
      })}
    </div>
  );
}
