/**
 * geminiAnalyzer.js
 * Google Gemini AI integration for deep resume analysis.
 * Produces: categorized skills, missing keywords, improvement tips,
 * professional summary, job-role fit analysis, and dynamic recommendations.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─── Initialise Gemini Client ─────────────────────────────────────────────────
let genAI = null;

// Model fallback chain — tried in order if quota is hit
const MODEL_CHAIN = [
  'gemini-2.5-flash-lite',   // ✅ Confirmed working — lowest quota usage
  'gemini-2.5-flash',        // ✅ Available, higher capability
  'gemini-2.0-flash',        // Fallback if 2.5 quota is hit
  'gemini-2.0-flash-lite',   // Lightest 2.0 model
  'gemini-flash-lite-latest', // Always points to latest lite
];

function getClient() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY is not configured. Add it to your .env file.');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/** Sleep helper for retry backoff */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Returns true if the error is a retryable quota/rate-limit error */
function isQuotaError(err) {
  const msg = err.message || '';
  return msg.includes('429') || msg.includes('Too Many Requests') || msg.includes('quota');
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────
function buildPrompt(resume, jobRole) {
  const {
    rawText = '',
    sections = [],
    contact = {},
    detectedSkills = [],
    wordCount = 0,
    pageCount = 1,
    atsScore = null,
  } = resume;

  // Summarise existing sections for context
  const sectionSummary = sections
    .map((s) => `[${s.title || s.key}]: ${(s.content || '').slice(0, 300)}`)
    .join('\n');

  const targetRole = jobRole?.trim() || 'General Professional';

  // Trim raw text to avoid exceeding context window
  const trimmedText = rawText.slice(0, 6000);

  return `
You are an expert career coach and resume analyst with 15+ years of experience in talent acquisition and technical recruiting.

Analyze the following resume for the target job role: **"${targetRole}"**

--- RESUME CONTENT ---
${trimmedText}

--- DETECTED SECTIONS ---
${sectionSummary || 'No structured sections detected.'}

--- ALREADY DETECTED SKILLS ---
${detectedSkills.join(', ') || 'None'}

--- RESUME METADATA ---
- Word Count: ${wordCount}
- Pages: ${pageCount}
- Current ATS Score: ${atsScore ?? 'Not yet scored'}

--- YOUR TASK ---
Provide a comprehensive AI analysis. Respond ONLY with a valid JSON object in this exact structure:

{
  "professionalSummary": "<Write a compelling 3-4 sentence professional summary that this person could use on their resume, tailored for '${targetRole}'. Base it on their actual experience. Do NOT use placeholders.>",

  "detectedSkills": {
    "technical": ["<skill1>", "<skill2>", "..."],
    "soft": ["<skill1>", "<skill2>", "..."],
    "tools": ["<tool1>", "<tool2>", "..."]
  },

  "missingKeywords": [
    {
      "keyword": "<important keyword missing for ${targetRole}>",
      "priority": "<high|medium|low>",
      "reason": "<1 sentence why this keyword matters for this role>"
    }
  ],

  "improvementTips": [
    {
      "category": "<Contact|Content|Format|Skills|Experience|Education>",
      "tip": "<specific actionable improvement tip>",
      "impact": <number 1-10>,
      "example": "<brief concrete example or before/after>"
    }
  ],

  "roleAnalysis": {
    "fitScore": <0-100>,
    "fitLabel": "<Excellent Fit|Good Fit|Partial Fit|Needs Work|Poor Fit>",
    "targetRole": "${targetRole}",
    "strengths": ["<strength1 relevant to role>", "<strength2>", "<strength3>"],
    "gaps": ["<gap1 for this role>", "<gap2>"],
    "verdict": "<2-3 sentence honest assessment of how well this resume fits the target role>"
  },

  "dynamicRecommendations": [
    {
      "title": "<short action title>",
      "description": "<detailed recommendation, 1-2 sentences>",
      "priority": "<high|medium|low>"
    }
  ]
}

Rules:
- Return ONLY valid JSON, no markdown fences, no commentary outside JSON.
- missingKeywords: list 5-8 most important missing keywords for the target role.
- improvementTips: list 5-7 highest-impact tips sorted by impact descending.
- dynamicRecommendations: list 4-6 specific, personalized next-step actions.
- detectedSkills.technical: all hard/technical skills found in the resume.
- detectedSkills.soft: interpersonal and professional skills.
- detectedSkills.tools: software, platforms, frameworks, tools.
- All content must be specific to THIS resume — never generic boilerplate.
`.trim();
}

// ─── Response Parser ──────────────────────────────────────────────────────────
function parseGeminiResponse(text) {
  // Strip any accidental markdown fences
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Try to extract JSON from the response if there's surrounding text
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error('Gemini returned invalid JSON. Please retry.');
    }
  }

  // Validate required top-level keys
  const required = [
    'professionalSummary', 'detectedSkills', 'missingKeywords',
    'improvementTips', 'roleAnalysis', 'dynamicRecommendations',
  ];
  for (const key of required) {
    if (!(key in parsed)) {
      throw new Error(`AI response missing required field: "${key}"`);
    }
  }

  return parsed;
}

