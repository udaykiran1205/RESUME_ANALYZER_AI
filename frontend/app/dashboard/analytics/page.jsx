'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Target, FileText, Brain, Award, BarChart3,
  Loader2, RefreshCw, Upload, ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { atsAPI } from '@/lib/resumeAPI';
import toast from 'react-hot-toast';

const CATEGORY_COLORS = {
  'Contact Completeness': 'rgb(99,102,241)',
  'Section Completeness': 'rgb(168,85,247)',
  'Content Quality':      'rgb(34,211,238)',
  'Keyword & Skills':     'rgb(34,197,94)',
  'Formatting Quality':   'rgb(251,191,36)',
};

function StatCard({ label, value, sub, icon: Icon, color, trend }) {
  const trendColor = trend > 0 ? 'rgb(34,197,94)' : trend < 0 ? 'rgb(239,68,68)' : 'rgb(148,163,184)';
  const TrendIcon = trend > 0 ? ArrowUp : trend < 0 ? ArrowDown : Minus;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={18} style={{ color }} />
        </div>
        {trend !== undefined && (
          <span className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: trendColor }}>
            <TrendIcon size={11} /> {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>{value ?? '—'}</p>
      <p className="text-sm font-medium mt-0.5" style={{ color: 'rgb(var(--text-primary))' }}>{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>{sub}</p>}
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl shadow-xl text-xs"
      style={{ background: 'rgb(15,15,30)', border: '1px solid rgba(99,102,241,0.3)', color: 'rgb(226,232,240)' }}>
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await atsAPI.getOverview();
      setOverview(data.overview);
      setResumes(data.resumes || []);
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const getScoreLabel = (s) => {
    if (s >= 85) return { label: 'Excellent', color: 'rgb(34,197,94)' };
    if (s >= 70) return { label: 'Good', color: 'rgb(99,102,241)' };
    if (s >= 55) return { label: 'Average', color: 'rgb(251,191,36)' };
    return { label: 'Needs Work', color: 'rgb(239,68,68)' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={24} className="animate-spin" style={{ color: 'rgb(34,211,238)' }} />
        <span style={{ color: 'rgb(var(--text-muted))' }}>Loading analytics...</span>
      </div>
    );
  }

  if (!overview || overview.total === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-5">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(34,211,238,0.1)' }}>
          <TrendingUp size={36} style={{ color: 'rgb(34,211,238)' }} />
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>No Analytics Yet</h2>
          <p className="text-sm mt-2 max-w-sm mx-auto" style={{ color: 'rgb(var(--text-muted))' }}>
            Upload and analyze resumes to see your performance analytics here.
          </p>
        </div>
        <Link href="/dashboard/upload">
          <button className="btn-primary"><Upload size={15} /> Upload Resume</button>
        </Link>
      </motion.div>
    );
  }

  // Radar chart data from category averages
  const radarData = (overview.categoryAverages || []).map((cat) => ({
    subject: cat.category.replace(' Completeness', '').replace(' Quality', ''),
    score: Math.round((cat.avgScore / (cat.weight || 20)) * 100),
    fullMark: 100,
  }));

  // Bar chart for resume scores
  const resumeBarData = resumes
    .filter((r) => r.atsScore !== null)
    .slice(0, 8)
    .map((r) => ({
      name: r.originalName.replace(/\.[^.]+$/, '').slice(0, 12),
      score: r.atsScore,
      color: getScoreLabel(r.atsScore).color,
    }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,211,238,0.15)' }}>
              <TrendingUp size={16} style={{ color: 'rgb(34,211,238)' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>Analytics</h1>
          </div>
          <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
            Your ATS performance overview · {overview.analyzed} resumes analyzed
          </p>
        </div>
        <button onClick={fetchData} className="p-2 rounded-xl hover:bg-white/5 transition-colors"
          style={{ color: 'rgb(var(--text-muted))' }}>
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Resumes" value={overview.total} sub="Uploaded"
          icon={FileText} color="rgb(99,102,241)" />
        <StatCard label="Avg ATS Score" value={overview.avgScore !== null ? `${overview.avgScore}%` : '—'}
          sub="Across all resumes" icon={Target} color="rgb(34,197,94)" />
        <StatCard label="Best Score" value={overview.bestScore !== null ? `${overview.bestScore}%` : '—'}
          sub={overview.bestResume?.name?.slice(0, 15)} icon={Award} color="rgb(251,191,36)" />
        <StatCard label="Analyzed" value={overview.analyzed}
          sub={`${overview.pending} pending`} icon={BarChart3} color="rgb(168,85,247)" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Trend Chart */}
        {overview.trend?.length > 0 && (
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>Score Trend</h3>
                <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>Your ATS score progression over time</p>
              </div>
              {overview.avgScore && (
                <span className="badge" style={{ background: 'rgba(34,197,94,0.1)', color: 'rgb(34,197,94)' }}>
                  Avg {overview.avgScore}
                </span>
              )}
            </div>
            {isMounted && (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={overview.trend}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(34,211,238)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="rgb(34,211,238)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgb(148,163,184)' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'rgb(148,163,184)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="score" name="ATS Score" stroke="rgb(34,211,238)"
                    strokeWidth={2.5} fill="url(#trendGrad)" dot={{ r: 4, fill: 'rgb(34,211,238)' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {/* Radar Chart */}
        {radarData.length > 0 && (
          <div className="card flex flex-col">
            <h3 className="font-semibold mb-4" style={{ color: 'rgb(var(--text-primary))' }}>Category Averages</h3>
            {isMounted && (
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(148,163,184,0.15)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: 'rgb(148,163,184)' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: 'rgb(148,163,184)' }} />
                  <Radar name="Avg Score" dataKey="score" stroke="rgb(99,102,241)" fill="rgb(99,102,241)" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>

      {/* Resume Scores Bar Chart */}
      {resumeBarData.length > 1 && (
        <div className="card">
          <h3 className="font-semibold mb-5" style={{ color: 'rgb(var(--text-primary))' }}>Resume Score Comparison</h3>
          {isMounted && (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={resumeBarData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgb(148,163,184)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'rgb(148,163,184)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="score" name="ATS Score" radius={[6, 6, 0, 0]}>
                  {resumeBarData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Resume Score Table */}
      <div className="card">
        <h3 className="font-semibold mb-4" style={{ color: 'rgb(var(--text-primary))' }}>All Resumes</h3>
        <div className="space-y-2">
          {resumes.map((r, i) => {
            const sl = r.atsScore !== null ? getScoreLabel(r.atsScore) : null;
            return (
              <motion.div key={r._id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'rgb(var(--bg-secondary))', border: '1px solid rgb(var(--border-color))' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: r.fileType === 'pdf' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)' }}>
                  <FileText size={14} style={{ color: r.fileType === 'pdf' ? 'rgb(239,68,68)' : 'rgb(99,102,241)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'rgb(var(--text-primary))' }}>{r.originalName}</p>
                  <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                    {r.analyzedAt ? new Date(r.analyzedAt).toLocaleDateString() : r.status}
                  </p>
                </div>
                {r.atsScore !== null ? (
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgb(var(--bg-tertiary))' }}>
                      <div className="h-full rounded-full" style={{ width: `${r.atsScore}%`, background: sl?.color }} />
                    </div>
                    <span className="text-sm font-bold w-8 text-right" style={{ color: sl?.color }}>{r.atsScore}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium hidden sm:block"
                      style={{ background: `${sl?.color}18`, color: sl?.color }}>{sl?.label}</span>
                  </div>
                ) : (
                  <span className="text-xs capitalize px-2 py-1 rounded-lg"
                    style={{ background: 'rgb(var(--bg-tertiary))', color: 'rgb(var(--text-muted))' }}>{r.status}</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
