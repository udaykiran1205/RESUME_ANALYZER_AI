'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({ title, value, subtitle, icon: Icon, color, trend, trendLabel, delay = 0 }) {
  const colors = {
    indigo:  { bg: 'rgba(99,102,241,0.12)',  icon: 'rgb(99,102,241)',  text: 'rgb(99,102,241)' },
    purple:  { bg: 'rgba(168,85,247,0.12)',  icon: 'rgb(168,85,247)',  text: 'rgb(168,85,247)' },
    cyan:    { bg: 'rgba(34,211,238,0.12)',   icon: 'rgb(34,211,238)',  text: 'rgb(34,211,238)' },
    green:   { bg: 'rgba(34,197,94,0.12)',   icon: 'rgb(34,197,94)',   text: 'rgb(34,197,94)' },
    amber:   { bg: 'rgba(251,191,36,0.12)',  icon: 'rgb(251,191,36)',  text: 'rgb(217,119,6)' },
    red:     { bg: 'rgba(239,68,68,0.12)',   icon: 'rgb(239,68,68)',   text: 'rgb(239,68,68)' },
  };

  const c = colors[color] || colors.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className="card card-hover"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider mb-1"
            style={{ color: 'rgb(var(--text-muted))' }}>
            {title}
          </p>
          <p className="text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-muted))' }}>{subtitle}</p>
          )}
        </div>
        <div className="p-3 rounded-xl" style={{ background: c.bg }}>
          <Icon size={20} style={{ color: c.icon }} />
        </div>
      </div>

      {trend !== undefined && (
        <div className="flex items-center gap-1.5 mt-3 pt-3"
          style={{ borderTop: '1px solid rgb(var(--border-color))' }}>
          {trend >= 0 ? (
            <TrendingUp size={13} style={{ color: 'rgb(34,197,94)' }} />
          ) : (
            <TrendingDown size={13} style={{ color: 'rgb(239,68,68)' }} />
          )}
          <span className="text-xs font-medium"
            style={{ color: trend >= 0 ? 'rgb(34,197,94)' : 'rgb(239,68,68)' }}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
          {trendLabel && (
            <span className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>{trendLabel}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
