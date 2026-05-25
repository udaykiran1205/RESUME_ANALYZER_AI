'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  UserCircle, Mail, Calendar, Shield, Edit3, Save, X,
  FileText, BarChart3, Sparkles, CheckCircle, Zap
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card flex items-center gap-4 p-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>{value}</p>
        <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>{label}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser, api } = useAuth();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ total: 0, analyzed: 0, avgScore: 0 });

  // Fetch resume stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const { data } = await api.get('/resumes');
        const resumes = data.resumes || data || [];
        const analyzed = resumes.filter(r => r.status === 'analyzed');
        const scores = analyzed.map(r => r.atsScore).filter(Boolean);
        const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        setStats({ total: resumes.length, analyzed: analyzed.length, avgScore: avg });
      } catch {
        // silently ignore
      }
    }
    fetchStats();
  }, [api]);

  const handleSave = async () => {
    if (!name.trim() || name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', { name: name.trim() });
      updateUser(data.user);
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setEditing(false);
  };

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown';

  const isGoogleUser = !!user?.googleId;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(168,85,247,0.15)' }}>
            <UserCircle size={16} style={{ color: 'rgb(168,85,247)' }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>Profile</h1>
        </div>
        <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
          Your account information and resume activity
        </p>
      </motion.div>

      {/* Avatar + Name Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card"
      >
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgb(99,102,241), rgb(168,85,247))' }}>
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white">{(user?.name || 'U')[0].toUpperCase()}</span>
              )}
            </div>
            {/* Online dot */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-current"
              style={{ background: 'rgb(34,197,94)', borderColor: 'rgb(var(--card-bg))' }} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input-field text-lg font-semibold"
                  placeholder="Your full name"
                  autoFocus
                  suppressHydrationWarning
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5"
                  >
                    {saving ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : <Save size={14} />}
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="btn-secondary px-4 py-2 text-sm flex items-center gap-1.5"
                  >
                    <X size={14} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xl font-bold truncate" style={{ color: 'rgb(var(--text-primary))' }}>
                    {user?.name}
                  </p>
                  <p className="text-sm truncate mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>
                    {user?.email}
                  </p>
                  {/* Auth badge */}
                  <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: isGoogleUser ? 'rgba(99,102,241,0.12)' : 'rgba(34,197,94,0.12)',
                      color: isGoogleUser ? 'rgb(129,140,248)' : 'rgb(34,197,94)',
                    }}>
                    {isGoogleUser ? <Zap size={11} /> : <Shield size={11} />}
                    {isGoogleUser ? 'Google Account' : 'Email & Password'}
                  </div>
                </div>
                <button
                  onClick={() => setEditing(true)}
                  className="p-2 rounded-xl transition-colors flex-shrink-0"
                  style={{ background: 'rgb(var(--bg-tertiary))', color: 'rgb(var(--text-secondary))' }}
                  title="Edit name"
                >
                  <Edit3 size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Account Details */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card space-y-4"
      >
        <h2 className="font-semibold flex items-center gap-2" style={{ color: 'rgb(var(--text-primary))' }}>
          <Shield size={15} /> Account Details
        </h2>

        <div className="space-y-3">
          {/* Email */}
          <div className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: 'rgb(var(--bg-tertiary))' }}>
            <Mail size={16} style={{ color: 'rgb(99,102,241)' }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium" style={{ color: 'rgb(var(--text-muted))' }}>Email</p>
              <p className="text-sm truncate" style={{ color: 'rgb(var(--text-primary))' }}>{user?.email}</p>
            </div>
            <CheckCircle size={14} style={{ color: 'rgb(34,197,94)' }} />
          </div>

          {/* Joined */}
          <div className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: 'rgb(var(--bg-tertiary))' }}>
            <Calendar size={16} style={{ color: 'rgb(168,85,247)' }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium" style={{ color: 'rgb(var(--text-muted))' }}>Member since</p>
              <p className="text-sm" style={{ color: 'rgb(var(--text-primary))' }}>{joinedDate}</p>
            </div>
          </div>

          {/* Login Method */}
          <div className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: 'rgb(var(--bg-tertiary))' }}>
            <Shield size={16} style={{ color: 'rgb(34,211,238)' }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium" style={{ color: 'rgb(var(--text-muted))' }}>Sign-in method</p>
              <p className="text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
                {isGoogleUser ? 'Google OAuth' : 'Email & Password'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Resume Activity Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'rgb(var(--text-primary))' }}>
          <BarChart3 size={15} /> Resume Activity
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard icon={FileText}  label="Total Resumes"   value={stats.total}    color="rgb(99,102,241)" />
          <StatCard icon={BarChart3} label="Analyzed"        value={stats.analyzed} color="rgb(34,197,94)" />
          <StatCard icon={Sparkles}  label="Avg ATS Score"   value={stats.avgScore ? `${stats.avgScore}%` : '—'} color="rgb(168,85,247)" />
        </div>
      </motion.div>

      {/* Quick link to settings */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <button
          onClick={() => router.push('/dashboard/settings')}
          className="w-full text-sm font-medium py-3 rounded-xl transition-all"
          style={{ background: 'rgba(99,102,241,0.08)', color: 'rgb(99,102,241)', border: '1px solid rgba(99,102,241,0.2)' }}
        >
          ⚙️ Go to Settings to change password or theme →
        </button>
      </motion.div>
    </div>
  );
}