// ─── Fallback Generator ───────────────────────────────────────────────────────
// Returns a structured fallback when Gemini is unavailable
function buildFallback(resume, jobRole) {
  const skills = resume.detectedSkills || [];
  const role = jobRole || 'the target role';
  return {
    professionalSummary: `Based on the resume content, this candidate brings a diverse set of skills including ${skills.slice(0, 3).join(', ') || 'various technical abilities'}. Their experience positions them as a potential candidate for ${role}. Further tailoring of the resume content could improve alignment with this specific role.`,
    detectedSkills: {
      technical: skills.filter((s) => !['communication', 'leadership', 'teamwork'].includes(s.toLowerCase())),
      soft: ['Communication', 'Problem Solving', 'Teamwork'],
      tools: [],
    },
    missingKeywords: [
      { keyword: 'Quantified achievements', priority: 'high', reason: 'Metrics and numbers significantly improve ATS scoring and recruiter engagement.' },
      { keyword: 'Role-specific certifications', priority: 'medium', reason: 'Certifications signal validated expertise for this role.' },
      { keyword: 'Industry keywords', priority: 'medium', reason: `Adding ${role}-specific terminology improves keyword matching.` },
    ],
    improvementTips: [
      { category: 'Content', tip: 'Add measurable achievements with numbers and percentages.', impact: 9, example: 'Instead of "improved performance", write "improved load time by 40%"' },
      { category: 'Skills', tip: `Tailor your skills section for ${role} by adding role-specific keywords.`, impact: 8, example: 'Review job descriptions and mirror their exact terminology.' },
      { category: 'Format', tip: 'Use a single-column ATS-friendly layout with clear section headers.', impact: 7, example: 'Avoid tables, graphics, or multi-column designs.' },
    ],
    roleAnalysis: {
      fitScore: 55,
      fitLabel: 'Partial Fit',
      targetRole: role,
      strengths: ['Relevant experience detected', 'Skills profile present'],
      gaps: [`Needs more ${role}-specific keywords`, 'Quantified achievements missing'],
      verdict: `This resume shows potential for ${role} but needs tailoring to better match the role requirements. Focus on adding role-specific keywords and quantified achievements.`,
    },
    dynamicRecommendations: [
      { title: 'Quantify Your Impact', description: 'Go through each bullet point in your experience section and add numbers, percentages, or scale.', priority: 'high' },
      { title: 'Tailor for the Role', description: `Study 3-5 ${role} job descriptions and mirror the exact keywords and phrases used.`, priority: 'high' },
      { title: 'Strengthen Your Summary', description: 'Add a professional summary section targeting this specific role at the top of your resume.', priority: 'medium' },
      { title: 'Add Certifications', description: 'Relevant certifications for this role will immediately boost your credibility and ATS score.', priority: 'medium' },
    ],
    _fallback: true,
  };
}

// ─── Main Analyzer Function ───────────────────────────────────────────────────
/**
 * @param {Object} resume - Resume document from MongoDB
 * @param {string} jobRole - Target job role (e.g., "Senior React Developer")
 * @returns {Promise<Object>} Structured AI analysis result
 */
async function analyzeWithGemini(resume, jobRole) {
  const startTime = Date.now();
  const prompt = buildPrompt(resume, jobRole);
  const client = getClient();

  console.log(`🤖 Gemini AI analyzing resume for role: "${jobRole || 'General'}"`);

  // ── Try each model in the fallback chain ──────────────────────────────────
  for (const modelName of MODEL_CHAIN) {
    const MAX_RETRIES = 2;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const model = client.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.4,
            topP: 0.9,
            maxOutputTokens: 4096,
          },
        });

        if (attempt > 0) {
          const backoff = attempt * 5000;
          console.log(`⏳ Retry ${attempt}/${MAX_RETRIES} for ${modelName} after ${backoff}ms…`);
          await sleep(backoff);
        }

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const parsed = parseGeminiResponse(responseText);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✅ Gemini analysis complete with ${modelName} in ${elapsed}s`);

        return {
          ...parsed,
          targetRole: jobRole || 'General Professional',
          analyzedAt: new Date().toISOString(),
          model: modelName,
          _fallback: false,
        };
      } catch (error) {
        // Config error — re-throw immediately
        if (error.message?.includes('GEMINI_API_KEY')) throw error;

        const isQuota = isQuotaError(error);
        const isLastAttempt = attempt === MAX_RETRIES;

        if (isQuota && !isLastAttempt) {
          console.warn(`⚠️  Rate limit on ${modelName} (attempt ${attempt + 1}), retrying…`);
          continue; // retry same model
        }

        if (isQuota && isLastAttempt) {
          console.warn(`❌ Quota exhausted for ${modelName}, trying next model…`);
          break; // move to next model in chain
        }

        // Non-quota error — log and try next model
        console.error(`⚠️  ${modelName} error:`, error.message.slice(0, 120));
        break;
      }
    }
  }

  // All models exhausted — return graceful fallback
  console.warn('↩️  All Gemini models exhausted. Returning fallback analysis.');
  return {
    ...buildFallback(resume, jobRole),
    targetRole: jobRole || 'General Professional',
    analyzedAt: new Date().toISOString(),
    model: 'fallback',
    error: 'All Gemini models quota exceeded. Please try again later or upgrade your Google AI plan.',
  };
}

module.exports = { analyzeWithGemini };
