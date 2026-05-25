'use client';

import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Zap, Code2, Target, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Skills Grid ──────────────────────────────────────────────────────────────
function SkillsGrid({ skills, label, color, bg, icon: Icon }) {
  const copy = () => {
    navigator.clipboard.writeText(skills.join(', '));
    toast.success(`${skills.length} ${label.toLowerCase()} copied!`);
  };
  if (!skills?.length) return null;
  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: bg }}>
            <Icon size={13} style={{ color }} />
          </div>
          <h4 className="font-semibold text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
            {label}
            <span className="ml-2 text-xs font-normal" style={{ color: 'rgb(var(--text-muted))' }}>
              ({skills.length})
            </span>
          </h4>
        </div>
        <button onClick={copy}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors"
          style={{ color: 'rgb(var(--text-muted))' }}>
          <Copy size={11} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, i) => (
          <motion.span
            key={skill}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.02 }}
            className="px-2.5 py-1 rounded-lg text-xs font-medium"
            style={{ background: bg, color }}
          >
            {skill}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

// ─── Action Verbs Panel ───────────────────────────────────────────────────────
function ActionVerbsPanel({ verbs }) {
  if (!verbs?.length) return null;
  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(251,191,36,0.1)' }}>
          <Zap size={13} style={{ color: 'rgb(251,191,36)' }} />
        </div>
        <h4 className="font-semibold text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
          Action Verbs Found
          <span className="ml-2 text-xs font-normal" style={{ color: 'rgb(var(--text-muted))' }}>
            ({verbs.length})
          </span>
        </h4>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {verbs.map((verb, i) => (
          <motion.span
            key={verb}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.03 }}
            className="px-2 py-0.5 rounded text-xs font-medium capitalize"
            style={{ background: 'rgba(251,191,36,0.1)', color: 'rgb(251,191,36)' }}
          >
            {verb}
          </motion.span>
        ))}
      </div>
      {verbs.length < 8 && (
        <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
          💡 Tip: Use more action verbs like <em>Implemented, Optimized, Led, Delivered</em> to strengthen your resume.
        </p>
      )}
    </div>
  );
}

// ─── Keywords Panel ───────────────────────────────────────────────────────────
function KeywordsPanel({ foundKeywords }) {
  if (!foundKeywords?.length) return null;
  // Suggested industry keywords not found
  const ALL_KEYWORDS = [
    'agile', 'scrum', 'full stack', 'front end', 'back end', 'cloud', 'devops',
    'ci cd', 'microservices', 'api', 'rest', 'database', 'machine learning',
    'data analysis', 'software development', 'system design', 'leadership',
    'team player', 'communication', 'problem solving', 'collaboration',
  ];
  const missing = ALL_KEYWORDS.filter(
    (kw) => !foundKeywords.some((f) => f.toLowerCase().includes(kw.replace(/\s/g, '').slice(0, 6)))
  ).slice(0, 8);

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(34,197,94,0.1)' }}>
          <Target size={13} style={{ color: 'rgb(34,197,94)' }} />
        </div>
        <h4 className="font-semibold text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
          Industry Keywords
        </h4>
      </div>

      {/* Found */}
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: 'rgb(34,197,94)' }}>
          ✓ Found ({foundKeywords.length})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {foundKeywords.map((kw) => (
            <span key={kw}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs"
              style={{ background: 'rgba(34,197,94,0.1)', color: 'rgb(34,197,94)' }}>
              <CheckCircle size={9} /> {kw}
            </span>
          ))}
        </div>
      </div>

      {/* Suggested missing */}
      {missing.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'rgb(239,68,68)' }}>
            ✗ Consider adding ({missing.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {missing.map((kw) => (
              <span key={kw}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-xs border border-dashed"
                style={{
                  background: 'rgba(239,68,68,0.05)',
                  color: 'rgb(var(--text-muted))',
                  borderColor: 'rgba(239,68,68,0.3)',
                }}>
                <XCircle size={9} style={{ color: 'rgb(239,68,68)' }} /> {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main KeywordAnalysis ─────────────────────────────────────────────────────
export default function KeywordAnalysis({ analysis }) {
  if (!analysis) return null;

  const keywordCat = analysis.categories?.find((c) => c.category === 'Keyword & Skills');
  const contentCat = analysis.categories?.find((c) => c.category === 'Content Quality');

  return (
    <div className="space-y-4">
      {/* Tech Skills */}
      <SkillsGrid
        skills={keywordCat?.detectedSkills || []}
        label="Detected Technical Skills"
        color="rgb(34,211,238)"
        bg="rgba(34,211,238,0.1)"
        icon={Code2}
      />

      {/* Industry Keywords */}
      <KeywordsPanel foundKeywords={keywordCat?.foundKeywords || []} />

      {/* Action Verbs */}
      <ActionVerbsPanel verbs={contentCat?.verbsFound || []} />
    </div>
  );
}
