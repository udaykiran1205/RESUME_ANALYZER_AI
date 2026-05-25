'use client';

import { motion } from 'framer-motion';
import { FileText, Clock, CheckCircle, XCircle, BarChart3, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const statusConfig = {
  analyzed:  { icon: CheckCircle, color: 'rgb(34,197,94)',  bg: 'rgba(34,197,94,0.1)',  label: 'Analyzed' },
  pending:   { icon: Clock,        color: 'rgb(251,191,36)', bg: 'rgba(251,191,36,0.1)', label: 'Pending' },
  failed:    { icon: XCircle,      color: 'rgb(239,68,68)',  bg: 'rgba(239,68,68,0.1)',  label: 'Failed' },
  analyzing: { icon: BarChart3,    color: 'rgb(99,102,241)', bg: 'rgba(99,102,241,0.1)', label: 'Analyzing' },
};

const sampleResumes = [
  { id: 1, name: 'Software_Engineer_Resume.pdf', atsScore: 87, status: 'analyzed', uploadedAt: '2 hours ago', size: '245 KB' },
  { id: 2, name: 'Product_Manager_CV.pdf',       atsScore: 72, status: 'analyzed', uploadedAt: '1 day ago',   size: '189 KB' },
  { id: 3, name: 'Data_Scientist_Resume.docx',   atsScore: 91, status: 'analyzed', uploadedAt: '3 days ago',  size: '312 KB' },
  { id: 4, name: 'UX_Designer_Portfolio.pdf',    atsScore: 0,  status: 'pending',  uploadedAt: 'Just now',    size: '1.2 MB' },
];

function ScoreBadge({ score }) {
  const color = score >= 80 ? 'rgb(34,197,94)' : score >= 60 ? 'rgb(251,191,36)' : 'rgb(239,68,68)';
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
        style={{ borderColor: color }}>
        <span className="text-xs font-bold" style={{ color, fontSize: '9px' }}>{score}</span>
      </div>
      <span className="text-sm font-semibold" style={{ color }}>{score > 0 ? `${score}%` : '—'}</span>
    </div>
  );
}

export default function RecentUploads() {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>Recent Uploads</h3>
          <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>Your latest resume analyses</p>
        </div>
        <Link href="/dashboard/upload">
          <button className="flex items-center gap-1 text-xs font-medium transition-colors px-3 py-1.5 rounded-lg"
            style={{ color: 'rgb(99,102,241)', background: 'rgba(99,102,241,0.08)' }}>
            Upload new <ChevronRight size={12} />
          </button>
        </Link>
      </div>

      <div className="space-y-3">
        {sampleResumes.map((resume, index) => {
          const status = statusConfig[resume.status];
          const StatusIcon = status.icon;
          return (
            <motion.div
              key={resume.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              className="flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group"
              style={{ background: 'rgb(var(--bg-secondary))' }}
            >
              {/* File Icon */}
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(99,102,241,0.1)' }}>
                <FileText size={18} style={{ color: 'rgb(99,102,241)' }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate"
                  style={{ color: 'rgb(var(--text-primary))' }}>
                  {resume.name}
                </p>
                <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                  {resume.size} · {resume.uploadedAt}
                </p>
              </div>

              {/* Status */}
              <div className="flex items-center gap-1.5 flex-shrink-0 px-2 py-1 rounded-lg"
                style={{ background: status.bg }}>
                <StatusIcon size={12} style={{ color: status.color }} />
                <span className="text-xs font-medium" style={{ color: status.color }}>{status.label}</span>
              </div>

              {/* ATS Score */}
              {resume.status === 'analyzed' && (
                <div className="flex-shrink-0">
                  <ScoreBadge score={resume.atsScore} />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
