/**
 * atsScorer.js
 * Dynamic ATS scoring engine. Analyzes a parsed resume and produces
 * a structured score report with section-wise breakdown.
 *
 * Score Weights (total = 100):
 *   Contact Completeness   10 pts
 *   Section Completeness   20 pts
 *   Content Quality        25 pts
 *   Keyword & Skills       25 pts
 *   Formatting Quality     20 pts
 */

// ─── Action Verbs Library ─────────────────────────────────────────────────────
const ACTION_VERBS = [
  'achieved','accelerated','accomplished','administered','analyzed','architected',
  'automated','built','collaborated','co-founded','coordinated','created','debugged',
  'decreased','defined','delivered','deployed','designed','developed','directed',
  'drove','engineered','established','evaluated','executed','expanded','facilitated',
  'generated','improved','implemented','increased','initiated','integrated','launched',
  'led','managed','mentored','migrated','modernized','negotiated','optimized',
  'orchestrated','oversaw','performed','planned','produced','programmed','reduced',
  'refactored','researched','resolved','reviewed','scaled','shipped','simplified',
  'solved','spearheaded','streamlined','strengthened','transformed','upgraded',
  'validated','wrote','published','trained','tested','supported','secured',
  'restructured','presented','owned','operated','monitored','modeled','maintained',
];

// ─── Quantification Patterns ──────────────────────────────────────────────────
const QUANT_PATTERNS = [
  /\d+\s*%/,                    // percentages: 40%, 25 %
  /\$\s*\d+[\d,.kKmMbB]*/,      // dollar amounts: $50K, $1.2M
  /\d+[\d,.]*\s*(million|billion|thousand|k\b)/i,
  /\d+\+?\s*(users|clients|customers|employees|members|teams?|projects?|applications?)/i,
  /reduced?\s+by\s+\d+/i,
  /increased?\s+by\s+\d+/i,
  /\d+x\s+(faster|improvement|growth|increase)/i,
  /top\s+\d+%/i,
  /saved\s+\$?\d+/i,
];

// ─── ATS-Unfriendly Pattern Detectors ────────────────────────────────────────
const UNFRIENDLY_PATTERNS = {
  tables:      /\|.*\|.*\|/m,                          // table separators
  columns:     /\s{10,}\w+\s{10,}\w+/m,               // excessive spaces (2-col layout)
  symbols:     /[★☆✓✗✦✧◆◇■□●○▶►✔✖✘]/u,              // special symbols
  boxDrawing:  /[\u2500-\u257F]/u,                     // box-drawing characters
  headerFooter:/page\s+\d+\s+of\s+\d+/i,              // page numbers in text
};

