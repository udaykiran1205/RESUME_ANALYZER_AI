'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

// ─── Score Color Palette ──────────────────────────────────────────────────────
const getScoreColor = (score) => {
  if (score >= 85) return { main: '#22c55e', glow: 'rgba(34,197,94,0.3)',  label: 'Excellent', grade: 'A' };
  if (score >= 70) return { main: '#3b82f6', glow: 'rgba(59,130,246,0.3)', label: 'Good',      grade: 'B' };
  if (score >= 55) return { main: '#f59e0b', glow: 'rgba(245,158,11,0.3)', label: 'Average',   grade: 'C' };
  if (score >= 40) return { main: '#f97316', glow: 'rgba(249,115,22,0.3)', label: 'Weak',      grade: 'D' };
  return             { main: '#ef4444', glow: 'rgba(239,68,68,0.3)',   label: 'Poor',      grade: 'F' };
};

// ─── Custom Centre Label ──────────────────────────────────────────────────────
const CentreLabel = ({ score, color, grade }) => (
  <g>
    <text x="50%" y="42%" textAnchor="middle" dominantBaseline="middle"
      fill={color} style={{ fontSize: 40, fontWeight: 800, fontFamily: 'Inter, sans-serif' }}>
      {score}
    </text>
    <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle"
      fill="rgba(148,163,184,0.9)" style={{ fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
      / 100
    </text>
    <text x="50%" y="69%" textAnchor="middle" dominantBaseline="middle"
      fill={color} style={{ fontSize: 11, fontWeight: 700, fontFamily: 'Inter, sans-serif', letterSpacing: 1 }}>
      GRADE {grade}
    </text>
  </g>
);

// ─── Score Gauge Component ────────────────────────────────────────────────────
export default function ScoreGauge({ score, size = 'lg', showLabel = true }) {
  const { main, glow, label, grade } = getScoreColor(score ?? 0);
  const data = [{ value: score ?? 0, fill: main }];
  const dim = size === 'sm' ? 160 : size === 'md' ? 220 : 280;
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: 'spring', bounce: 0.3 }}
        style={{ width: dim, height: dim, position: 'relative' }}
      >
        {/* Glow Ring */}
        <div style={{
          position: 'absolute', inset: 12, borderRadius: '50%',
          boxShadow: `0 0 40px ${glow}, inset 0 0 20px rgba(0,0,0,0.3)`,
          pointerEvents: 'none', zIndex: 0,
        }} />

        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%" cy="50%"
              innerRadius="62%" outerRadius="80%"
              startAngle={220} endAngle={-40}
              data={data}
              barSize={14}
            >
              {/* Background track */}
              <RadialBar
                background={{ fill: 'rgba(255,255,255,0.05)' }}
                dataKey="value"
                max={100}
                cornerRadius={8}
              />
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <CentreLabel score={score ?? 0} color={main} grade={grade} />
            </RadialBarChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full rounded-full flex items-center justify-center bg-[rgba(255,255,255,0.02)]">
            <span className="text-xs text-[rgb(var(--text-muted))]">Loading...</span>
          </div>
        )}
      </motion.div>

      {/* Label */}
      {showLabel && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold"
            style={{ background: `${main}18`, color: main, border: `1px solid ${main}30` }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: main }} />
            {label} ATS Score
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Mini Score Badge (for lists) ────────────────────────────────────────────
export function ScoreBadge({ score, showGrade = false }) {
  const { main, label, grade } = getScoreColor(score ?? 0);
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-10 h-10 flex-shrink-0">
        <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
          <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
          <circle cx="20" cy="20" r="16" fill="none" stroke={main} strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 16}`}
            strokeDashoffset={`${2 * Math.PI * 16 * (1 - (score ?? 0) / 100)}`}
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold"
          style={{ color: main }}>
          {score ?? '?'}
        </span>
      </div>
      {showGrade && <span className="text-xs font-semibold" style={{ color: main }}>{label}</span>}
    </div>
  );
}
