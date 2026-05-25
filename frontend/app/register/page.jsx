'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Sparkles, ArrowRight, Zap, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

const passwordRules = [
  { id: 'length', label: 'At least 6 characters', test: (p) => p.length >= 6 },
  { id: 'upper',  label: 'One uppercase letter',  test: (p) => /[A-Z]/.test(p) },
  { id: 'lower',  label: 'One lowercase letter',  test: (p) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number',             test: (p) => /\d/.test(p) },
];

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { register, googleLogin, authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const googleBtnRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard');
  }, [isAuthenticated, router]);

  // ─── Load Google Identity Services ──────────────────────────────────────
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your_google_client_id_here') return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'signup_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        });
      }
    };
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const handleGoogleResponse = async (response) => {
    setGoogleLoading(true);
    try {
      await googleLogin(response.credential);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleClick = () => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your_google_client_id_here') {
      alert('Google Sign-In is not configured yet.\n\nTo enable it:\n1. Go to console.cloud.google.com\n2. Create OAuth 2.0 credentials\n3. Add your Client ID to frontend/.env.local as NEXT_PUBLIC_GOOGLE_CLIENT_ID\n4. Add it to backend/.env as GOOGLE_CLIENT_ID');
      return;
    }
    if (window.google) window.google.accounts.id.prompt();
  };

  const validate = () => {
    const e = {};
    if (!form.name || form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    const failing = passwordRules.filter((r) => !r.test(form.password));
    if (failing.length) e.password = 'Password does not meet requirements';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    await register({ name: form.name, email: form.email, password: form.password });
  };

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: '' }));
  };

  const passStrength = passwordRules.filter((r) => r.test(form.password)).length;
  const isGoogleConfigured = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your_google_client_id_here';

  return (
    <div className="auth-bg flex items-center justify-center min-h-screen p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 animate-spin-slow"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-15 animate-float"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.3) 0%, transparent 70%)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg, rgb(168,85,247), rgb(99,102,241))' }}
          >
            <Zap size={28} color="white" fill="white" />
          </motion.div>
          <h1 className="text-3xl font-bold gradient-text mb-1">Create account</h1>
          <p style={{ color: 'rgb(var(--text-secondary))' }} className="text-sm">
            Join thousands of job seekers using AI to land their dream role
          </p>
        </div>

        <div className="glass-card p-8" style={{ background: 'rgb(var(--card-bg))', border: '1px solid rgb(var(--border-color))' }}>
          {/* Google Sign-Up first */}
          {isGoogleConfigured ? (
            <div ref={googleBtnRef} id="google-signup-btn" className="w-full mb-5" />
          ) : (
            <button
              type="button"
              className="btn-secondary w-full mb-5 relative"
              onClick={handleGoogleClick}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Sign up with Google
              <span className="absolute -top-1 -right-1 text-[9px] font-bold px-1 py-0.5 rounded-full"
                style={{ background: 'rgba(251,191,36,0.9)', color: '#000' }}>Setup needed</span>
            </button>
          )}

          {/* Divider */}
          <div className="flex items-center mb-5">
            <div className="flex-1 h-px" style={{ background: 'rgb(var(--border-color))' }} />
            <span className="px-4 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>or sign up with email</span>
            <div className="flex-1 h-px" style={{ background: 'rgb(var(--border-color))' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-primary))' }}>Full name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgb(var(--text-muted))' }} />
                <input id="register-name" type="text" name="name" value={form.name} onChange={handleChange}
                  placeholder="John Doe" autoComplete="name"
                  className={`input-field pl-10 ${errors.name ? 'error' : ''}`} />
              </div>
              {errors.name && <p className="mt-1 text-xs" style={{ color: 'rgb(239,68,68)' }}>{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-primary))' }}>Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgb(var(--text-muted))' }} />
                <input id="register-email" type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="you@example.com" autoComplete="email"
                  className={`input-field pl-10 ${errors.email ? 'error' : ''}`} />
              </div>
              {errors.email && <p className="mt-1 text-xs" style={{ color: 'rgb(239,68,68)' }}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-primary))' }}>Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgb(var(--text-muted))' }} />
                <input id="register-password" type={showPassword ? 'text' : 'password'} name="password"
                  value={form.password} onChange={handleChange} placeholder="Create a strong password"
                  autoComplete="new-password" className={`input-field pl-10 pr-10 ${errors.password ? 'error' : ''}`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgb(var(--text-muted))' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[0,1,2,3].map((i) => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ background: i < passStrength
                          ? passStrength <= 1 ? 'rgb(239,68,68)' : passStrength <= 2 ? 'rgb(251,191,36)'
                          : passStrength <= 3 ? 'rgb(99,102,241)' : 'rgb(34,197,94)'
                          : 'rgb(var(--bg-tertiary))' }} />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    {passwordRules.map((rule) => (
                      <div key={rule.id} className="flex items-center gap-1 text-xs"
                        style={{ color: rule.test(form.password) ? 'rgb(34,197,94)' : 'rgb(var(--text-muted))' }}>
                        <Check size={10} /> {rule.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {errors.password && <p className="mt-1 text-xs" style={{ color: 'rgb(239,68,68)' }}>{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-primary))' }}>Confirm password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgb(var(--text-muted))' }} />
                <input id="register-confirm" type={showConfirm ? 'text' : 'password'} name="confirmPassword"
                  value={form.confirmPassword} onChange={handleChange} placeholder="Repeat your password"
                  autoComplete="new-password" className={`input-field pl-10 pr-10 ${errors.confirmPassword ? 'error' : ''}`} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgb(var(--text-muted))' }}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs" style={{ color: 'rgb(239,68,68)' }}>{errors.confirmPassword}</p>
              )}
            </div>

            <button id="register-submit" type="submit" disabled={authLoading} className="btn-primary w-full mt-2">
              {authLoading ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating account...</>
              ) : (
                <>Create free account <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'rgb(var(--text-secondary))' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold transition-colors" style={{ color: 'rgb(99,102,241)' }}>
              Sign in →
            </Link>
          </p>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="flex items-center justify-center gap-6 mt-6">
          {['Free forever', 'AI-powered', 'ATS optimized'].map((feat) => (
            <div key={feat} className="flex items-center gap-1.5 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
              <Sparkles size={12} style={{ color: 'rgb(168,85,247)' }} /> {feat}
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
