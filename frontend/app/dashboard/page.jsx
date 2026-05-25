'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Target, Brain, FileText, TrendingUp, Sparkles, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import StatsCard from '@/components/dashboard/StatsCard';
import RecentUploads from '@/components/dashboard/RecentUploads';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { atsAPI } from '@/lib/resumeAPI';

const quickActions = [
  { label: 'Upload Resume', href: '/dashboard/upload', icon: Upload, color: 'rgb(99,102,241)', bg: 'rgba(99,102,241,0.1)' },
  { label: 'ATS Analysis', href: '/dashboard/ats', icon: Target, color: 'rgb(34,197,94)', bg: 'rgba(34,197,94,0.1)' },
  { label: 'Skills Report', href: '/dashboard/skills', icon: Brain, color: 'rgb(168,85,247)', bg: 'rgba(168,85,247,0.1)' },
  { label: 'AI Summary', href: '/dashboard/summary', icon: Sparkles, color: 'rgb(34,211,238)', bg: 'rgba(34,211,238,0.1)' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl shadow-xl text-xs"
      style={{ background: 'rgb(15,15,30)', border: '1px solid rgba(99,102,241,0.3)', color: 'rgb(226,232,240)' }}>
      <p className="font-semibold mb-0.5">{label}</p>
      <p style={{ color: 'rgb(99,102,241)' }}>ATS Score: {payload[0].value}</p>
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [skillCount, setSkillCount] = useState(null);

  useEffect(() => {
    setIsMounted(true);
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const { data } = await atsAPI.getOverview();
      setOverview(data.overview);

      // Estimate skill count from category averages
      const kwCat = data.overview?.categoryAverages?.find((c) => c.category === 'Keyword & Skills');
      if (kwCat) setSkillCount(Math.round(kwCat.avgScore * 2.5));
    } catch {
      // API might fail if no resumes — that's fine
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: 'Total Resumes',
      value: loading ? null : (overview?.total ?? '0'),
      subtitle: 'Uploaded',
      icon: FileText,
      color: 'indigo',
      trend: null,
      trendLabel: '',
      delay: 0,
    },
    {
      title: 'Avg ATS Score',
      value: loading ? null : (overview?.avgScore !== null && overview?.avgScore !== undefined ? `${overview.avgScore}%` : '—'),
      subtitle: 'Across all resumes',
      icon: Target,
      color: 'green',
      trend: null,
      trendLabel: '',
      delay: 0.08,
    },
    {
      title: 'Best Score',
      value: loading ? null : (overview?.bestScore !== null && overview?.bestScore !== undefined ? `${overview.bestScore}%` : '—'),
      subtitle: overview?.bestResume?.name?.slice(0, 20) || 'No analyzed resumes',
      icon: TrendingUp,
      color: 'purple',
      trend: null,
      trendLabel: '',
      delay: 0.16,
    },
    {
      title: 'Analyzed',
      value: loading ? null : (overview?.analyzed ?? '0'),
      subtitle: `${overview?.pending ?? 0} pending`,
      icon: Brain,
      color: 'cyan',
      trend: null,
      trendLabel: '',
      delay: 0.24,
    },
  ];

  // Build category breakdown from real data
  const atsBreakdown = overview?.categoryAverages?.map((cat) => ({
    name: cat.category.replace(' Completeness', '').replace(' Quality', ''),
    score: cat.percentage,
    fill: {
      'Contact': 'rgb(99,102,241)',
      'Section': 'rgb(168,85,247)',
      'Content': 'rgb(34,211,238)',
      'Keyword': 'rgb(34,197,94)',
      'Formatting': 'rgb(251,191,36)',
    }[Object.keys({ 'Contact': 1, 'Section': 1, 'Content': 1, 'Keyword': 1, 'Formatting': 1 })
      .find((k) => cat.category.startsWith(k))] || 'rgb(99,102,241)',
  })) || [];

  // Trend data from real overview
  const trendData = overview?.trend?.length > 0
    ? overview.trend.map((t) => ({ month: t.name || new Date(t.date).toLocaleDateString('en', { month: 'short' }), score: t.score }))
    : [];

  const bestTrend = trendData.length > 1
    ? trendData[trendData.length - 1].score - trendData[0].score
    : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.1))', border: '1px solid rgba(99,102,241,0.2)' }}
      >
        <div className="absolute right-0 top-0 w-64 h-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at right, rgba(99,102,241,0.8) 0%, transparent 70%)' }} />
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>
            Welcome back, {user?.name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>
            {overview?.analyzed > 0
              ? <>You have <span className="font-semibold" style={{ color: 'rgb(99,102,241)' }}>{overview.analyzed}</span> analyzed resumes. Avg ATS score: <span className="font-semibold text-green-400">{overview.avgScore}%</span></>
              : "Upload your first resume to get started with AI-powered analysis."
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadDashboard} disabled={loading}
            className="p-2 rounded-xl transition-colors hover:bg-white/10"
            style={{ color: 'rgb(var(--text-muted))' }}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link href="/dashboard/upload">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary whitespace-nowrap flex-shrink-0"
            >
              <Upload size={16} />
              Analyze New Resume
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          loading
            ? <div key={stat.title} className="card h-24 animate-pulse" style={{ background: 'rgb(var(--bg-secondary))' }} />
            : <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Charts + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ATS Score History Chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>ATS Score Trend</h3>
              <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>Your score progression over time</p>
            </div>
            {bestTrend !== null && bestTrend !== 0 && (
              <span className="badge" style={{ background: bestTrend > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: bestTrend > 0 ? 'rgb(34,197,94)' : 'rgb(239,68,68)' }}>
                {bestTrend > 0 ? '↑' : '↓'} {Math.abs(bestTrend)} pts
              </span>
            )}
          </div>
          {isMounted && trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgb(99,102,241)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="rgb(99,102,241)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'rgb(148,163,184)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'rgb(148,163,184)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="score" stroke="rgb(99,102,241)"
                  strokeWidth={2.5} fill="url(#scoreGrad)" dot={{ r: 4, fill: 'rgb(99,102,241)' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-[180px] rounded-xl flex flex-col items-center justify-center gap-3"
              style={{ background: 'rgba(99,102,241,0.04)', border: '1px dashed rgba(99,102,241,0.2)' }}>
              {loading ? (
                <Loader2 size={20} className="animate-spin" style={{ color: 'rgb(99,102,241)' }} />
              ) : (
                <>
                  <TrendingUp size={22} style={{ color: 'rgb(var(--text-muted))' }} />
                  <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                    Analyze resumes to see your score trend
                  </p>
                  <Link href="/dashboard/ats">
                    <button className="text-xs px-3 py-1.5 rounded-lg font-medium"
                      style={{ background: 'rgba(99,102,241,0.1)', color: 'rgb(99,102,241)' }}>
                      Go to ATS Analysis
                    </button>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="font-semibold mb-4" style={{ color: 'rgb(var(--text-primary))' }}>Quick Actions</h3>
          <div className="space-y-3">
            {quickActions.map((action, i) => (
              <Link key={action.label} href={action.href}>
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ x: 3 }}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors group"
                  style={{ background: 'rgb(var(--bg-secondary))' }}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: action.bg }}>
                    <action.icon size={17} style={{ color: action.color }} />
                  </div>
                  <span className="text-sm font-medium flex-1" style={{ color: 'rgb(var(--text-primary))' }}>
                    {action.label}
                  </span>
                  <ArrowRight size={14} style={{ color: 'rgb(var(--text-muted))' }} />
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ATS Score Breakdown + Recent Uploads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ATS Breakdown Bars */}
        <div className="card">
          <h3 className="font-semibold mb-5" style={{ color: 'rgb(var(--text-primary))' }}>ATS Breakdown</h3>
          {atsBreakdown.length > 0 ? (
            <div className="space-y-4">
              {atsBreakdown.map((item, i) => (
                <motion.div key={item.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="flex justify-between text-sm mb-1.5">
                    <span style={{ color: 'rgb(var(--text-secondary))' }}>{item.name}</span>
                    <span className="font-semibold" style={{ color: item.fill }}>{item.score}%</span>
                  </div>
                  <div className="progress-bar">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.score}%` }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                      className="progress-fill"
                      style={{ background: item.fill }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Target size={22} className="mx-auto mb-2" style={{ color: 'rgb(var(--text-muted))' }} />
              <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                {loading ? 'Loading...' : 'Run ATS analysis to see breakdown'}
              </p>
            </div>
          )}
        </div>

        {/* Recent Uploads */}
        {/* <div className="lg:col-span-2">
          <RecentUploads />
        </div> */}
      </div>
    </div>
  );
}
