'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Sparkles, ArrowRight, Zap, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, googleLogin, authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const googleBtnRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard');
  }, [isAuthenticated, router]);

  // ─── Define callback BEFORE useEffect so it's in scope ──────────────────
  const handleGoogleResponse = useCallback(async (response) => {
    setGoogleLoading(true);
    try {
      await googleLogin(response.credential);
    } finally {
      setGoogleLoading(false);
    }
  }, [googleLogin]);

  // ─── Load Google Identity Services ──────────────────────────────────────
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your_google_client_id_here') return;

    // Guard: avoid initializing multiple times on React re-renders
    if (window.__gsiInitialized) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && !window.__gsiInitialized) {
        window.__gsiInitialized = true;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
        });
        if (googleBtnRef.current) {
          // GSI does not accept percentage widths — use pixel value
          const btnWidth = googleBtnRef.current.offsetWidth || 400;
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            width: btnWidth,
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
          });
        }
      }
    };
    document.head.appendChild(script);
    return () => {
      window.__gsiInitialized = false;
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, [handleGoogleResponse]);

  // Manual Google button click (fallback using One Tap prompt)
  const handleGoogleClick = () => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your_google_client_id_here') {
      alert('Google Sign-In is not configured yet.\n\nTo enable it:\n1. Go to console.cloud.google.com\n2. Create OAuth 2.0 credentials\n3. Add your Client ID to frontend/.env.local as NEXT_PUBLIC_GOOGLE_CLIENT_ID\n4. Add it to backend/.env as GOOGLE_CLIENT_ID');
      return;
    }
    if (window.google) {
      window.google.accounts.id.prompt();
    }
  };

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    await login(form);
  };

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: '' }));
  };

  const isGoogleConfigured = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your_google_client_id_here';

  return (
    <div className="auth-bg flex items-center justify-center min-h-screen p-4">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 animate-spin-slow"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-15 animate-float"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg, rgb(99,102,241), rgb(168,85,247))' }}
          >
            <Zap size={28} color="white" fill="white" />
          </motion.div>
          <h1 className="text-3xl font-bold gradient-text mb-1">Welcome back</h1>
          <p style={{ color: 'rgb(var(--text-secondary))' }} className="text-sm">
            Sign in to your AI Resume Analyzer account
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8" style={{ background: 'rgb(var(--card-bg))', border: '1px solid rgb(var(--border-color))' }}>
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-primary))' }}>
                Email address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'rgb(var(--text-muted))' }} />
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`input-field pl-10 ${errors.email ? 'error' : ''}`}
                  suppressHydrationWarning
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs" style={{ color: 'rgb(239,68,68)' }}>{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
                  Password
                </label>
                <a href="#" className="text-xs font-medium transition-colors"
                  style={{ color: 'rgb(99,102,241)' }}
                  onMouseEnter={(e) => e.target.style.color = 'rgb(79,70,229)'}
                  onMouseLeave={(e) => e.target.style.color = 'rgb(99,102,241)'}
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'rgb(var(--text-muted))' }} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className={`input-field pl-10 pr-10 ${errors.password ? 'error' : ''}`}
                  suppressHydrationWarning
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'rgb(var(--text-muted))' }}
                  suppressHydrationWarning>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs" style={{ color: 'rgb(239,68,68)' }}>{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={authLoading}
              className="btn-primary w-full mt-2"
              suppressHydrationWarning
            >
              {authLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>Sign in <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px" style={{ background: 'rgb(var(--border-color))' }} />
            <span className="px-4 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'rgb(var(--border-color))' }} />
          </div>

          {/* Google Sign-In */}
          {isGoogleConfigured ? (
            <div ref={googleBtnRef} id="google-signin-btn" className="w-full" />
          ) : (
            <button
              id="login-google"
              type="button"
              className="btn-secondary w-full relative"
              onClick={handleGoogleClick}
              disabled={googleLoading}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
              <span className="absolute -top-1 -right-1 text-[9px] font-bold px-1 py-0.5 rounded-full"
                style={{ background: 'rgba(251,191,36,0.9)', color: '#000' }}>Setup needed</span>
            </button>
          )}

          {/* Setup notice */}
          {!isGoogleConfigured && (
            <div className="flex items-start gap-2 mt-3 p-3 rounded-xl text-xs"
              style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: 'rgb(var(--text-muted))' }}>
              <AlertCircle size={13} style={{ color: 'rgb(251,191,36)', flexShrink: 0, marginTop: 1 }} />
              <span>Google OAuth needs a Client ID. <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" style={{ color: 'rgb(99,102,241)' }}>Get one here</a>, then add it to <code className="px-1 rounded" style={{ background: 'rgba(0,0,0,0.3)' }}>.env.local</code></span>
            </div>
          )}

          {/* Sign up link */}
          <p className="text-center text-sm mt-6" style={{ color: 'rgb(var(--text-secondary))' }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold transition-colors"
              style={{ color: 'rgb(99,102,241)' }}>
              Create one free →
            </Link>
          </p>
        </div>

        {/* Feature Hints */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-center gap-6 mt-6"
        >
          {['ATS Scoring', 'AI Analysis', 'PDF Export'].map((feat) => (
            <div key={feat} className="flex items-center gap-1.5 text-xs"
              style={{ color: 'rgb(var(--text-muted))' }}>
              <Sparkles size={12} style={{ color: 'rgb(99,102,241)' }} />
              {feat}
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
