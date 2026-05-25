'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, MapPin, Globe,
  FileText, BookOpen, Briefcase, GraduationCap, Code2,
  Award, Star, ChevronDown, ChevronUp,
  Lightbulb, CheckCircle, Copy, ExternalLink, BarChart2
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';

// ─── Section icon map ─────────────────────────────────────────────────────────
const SECTION_ICONS = {
  summary:        { icon: FileText,     color: 'rgb(99,102,241)',  bg: 'rgba(99,102,241,0.1)' },
  experience:     { icon: Briefcase,    color: 'rgb(34,197,94)',   bg: 'rgba(34,197,94,0.1)' },
  education:      { icon: GraduationCap,color: 'rgb(168,85,247)',  bg: 'rgba(168,85,247,0.1)' },
  skills:         { icon: Code2,        color: 'rgb(34,211,238)',  bg: 'rgba(34,211,238,0.1)' },
  projects:       { icon: Star,         color: 'rgb(251,191,36)',  bg: 'rgba(251,191,36,0.1)' },
  certifications: { icon: Award,        color: 'rgb(239,68,68)',   bg: 'rgba(239,68,68,0.1)' },
  languages:      { icon: Globe,        color: 'rgb(244,114,182)', bg: 'rgba(244,114,182,0.1)' },
  awards:         { icon: Award,        color: 'rgb(251,146,60)',  bg: 'rgba(251,146,60,0.1)' },
  volunteer:      { icon: Star,         color: 'rgb(74,222,128)',  bg: 'rgba(74,222,128,0.1)' },
  interests:      { icon: Lightbulb,    color: 'rgb(129,140,248)', bg: 'rgba(129,140,248,0.1)' },
  default:        { icon: BookOpen,     color: 'rgb(148,163,184)', bg: 'rgba(148,163,184,0.1)' },
};