// ─── Required Section Keys ────────────────────────────────────────────────────
const CRITICAL_SECTIONS  = ['experience', 'education', 'skills'];
const IMPORTANT_SECTIONS = ['summary', 'projects', 'certifications'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const round2 = (v) => Math.round(v * 100) / 100;

// ─── 1. Contact Completeness (10 pts) ────────────────────────────────────────
function scoreContact(contact) {
  const fields = {
    email:    { pts: 4, label: 'Email address' },
    phone:    { pts: 2, label: 'Phone number' },
    linkedin: { pts: 2, label: 'LinkedIn profile' },
    location: { pts: 1, label: 'Location/City' },
    name:     { pts: 1, label: 'Full name' },
  };

  let earned = 0;
  const found = [];
  const missing = [];

  for (const [key, { pts, label }] of Object.entries(fields)) {
    if (contact?.[key] && contact[key].trim().length > 0) {
      earned += pts;
      found.push(label);
    } else {
      missing.push({ field: label, impact: pts, suggestion: `Add your ${label} to improve recruiter contact rate` });
    }
  }

  return {
    category: 'Contact Completeness',
    weight: 10,
    score: clamp(earned, 0, 10),
    percentage: clamp(Math.round((earned / 10) * 100), 0, 100),
    found,
    missing,
    tip: missing.length > 0
      ? `Add ${missing.map((m) => m.field).join(', ')} for better recruiter response rates.`
      : 'Great! All essential contact details are present.',
  };
}

// ─── 2. Section Completeness (20 pts) ────────────────────────────────────────
function scoreSections(sections) {
  const sectionKeys = sections.map((s) => s.key?.toLowerCase());
  const sectionMap = {};
  sections.forEach((s) => { sectionMap[s.key] = s; });

  let earned = 0;
  const present = [];
  const missing = [];
  const sectionDetails = [];

  // Critical sections (5 pts each = 15 pts)
  for (const key of CRITICAL_SECTIONS) {
    if (sectionKeys.includes(key)) {
      const sec = sectionMap[key];
      const wordCount = sec?.content?.split(/\s+/).filter(Boolean).length || 0;
      const bulletCount = sec?.items?.length || 0;
      let pts = 5;
      // Deduct for very thin sections
      if (wordCount < 20) pts = 2;
      else if (wordCount < 50) pts = 3;
      earned += pts;
      present.push({ key, pts, wordCount, bulletCount });
      sectionDetails.push({ key, status: 'present', score: pts, maxScore: 5 });
    } else {
      missing.push({
        key,
        impact: 5,
        suggestion: `Add a "${key.charAt(0).toUpperCase() + key.slice(1)}" section — ATS systems require it.`,
      });
      sectionDetails.push({ key, status: 'missing', score: 0, maxScore: 5 });
    }
  }

  // Important sections (1.67 pts each ≈ 5 pts)
  const impPtsEach = Math.round((5 / IMPORTANT_SECTIONS.length) * 10) / 10;
  for (const key of IMPORTANT_SECTIONS) {
    if (sectionKeys.includes(key)) {
      earned += impPtsEach;
      present.push({ key, pts: impPtsEach });
      sectionDetails.push({ key, status: 'present', score: impPtsEach, maxScore: impPtsEach });
    } else {
      sectionDetails.push({ key, status: 'missing', score: 0, maxScore: impPtsEach });
    }
  }

  const finalScore = clamp(Math.round(earned), 0, 20);

  return {
    category: 'Section Completeness',
    weight: 20,
    score: finalScore,
    percentage: clamp(Math.round((finalScore / 20) * 100), 0, 100),
    present: present.map((p) => p.key),
    missing: missing.map((m) => m.key),
    details: sectionDetails,
    tip: missing.length === 0
      ? 'All key sections detected. Excellent structure!'
      : `Missing critical sections: ${missing.map((m) => m.key).join(', ')}. Add them to avoid ATS rejection.`,
  };
}

// ─── 3. Content Quality (25 pts) ─────────────────────────────────────────────
function scoreContentQuality(rawText, sections) {
  const text = rawText || '';
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const lowerText = text.toLowerCase();
  const lines = text.split('\n').filter((l) => l.trim().length > 0);

  let earned = 0;
  const breakdown = [];

  // 1. Word Count (5 pts) — ideal: 400–700 words
  let wordPts = 0;
  if (wordCount >= 700)       wordPts = 5;
  else if (wordCount >= 400)  wordPts = 5;
  else if (wordCount >= 250)  wordPts = 3;
  else if (wordCount >= 100)  wordPts = 1;
  earned += wordPts;
  breakdown.push({
    label: 'Resume Length',
    score: wordPts, max: 5,
    detail: `${wordCount} words (ideal: 400–700)`,
    tip: wordCount < 300 ? 'Resume too short. Expand bullet points with details.' :
         wordCount > 900 ? 'Resume may be too long. Trim to 1-2 pages.' : 'Good length.',
  });

  // 2. Bullet Point Usage (5 pts)
  const allBullets = sections.reduce((acc, s) => acc + (s.items?.length || 0), 0);
  let bulletPts = 0;
  if (allBullets >= 10)      bulletPts = 5;
  else if (allBullets >= 6)  bulletPts = 4;
  else if (allBullets >= 3)  bulletPts = 2;
  else if (allBullets >= 1)  bulletPts = 1;
  earned += bulletPts;
  breakdown.push({
    label: 'Bullet Point Usage',
    score: bulletPts, max: 5,
    detail: `${allBullets} bullet points found`,
    tip: allBullets < 6 ? 'Use bullet points to describe achievements. ATS parses them better.' : 'Good use of bullet points.',
  });

  // 3. Action Verb Usage (8 pts)
  const verbsFound = ACTION_VERBS.filter((v) => {
    const re = new RegExp(`\\b${v}\\b`, 'i');
    return re.test(lowerText);
  });
  const verbScore = clamp(verbsFound.length, 0, 8);
  const verbPts = Math.round((verbScore / 8) * 8);
  earned += verbPts;
  breakdown.push({
    label: 'Action Verbs',
    score: verbPts, max: 8,
    detail: `${verbsFound.length} action verbs detected`,
    verbs: verbsFound.slice(0, 10),
    tip: verbsFound.length < 5
      ? 'Use more action verbs (Built, Improved, Led, Reduced…) to strengthen impact.'
      : 'Strong use of action verbs!',
  });

  // 4. Quantified Achievements (7 pts)
  const quantMatches = QUANT_PATTERNS.filter((p) => p.test(text));
  let quantPts = 0;
  if (quantMatches.length >= 5)     quantPts = 7;
  else if (quantMatches.length >= 3) quantPts = 5;
  else if (quantMatches.length >= 1) quantPts = 2;
  earned += quantPts;
  breakdown.push({
    label: 'Quantified Achievements',
    score: quantPts, max: 7,
    detail: `${quantMatches.length} quantified results found (%, $, numbers)`,
    tip: quantMatches.length < 3
      ? 'Add numbers and metrics: "Reduced load time by 40%", "Served 10K+ users".'
      : 'Great use of quantified achievements!',
  });

  const finalScore = clamp(earned, 0, 25);

  return {
    category: 'Content Quality',
    weight: 25,
    score: finalScore,
    percentage: clamp(Math.round((finalScore / 25) * 100), 0, 100),
    breakdown,
    verbsFound,
    wordCount,
    bulletCount: allBullets,
    quantCount: quantMatches.length,
    tip: finalScore >= 20
      ? 'Excellent content quality!'
      : 'Focus on adding action verbs and quantifiable results.',
  };
}

// ─── 4. Keyword & Skills (25 pts) ────────────────────────────────────────────
function scoreKeywords(detectedSkills, sections, rawText) {
  const text = rawText?.toLowerCase() || '';
  let earned = 0;
  const breakdown = [];

  // 4a. Technical Skill Density (15 pts)
  const skillCount = detectedSkills?.length || 0;
  let skillPts = 0;
  if (skillCount >= 20)      skillPts = 15;
  else if (skillCount >= 12) skillPts = 12;
  else if (skillCount >= 8)  skillPts = 9;
  else if (skillCount >= 4)  skillPts = 6;
  else if (skillCount >= 1)  skillPts = 3;
  earned += skillPts;
  breakdown.push({
    label: 'Technical Skills Detected',
    score: skillPts, max: 15,
    detail: `${skillCount} skills found`,
    tip: skillCount < 8 ? 'Add more technical skills to your Skills section.' : 'Strong skills profile!',
  });

  // 4b. Dedicated Skills Section (5 pts)
  const hasSkillsSection = sections.some((s) => s.key === 'skills');
  const skillsSectionPts = hasSkillsSection ? 5 : 0;
  earned += skillsSectionPts;
  breakdown.push({
    label: 'Skills Section Present',
    score: skillsSectionPts, max: 5,
    detail: hasSkillsSection ? 'Dedicated Skills section found' : 'No Skills section detected',
    tip: !hasSkillsSection ? 'Add a dedicated "Skills" section for ATS keyword matching.' : 'Skills section found.',
  });

  // 4c. Industry Keywords — soft skills & roles (5 pts)
  const industryKeywords = [
    'team player','leadership','communication','problem.solving','collaboration',
    'agile','scrum','project management','full.stack','front.?end','back.?end',
    'cloud','devops','ci.?cd','microservices','api','rest','database',
    'machine learning','data analysis','software development','system design',
  ];
  const foundKeywords = industryKeywords.filter((kw) => {
    const re = new RegExp(kw, 'i');
    return re.test(text);
  });
  const kwPts = clamp(Math.round((foundKeywords.length / industryKeywords.length) * 5), 0, 5);
  earned += kwPts;
  breakdown.push({
    label: 'Industry Keywords',
    score: kwPts, max: 5,
    detail: `${foundKeywords.length}/${industryKeywords.length} keywords found`,
    keywords: foundKeywords.map((k) => k.replace(/\./g, ' ')),
    tip: kwPts < 3 ? 'Include more role-specific keywords like "Agile", "Full-Stack", "API", "DevOps".' : 'Good industry keyword coverage.',
  });

  const finalScore = clamp(earned, 0, 25);

  return {
    category: 'Keyword & Skills',
    weight: 25,
    score: finalScore,
    percentage: clamp(Math.round((finalScore / 25) * 100), 0, 100),
    breakdown,
    detectedSkills: detectedSkills || [],
    foundKeywords,
    tip: finalScore >= 20 ? 'Excellent keyword coverage!' : 'Enrich your resume with more role-specific keywords.',
  };
}

// ─── 5. Formatting Quality (20 pts) ──────────────────────────────────────────
function scoreFormatting(rawText, pageCount, fileType) {
  const text = rawText || '';
  let earned = 0;
  const breakdown = [];
  const issues = [];

  // 5a. Page Count (5 pts) — ideal: 1 or 2 pages
  let pagePts = 0;
  if (pageCount === 1 || pageCount === 2) pagePts = 5;
  else if (pageCount === 3)               pagePts = 3;
  else if (pageCount > 3)                 pagePts = 1;
  else                                    pagePts = 2; // 0 pages (couldn't detect)
  earned += pagePts;
  if (pageCount > 2) issues.push(`Resume is ${pageCount} pages — keep it to 1-2 pages.`);
  breakdown.push({
    label: 'Page Count',
    score: pagePts, max: 5,
    detail: `${pageCount || '?'} page${pageCount !== 1 ? 's' : ''} (ideal: 1-2)`,
    tip: pageCount > 2 ? 'Trim to 2 pages maximum. Recruiters spend 6 seconds on a resume.' : 'Ideal page count.',
  });

  // 5b. ATS-Friendly Formatting (8 pts) — no tables, columns, symbols
  let formatPts = 8;
  for (const [name, pattern] of Object.entries(UNFRIENDLY_PATTERNS)) {
    if (pattern.test(text)) {
      formatPts -= 2;
      const msgs = {
        tables:      'Tables detected — ATS systems often misparse tabular content.',
        columns:     'Multi-column layout detected — use single-column format.',
        symbols:     'Special symbols detected — replace with standard text.',
        boxDrawing:  'Box-drawing characters detected — remove for ATS compatibility.',
        headerFooter:'Page headers/footers detected — remove them.',
      };
      issues.push(msgs[name]);
    }
  }
  formatPts = clamp(formatPts, 0, 8);
  earned += formatPts;
  breakdown.push({
    label: 'ATS-Friendly Format',
    score: formatPts, max: 8,
    detail: formatPts === 8 ? 'No problematic formatting detected' : `${8 - formatPts} formatting issues found`,
    issues: issues.slice(0, 3),
    tip: formatPts < 8 ? 'Fix formatting issues to ensure ATS can parse your resume.' : 'Clean, ATS-compatible format.',
  });

  // 5c. Consistent Structure (4 pts) — check for repeated section-like patterns
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const shortLines = lines.filter((l) => l.length > 0 && l.length < 50).length;
  const longLines  = lines.filter((l) => l.length >= 50).length;
  const structureRatio = lines.length > 0 ? shortLines / lines.length : 0;
  let structPts = 0;
  if (structureRatio >= 0.15 && structureRatio <= 0.6) structPts = 4;
  else if (structureRatio > 0 && structureRatio < 0.7) structPts = 2;
  earned += structPts;
  breakdown.push({
    label: 'Document Structure',
    score: structPts, max: 4,
    detail: `${lines.length} lines, ${Math.round(structureRatio * 100)}% headings/labels`,
    tip: structPts < 4 ? 'Use clear headings and organized sections.' : 'Well-structured document.',
  });

  // 5d. File Type Bonus (3 pts)
  const typePts = fileType === 'pdf' ? 3 : fileType === 'docx' ? 2 : 1;
  earned += typePts;
  breakdown.push({
    label: 'File Format',
    score: typePts, max: 3,
    detail: `.${fileType?.toUpperCase()} format`,
    tip: fileType === 'pdf' ? 'PDF is the preferred format for most ATS systems.' :
         'PDF format is preferred. Save as PDF if possible.',
  });

  const finalScore = clamp(earned, 0, 20);

  return {
    category: 'Formatting Quality',
    weight: 20,
    score: finalScore,
    percentage: clamp(Math.round((finalScore / 20) * 100), 0, 100),
    breakdown,
    issues,
    tip: issues.length === 0
      ? 'Excellent formatting — ATS-compatible!'
      : `Fix these issues: ${issues[0]}`,
  };
}

// ─── Score Label Helper ────────────────────────────────────────────────────────
function getScoreLabel(score) {
  if (score >= 85) return { label: 'Excellent', color: '#22c55e', grade: 'A' };
  if (score >= 70) return { label: 'Good',      color: '#3b82f6', grade: 'B' };
  if (score >= 55) return { label: 'Average',   color: '#f59e0b', grade: 'C' };
  if (score >= 40) return { label: 'Weak',      color: '#f97316', grade: 'D' };
  return             { label: 'Poor',      color: '#ef4444', grade: 'F' };
}

// ─── Top Suggestions Generator ─────────────────────────────────────────────────
function generateSuggestions(categories) {
  const allTips = [];
  for (const cat of categories) {
    if (cat.score < cat.weight * 0.7) {
      // Under 70% for this category
      if (cat.breakdown) {
        for (const item of cat.breakdown) {
          if (item.score < item.max * 0.7 && item.tip) {
            allTips.push({ category: cat.category, tip: item.tip, impact: item.max - item.score });
          }
        }
      } else if (cat.tip) {
        allTips.push({ category: cat.category, tip: cat.tip, impact: cat.weight - cat.score });
      }
    }
  }
  // Sort by impact descending, take top 8
  return allTips.sort((a, b) => b.impact - a.impact).slice(0, 8);
}

// ─── Master ATS Scorer ────────────────────────────────────────────────────────
function calculateATSScore(resume) {
  const {
    rawText = '',
    sections = [],
    contact = {},
    detectedSkills = [],
    pageCount = 1,
    fileType = 'pdf',
    wordCount = 0,
  } = resume;

  // Score each category
  const contactScore   = scoreContact(contact);
  const sectionScore   = scoreSections(sections);
  const contentScore   = scoreContentQuality(rawText, sections);
  const keywordScore   = scoreKeywords(detectedSkills, sections, rawText);
  const formatScore    = scoreFormatting(rawText, pageCount, fileType);

  const categories = [contactScore, sectionScore, contentScore, keywordScore, formatScore];

  // Overall score = weighted sum (already weighted correctly since weights sum to 100)
  const totalScore = clamp(
    Math.round(
      contactScore.score +
      sectionScore.score +
      contentScore.score +
      keywordScore.score +
      formatScore.score
    ),
    0, 100
  );

  const scoreInfo = getScoreLabel(totalScore);
  const suggestions = generateSuggestions(categories);

  return {
    totalScore,
    ...scoreInfo,
    categories,
    suggestions,
    meta: {
      wordCount,
      pageCount,
      sectionCount: sections.length,
      skillCount: detectedSkills.length,
      fileType,
      analyzedAt: new Date().toISOString(),
    },
  };
}

module.exports = { calculateATSScore, getScoreLabel };
