'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Zap, Target, Brain, FileText, ArrowRight, CheckCircle, Star, TrendingUp, Upload, Sparkles } from 'lucide-react';

const features = [
  { icon: Target,     title: 'ATS Score Analysis',      desc: 'Get an instant ATS compatibility score with detailed breakdown across keywords, formatting, and section quality.',  color: 'indigo' },
  { icon: Brain,      title: 'AI Skill Detection',       desc: 'NLP-powered skill extraction identifies your technical and soft skills, gaps, and match percentage for any role.',  color: 'purple' },
  { icon: Sparkles,   title: 'AI Resume Summary',        desc: 'Generate a compelling professional summary and career headline tailored to your skills and target role.',           color: 'cyan' },
  { icon: TrendingUp, title: 'Improvement Suggestions',  desc: 'Get actionable AI recommendations to strengthen bullet points, improve action verbs, and quantify achievements.',   color: 'green' },
  { icon: FileText,   title: 'PDF Report Export',        desc: 'Download a professional multi-page PDF report with your ATS score, skills analysis, and recommendations.',          color: 'amber' },
  { icon: Upload,     title: 'Drag & Drop Upload',       desc: 'Instantly upload PDF or DOCX resumes with progress tracking and secure cloud storage.',                             color: 'red' },
];

const steps = [
  { step: '01', title: 'Upload Resume',     desc: 'Drag & drop your PDF or DOCX resume file' },
  { step: '02', title: 'AI Analysis',       desc: 'Our AI engine scans and scores your resume' },
  { step: '03', title: 'Get Insights',      desc: 'Review your ATS score, skills, and keyword gaps' },
  { step: '04', title: 'Optimize & Apply',  desc: 'Follow AI suggestions and land more interviews' },
];

const colorMap = {
  indigo: { bg: 'rgba(99,102,241,0.12)',  icon: 'rgb(99,102,241)' },
  purple: { bg: 'rgba(168,85,247,0.12)',  icon: 'rgb(168,85,247)' },
  cyan:   { bg: 'rgba(34,211,238,0.12)',  icon: 'rgb(34,211,238)' },
  green:  { bg: 'rgba(34,197,94,0.12)',   icon: 'rgb(34,197,94)' },
  amber:  { bg: 'rgba(251,191,36,0.12)',  icon: 'rgb(251,191,36)' },
  red:    { bg: 'rgba(239,68,68,0.12)',   icon: 'rgb(239,68,68)' },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'rgb(var(--bg-secondary))' }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-16 h-16"
        style={{ background: 'rgba(10,10,20,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgb(99,102,241), rgb(168,85,247))' }}>
            <Zap size={16} color="white" fill="white" />
          </div>
          <span className="font-bold text-sm" style={{ color: 'rgb(226,232,240)' }}>AI Resume Analyzer</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <button className="btn-secondary px-4 py-2 text-sm hidden sm:inline-flex">Sign in</button>
          </Link>
          <Link href="/register">
            <button className="btn-primary px-4 py-2 text-sm">Get Started Free</button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 md:px-16 text-center relative overflow-hidden">
        {/* Orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-15 animate-spin-slow"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.6) 0%, transparent 70%)' }} />
          <div className="absolute top-40 right-1/4 w-64 h-64 rounded-full opacity-10 animate-float"
            style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.6) 0%, transparent 70%)' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: 'rgb(129,140,248)' }}>
            <Sparkles size={12} />
            Powered by AI — Free to use
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
            <span style={{ color: 'rgb(226,232,240)' }}>Beat the ATS,</span>
            <br />
            <span className="gradient-text">Land the Interview</span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10"
            style={{ color: 'rgb(100,116,139)' }}>
            AI-powered resume analysis with ATS scoring, skill gap detection, keyword optimization, 
            and personalized improvement suggestions. Get hired faster.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 20px 40px rgba(99,102,241,0.3)' }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary text-base px-8 py-3.5"
              >
                Analyze My Resume Free
                <ArrowRight size={18} />
              </motion.button>
            </Link>
            <Link href="/login">
              <button className="btn-secondary text-base px-8 py-3.5">
                Sign In
              </button>
            </Link>
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-6 mt-10 flex-wrap">
            {['No credit card', 'Results in 30s', 'ATS-optimized'].map((t) => (
              <div key={t} className="flex items-center gap-1.5 text-sm"
                style={{ color: 'rgb(100,116,139)' }}>
                <CheckCircle size={14} style={{ color: 'rgb(34,197,94)' }} />
                {t}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Steps */}
      <section className="py-16 px-6 md:px-16" style={{ background: 'rgba(99,102,241,0.03)' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 gradient-text">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12 }}
                className="text-center"
              >
                <div className="text-4xl font-black mb-3 gradient-text">{s.step}</div>
                <h3 className="font-semibold mb-2" style={{ color: 'rgb(226,232,240)' }}>{s.title}</h3>
                <p className="text-sm" style={{ color: 'rgb(100,116,139)' }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 md:px-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3" style={{ color: 'rgb(226,232,240)' }}>
            Everything you need to get hired
          </h2>
          <p className="text-center mb-12" style={{ color: 'rgb(100,116,139)' }}>
            Powered by AI and NLP — no guesswork
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const c = colorMap[f.color];
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -3 }}
                  className="card"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: c.bg }}>
                    <f.icon size={20} style={{ color: c.icon }} />
                  </div>
                  <h3 className="font-semibold mb-2" style={{ color: 'rgb(226,232,240)' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgb(100,116,139)' }}>{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto rounded-2xl p-10"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.1))', border: '1px solid rgba(99,102,241,0.2)' }}
        >
          <Zap size={36} className="mx-auto mb-4" style={{ color: 'rgb(99,102,241)' }} />
          <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: 'rgb(226,232,240)' }}>
            Ready to land your dream job?
          </h2>
          <p className="mb-8" style={{ color: 'rgb(100,116,139)' }}>
            Join thousands of job seekers using AI to optimize their resumes and beat the ATS.
          </p>
          <Link href="/register">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary text-base px-10 py-3.5"
            >
              Get Started — It&apos;s Free
              <ArrowRight size={18} />
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgb(99,102,241), rgb(168,85,247))' }}>
            <Zap size={12} color="white" fill="white" />
          </div>
          <span className="text-sm font-semibold" style={{ color: 'rgb(100,116,139)' }}>AI Resume Analyzer</span>
        </div>
        <p className="text-xs" style={{ color: 'rgb(71,85,105)' }}>
          © {new Date().getFullYear()} AI Resume Analyzer. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