// ─── Contact Card ─────────────────────────────────────────────────────────────
function ContactCard({ contact }) {
  const fields = [
    { key: 'email',    icon: Mail,  label: 'Email',    href: contact.email ? `mailto:${contact.email}` : null },
    { key: 'phone',    icon: Phone, label: 'Phone',    href: null },
    { key: 'location', icon: MapPin,label: 'Location', href: null },
    { key: 'linkedin', icon: Globe, label: 'LinkedIn', href: contact.linkedin },
    { key: 'github',   icon: Globe, label: 'GitHub',   href: contact.github },
    { key: 'website',  icon: Globe, label: 'Website',  href: contact.website },
  ].filter((f) => contact[f.key]);

  if (!fields.length && !contact.name) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
      {/* Name */}
      {contact.name && (
        <div className="flex items-center gap-3 mb-4 pb-4" style={{ borderBottom: '1px solid rgb(var(--border-color))' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
            style={{ background: 'linear-gradient(135deg, rgb(99,102,241), rgb(168,85,247))', color: 'white' }}>
            {contact.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-lg" style={{ color: 'rgb(var(--text-primary))' }}>{contact.name}</h3>
            <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>Extracted from resume</p>
          </div>
        </div>
      )}

      {/* Contact Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map(({ key, icon: Icon, label, href }) => (
          <div key={key} className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(99,102,241,0.1)' }}>
              <Icon size={13} style={{ color: 'rgb(99,102,241)' }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>{label}</p>
              {href ? (
                <a href={href} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-medium truncate block transition-colors"
                  style={{ color: 'rgb(99,102,241)' }}>
                  {contact[key]}
                </a>
              ) : (
                <p className="text-sm font-medium truncate" style={{ color: 'rgb(var(--text-primary))' }}>
                  {contact[key]}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Section Card (collapsible) ───────────────────────────────────────────────
function SectionCard({ section, index }) {
  const [expanded, setExpanded] = useState(index < 3); // First 3 expanded
  const config = SECTION_ICONS[section.key] || SECTION_ICONS.default;
  const Icon = config.icon;

  const copyContent = () => {
    navigator.clipboard.writeText(section.content);
    toast.success('Section content copied!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: config.bg }}>
            <Icon size={17} style={{ color: config.color }} />
          </div>
          <div>
            <h4 className="font-semibold capitalize" style={{ color: 'rgb(var(--text-primary))' }}>
              {section.title || section.key}
            </h4>
            <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
              {section.items?.length > 0
                ? `${section.items.length} bullet points`
                : `${section.content.split(/\s+/).filter(Boolean).length} words`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); copyContent(); }}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: 'rgb(var(--text-muted))' }}
            title="Copy section"
          >
            <Copy size={13} />
          </button>
          {expanded ? <ChevronUp size={16} style={{ color: 'rgb(var(--text-muted))' }} />
                    : <ChevronDown size={16} style={{ color: 'rgb(var(--text-muted))' }} />}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgb(var(--border-color))' }}>
              {section.items?.length > 0 ? (
                <ul className="space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle size={13} className="flex-shrink-0 mt-0.5" style={{ color: config.color }} />
                      <span className="text-sm leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ color: 'rgb(var(--text-secondary))' }}>
                  {section.content}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Skills Panel ─────────────────────────────────────────────────────────────
function SkillsPanel({ skills }) {
  if (!skills?.length) return null;
  const copyAll = () => {
    navigator.clipboard.writeText(skills.join(', '));
    toast.success(`${skills.length} skills copied!`);
  };
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(34,211,238,0.1)' }}>
            <Code2 size={15} style={{ color: 'rgb(34,211,238)' }} />
          </div>
          <div>
            <h4 className="font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>Detected Skills</h4>
            <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>{skills.length} skills found via NLP</p>
          </div>
        </div>
        <button onClick={copyAll}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          style={{ background: 'rgba(34,211,238,0.1)', color: 'rgb(34,211,238)' }}>
          <Copy size={12} /> Copy all
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <motion.span key={skill} whileHover={{ scale: 1.05 }}
            className="badge badge-primary text-xs cursor-default">
            {skill}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function ParseStats({ resume }) {
  const stats = [
    { label: 'Pages',     value: resume.pageCount,      unit: '' },
    { label: 'Words',     value: resume.wordCount?.toLocaleString(), unit: '' },
    { label: 'Sections',  value: resume.sections?.length, unit: '' },
    { label: 'Skills',    value: resume.detectedSkills?.length, unit: '' },
    { label: 'File Size', value: resume.fileSizeFormatted, unit: '' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {stats.map(({ label, value }) => (
        <div key={label} className="card text-center py-3">
          <p className="text-xl font-bold gradient-text">{value ?? '—'}</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>{label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main ParseResult Component ───────────────────────────────────────────────
export default function ParseResult({ resume }) {
  if (!resume) return null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={18} style={{ color: 'rgb(34,197,94)' }} />
            <h3 className="font-bold text-lg" style={{ color: 'rgb(var(--text-primary))' }}>
              Resume Parsed Successfully
            </h3>
          </div>
          <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
            {resume.originalName}
          </p>
        </div>
        <Link href={`/dashboard/resume/${resume._id}`}>
          <button className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5 flex-shrink-0">
            <BarChart2 size={13} /> View Full Analysis
          </button>
        </Link>
      </div>

      {/* Stats */}
      <ParseStats resume={resume} />

      {/* Contact Card */}
      {resume.contact && Object.values(resume.contact).some(Boolean) && (
        <ContactCard contact={resume.contact} />
      )}

      {/* Detected Skills */}
      <SkillsPanel skills={resume.detectedSkills} />

      {/* Sections */}
      {resume.sections?.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
            Extracted Sections ({resume.sections.length})
          </h4>
          {resume.sections.map((section, i) => (
            <SectionCard key={section.key + i} section={section} index={i} />
          ))}
        </div>
      )}

      {/* No sections fallback */}
      {(!resume.sections || resume.sections.length === 0) && (
        <div className="card text-center py-8">
          <FileText size={32} className="mx-auto mb-3" style={{ color: 'rgb(var(--text-muted))' }} />
          <p className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
            No sections detected
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-muted))' }}>
            The resume text was extracted but section headers weren&apos;t recognized. Try reformatting with standard headings.
          </p>
        </div>
      )}
    </div>
  );
}
