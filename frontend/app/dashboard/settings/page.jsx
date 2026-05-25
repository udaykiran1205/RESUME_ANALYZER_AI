'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Palette, Bell, Shield, Save, Moon, Sun, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateUser, api } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Profile
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  // Password change
  const [showPwSection, setShowPwSection] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState('');

  // Notifications
  const [emailNotifs, setEmailNotifs] = useState(user?.preferences?.emailNotifications ?? true);

  const handleSaveProfile = async () => {
    if (!name.trim() || name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', { name: name.trim(), preferences: { emailNotifications: emailNotifs } });
      updateUser(data.user);
      toast.success('Profile saved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError('');
    if (!pwForm.current) { setPwError('Enter your current password'); return; }
    if (pwForm.next.length < 6) { setPwError('New password must be at least 6 characters'); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match'); return; }
    setSavingPw(true);
    try {
      await api.post('/auth/change-password', { currentPassword: pwForm.current, newPassword: pwForm.next });
      toast.success('Password changed successfully!');
      setPwForm({ current: '', next: '', confirm: '' });
      setShowPwSection(false);
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPw(false);
    }
  };

  const isGoogleUser = !!user?.googleId;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
            <User size={16} style={{ color: 'rgb(99,102,241)' }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>Settings</h1>
        </div>
        <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>Manage your account preferences</p>
      </motion.div>

      {/* Google account notice */}
      {isGoogleUser && (
        <div className="flex items-start gap-2 p-3 rounded-xl text-xs"
          style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <CheckCircle size={13} style={{ color: 'rgb(99,102,241)', flexShrink: 0, marginTop: 1 }} />
          <span style={{ color: 'rgb(var(--text-secondary))' }}>
            Your account is linked to Google. Some fields may be managed by Google.
          </span>
        </div>
      )}

      {/* Profile Card */}
      <div className="card space-y-4">
        <h2 className="font-semibold flex items-center gap-2" style={{ color: 'rgb(var(--text-primary))' }}>
          <User size={15} /> Profile
        </h2>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold overflow-hidden flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgb(99,102,241), rgb(168,85,247))' }}>
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white">{name.charAt(0)?.toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="font-medium text-sm" style={{ color: 'rgb(var(--text-primary))' }}>{user?.name}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>{user?.email}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>
            Full Name
          </label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="input-field" placeholder="Your full name" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>
            Email Address
          </label>
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgb(var(--text-muted))' }} />
            <input value={user?.email || ''} readOnly
              className="input-field pl-9 opacity-60 cursor-not-allowed" />
          </div>
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-muted))' }}>Email cannot be changed</p>
        </div>
      </div>

      {/* Appearance */}
      <div className="card space-y-4">
        <h2 className="font-semibold flex items-center gap-2" style={{ color: 'rgb(var(--text-primary))' }}>
          <Palette size={15} /> Appearance
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>Theme</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>
              Currently: {isDark ? 'Dark' : 'Light'} mode
            </p>
          </div>
          <button onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'rgb(var(--bg-tertiary))', color: 'rgb(var(--text-primary))' }}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            Toggle {isDark ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="card space-y-4">
        <h2 className="font-semibold flex items-center gap-2" style={{ color: 'rgb(var(--text-primary))' }}>
          <Bell size={15} /> Notifications
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>Email Notifications</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>
              Receive updates about your analyses
            </p>
          </div>
          <button
            onClick={() => setEmailNotifs((p) => !p)}
            className="relative w-11 h-6 rounded-full transition-all duration-300"
            style={{ background: emailNotifs ? 'rgb(99,102,241)' : 'rgb(var(--bg-tertiary))' }}
          >
            <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300"
              style={{ transform: emailNotifs ? 'translateX(20px)' : 'translateX(0)' }} />
          </button>
        </div>
      </div>

      {/* Password Change */}
      {!isGoogleUser && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2" style={{ color: 'rgb(var(--text-primary))' }}>
              <Lock size={15} /> Password
            </h2>
            <button onClick={() => setShowPwSection((p) => !p)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'rgba(99,102,241,0.1)', color: 'rgb(99,102,241)' }}>
              {showPwSection ? 'Cancel' : 'Change Password'}
            </button>
          </div>

          {showPwSection && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 overflow-hidden">
              {/* Current password */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Current Password</label>
                <div className="relative">
                  <input type={showCurrent ? 'text' : 'password'} value={pwForm.current}
                    onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
                    className="input-field pr-10" placeholder="Enter current password" />
                  <button type="button" onClick={() => setShowCurrent((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgb(var(--text-muted))' }}>
                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>New Password</label>
                <div className="relative">
                  <input type={showNext ? 'text' : 'password'} value={pwForm.next}
                    onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))}
                    className="input-field pr-10" placeholder="Min 6 characters" />
                  <button type="button" onClick={() => setShowNext((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgb(var(--text-muted))' }}>
                    {showNext ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm new password */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Confirm New Password</label>
                <input type="password" value={pwForm.confirm}
                  onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                  className="input-field" placeholder="Repeat new password" />
              </div>

              {pwError && (
                <div className="flex items-center gap-2 text-xs" style={{ color: 'rgb(239,68,68)' }}>
                  <AlertCircle size={12} /> {pwError}
                </div>
              )}

              <button onClick={handleChangePassword} disabled={savingPw}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(99,102,241,0.15)', color: 'rgb(99,102,241)' }}>
                {savingPw ? (
                  <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Changing...</>
                ) : (
                  <><Lock size={14} /> Change Password</>
                )}
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* Save Profile Button */}
      <button onClick={handleSaveProfile} disabled={saving} className="btn-primary w-full">
        {saving ? (
          <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
        ) : (
          <><Save size={16} /> Save Changes</>
        )}
      </button>
    </div>
  );
}
