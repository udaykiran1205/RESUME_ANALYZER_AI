/**
 * resumeParser.js
 * Handles text extraction from PDF/DOCX files and intelligent
 * section detection using pattern matching and NLP heuristics.
 */

const fs = require('fs');
const path = require('path');

// ─── Section Header Patterns ───────────────────────────────────────────────────
// Ordered by priority — more specific patterns first
const SECTION_PATTERNS = {
  contact: {
    patterns: [/^(contact|personal\s*info(rmation)?|about\s*me)\s*:?\s*$/i],
    order: 0,
  },
  summary: {
    patterns: [
      /^(professional\s*summary|summary|objective|career\s*objective|profile|about|overview|executive\s*summary)\s*:?\s*$/i,
    ],
    order: 1,
  },
  experience: {
    patterns: [
      /^(work\s*experience|professional\s*experience|employment\s*(history)?|experience|career\s*history|work\s*history|positions?\s*held)\s*:?\s*$/i,
    ],
    order: 2,
  },
  education: {
    patterns: [
      /^(education(al)?\s*(background|qualifications?)?|academic\s*(background|qualifications?)?|qualifications?|degrees?)\s*:?\s*$/i,
    ],
    order: 3,
  },
  skills: {
    patterns: [
      /^(skills?|technical\s*skills?|core\s*(competencies|skills?)|key\s*skills?|areas?\s*of\s*expertise|technologies?|tools?\s*&\s*technologies?|competencies)\s*:?\s*$/i,
    ],
    order: 4,
  },
  projects: {
    patterns: [
      /^(projects?|personal\s*projects?|key\s*projects?|notable\s*projects?|portfolio|selected\s*projects?|academic\s*projects?)\s*:?\s*$/i,
    ],
    order: 5,
  },
  certifications: {
    patterns: [
      /^(certifications?|certificates?|licenses?\s*&?\s*certifications?|professional\s*certifications?|accreditations?)\s*:?\s*$/i,
    ],
    order: 6,
  },
  awards: {
    patterns: [
      /^(awards?|honors?(\s*&\s*awards?)?|achievements?|accomplishments?|recognitions?)\s*:?\s*$/i,
    ],
    order: 7,
  },
  languages: {
    patterns: [/^(languages?|language\s*proficiency|linguistic\s*skills?)\s*:?\s*$/i],
    order: 8,
  },
  publications: {
    patterns: [/^(publications?|research|papers?|articles?)\s*:?\s*$/i],
    order: 9,
  },
  volunteer: {
    patterns: [
      /^(volunteer(ing)?|community\s*service|social\s*work|extracurricular)\s*:?\s*$/i,
    ],
    order: 10,
  },
  interests: {
    patterns: [/^(interests?|hobbies|activities|personal\s*interests?)\s*:?\s*$/i],
    order: 11,
  },
  references: {
    patterns: [/^(references?)\s*:?\s*$/i],
    order: 12,
  },
};

// ─── Contact Extraction Patterns ──────────────────────────────────────────────
const CONTACT_PATTERNS = {
  email:    /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/,
  phone:    /(\+?[\d\s\-().]{7,20}(?:ext\.?\s*\d+)?)/,
  linkedin: /(?:linkedin\.com\/in\/)([\w\-]+)/i,
  github:   /(?:github\.com\/)([\w\-]+)/i,
  website:  /(?:https?:\/\/)?(?:www\.)([\w\-]+\.[\w.]+)/i,
};

// ─── Tech Skills Dictionary ───────────────────────────────────────────────────
const TECH_SKILLS = [
  // Languages
  'JavaScript','TypeScript','Python','Java','C++','C#','Go','Rust','PHP','Ruby','Swift','Kotlin','Scala','R','MATLAB',
  'C','Perl','Bash','Shell','SQL','NoSQL','HTML','CSS','HTML5','CSS3','XML','JSON','YAML','GraphQL',
  // Frontend
  'React','Next.js','Vue.js','Angular','Svelte','jQuery','Bootstrap','Tailwind CSS','Sass','LESS',
  'Redux','MobX','Zustand','React Query','Webpack','Vite','Parcel','Babel',
  // Backend
  'Node.js','Express.js','Django','Flask','FastAPI','Spring Boot','Laravel','Rails','NestJS','Koa',
  'Gin','Echo','Fiber','ASP.NET','Symfony',
  // Databases
  'MongoDB','PostgreSQL','MySQL','SQLite','Redis','Elasticsearch','Cassandra','DynamoDB','Firebase',
  'Oracle','MariaDB','CouchDB','Neo4j','InfluxDB','Supabase',
  // Cloud & DevOps
  'AWS','Azure','GCP','Docker','Kubernetes','Terraform','Ansible','Jenkins','GitHub Actions',
  'CircleCI','Travis CI','Nginx','Apache','Linux','Ubuntu','Git','GitHub','GitLab','Bitbucket',
  // AI/ML
  'TensorFlow','PyTorch','Keras','scikit-learn','pandas','NumPy','Matplotlib','OpenCV',
  'Hugging Face','LangChain','OpenAI','Jupyter','NLTK','spaCy',
  // Mobile
  'React Native','Flutter','Ionic','Xamarin','Android','iOS','Expo',
  // Tools
  'Jira','Confluence','Slack','Figma','Postman','Swagger','VS Code','IntelliJ','Eclipse',
  // Methodologies
  'Agile','Scrum','Kanban','CI/CD','TDD','BDD','REST','SOAP','gRPC','Microservices',
];

const SKILLS_SET = new Set(TECH_SKILLS.map((s) => s.toLowerCase()));

// ─── PDF Text Extraction ──────────────────────────────────────────────────────
async function extractFromPDF(filePath) {
  try {
    // Dynamic import to handle pdf-parse properly
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);

    const data = await pdfParse(dataBuffer, {
      // Preserve page structure
      pagerender: function (pageData) {
        return pageData.getTextContent({ normalizeWhitespace: true }).then(function (textContent) {
          let lastY, text = '';
          for (const item of textContent.items) {
            if (lastY === item.transform[5] || !lastY) {
              text += item.str;
            } else {
              text += '\n' + item.str;
            }
            lastY = item.transform[5];
          }
          return text;
        });
      },
    });

    return {
      text: data.text,
      pageCount: data.numpages,
      info: data.info,
    };
  } catch (error) {
    // Fallback: basic pdf-parse without custom renderer
    try {
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return {
        text: data.text,
        pageCount: data.numpages,
        info: data.info || {},
      };
    } catch (fallbackError) {
      throw new Error(`PDF extraction failed: ${fallbackError.message}`);
    }
  }
}

// ─── DOCX Text Extraction ─────────────────────────────────────────────────────
async function extractFromDOCX(filePath) {
  try {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });

    if (result.messages && result.messages.length > 0) {
      const warnings = result.messages.filter((m) => m.type === 'warning');
      if (warnings.length > 0) {
        console.warn('DOCX parse warnings:', warnings.map((w) => w.message).join('; '));
      }
    }

    return {
      text: result.value,
      pageCount: estimatePageCount(result.value),
      info: {},
    };
  } catch (error) {
    throw new Error(`DOCX extraction failed: ${error.message}`);
  }
}

// ─── Page Count Estimator (for DOCX) ─────────────────────────────────────────
function estimatePageCount(text) {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 350)); // ~350 words per page
}

// ─── Main Extraction Router ───────────────────────────────────────────────────
async function extractText(filePath, fileType) {
  switch (fileType) {
    case 'pdf':
      return extractFromPDF(filePath);
    case 'docx':
    case 'doc':
      return extractFromDOCX(filePath);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

// ─── Contact Info Extraction ──────────────────────────────────────────────────
function extractContactInfo(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const contact = {
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    website: '',
  };

  // Email
  const emailMatch = text.match(CONTACT_PATTERNS.email);
  if (emailMatch) contact.email = emailMatch[0].toLowerCase();

  // Phone — look in first 20 lines
  const headerText = lines.slice(0, 20).join('\n');
  const phoneMatch = headerText.match(/(?:phone|tel|mobile|cell)?:?\s*(\+?[\d][\d\s\-().]{6,18}[\d])/i);
  if (phoneMatch) {
    contact.phone = phoneMatch[1].trim().replace(/\s+/g, ' ');
  }

  // LinkedIn
  const linkedinMatch = text.match(/linkedin\.com\/in\/([\w\-]+)/i);
  if (linkedinMatch) contact.linkedin = `https://linkedin.com/in/${linkedinMatch[1]}`;

  // GitHub
  const githubMatch = text.match(/github\.com\/([\w\-]+)/i);
  if (githubMatch) contact.github = `https://github.com/${githubMatch[1]}`;

  // Name: typically the first non-empty line in the document
  const nameLine = lines[0];
  if (nameLine && nameLine.length < 60 && !/[@\d]/.test(nameLine) && !nameLine.match(/resume|cv/i)) {
    contact.name = nameLine;
  }

  // Location: look for city, state / country patterns in first 15 lines
  const locationPattern = /\b([A-Za-z\s]+,\s*[A-Z]{2,}(?:\s*\d{5})?)\b/;
  const topText = lines.slice(0, 15).join('\n');
  const locMatch = topText.match(locationPattern);
  if (locMatch && !locMatch[0].match(/university|college|school|institute/i)) {
    contact.location = locMatch[0].trim();
  }

  return contact;
}

// ─── Section Detection and Splitting ─────────────────────────────────────────
function detectSections(text) {
  const lines = text.split('\n');
  const sections = [];
  let currentSection = null;
  let currentLines = [];
  let sectionOrder = 0;

  const identifySection = (line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 80) return null; // Headers are short

    for (const [sectionKey, sectionConfig] of Object.entries(SECTION_PATTERNS)) {
      for (const pattern of sectionConfig.patterns) {
        if (pattern.test(trimmed)) {
          return { key: sectionKey, title: trimmed, order: sectionConfig.order };
        }
      }
    }
    return null;
  };

  for (const line of lines) {
    const detected = identifySection(line);

    if (detected) {
      // Save previous section
      if (currentSection) {
        const content = currentLines.join('\n').trim();
        if (content.length > 0) {
          sections.push({
            title: currentSection.title,
            key: currentSection.key,
            content,
            items: extractBulletItems(content),
            order: sectionOrder++,
          });
        }
      }
      currentSection = detected;
      currentLines = [];
    } else if (currentSection) {
      currentLines.push(line);
    }
    // Lines before any section detected = header/contact area (handled separately)
  }

  // Push last section
  if (currentSection && currentLines.length > 0) {
    const content = currentLines.join('\n').trim();
    if (content.length > 0) {
      sections.push({
        title: currentSection.title,
        key: currentSection.key,
        content,
        items: extractBulletItems(content),
        order: sectionOrder++,
      });
    }
  }

  return sections;
}

// ─── Bullet Item Extraction ───────────────────────────────────────────────────
function extractBulletItems(text) {
  const bulletPattern = /^[\s]*[•\-\*\u2022\u25CF\u25AA►▸→>]\s+(.+)$/gm;
  const items = [];
  let match;
  while ((match = bulletPattern.exec(text)) !== null) {
    const item = match[1].trim();
    if (item.length > 5) items.push(item);
  }
  return items;
}

// ─── Skill Detection from Raw Text ───────────────────────────────────────────
function extractSkills(text) {
  const detectedSkills = new Set();
  const lowerText = text.toLowerCase();

  for (const skill of TECH_SKILLS) {
    const lowerSkill = skill.toLowerCase();
    // Word-boundary match to avoid partial matches
    const escapedSkill = lowerSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<![a-z])${escapedSkill}(?![a-z])`, 'i');
    if (regex.test(lowerText)) {
      detectedSkills.add(skill); // Add canonical casing
    }
  }

  return [...detectedSkills].sort();
}

// ─── Text Cleanup ─────────────────────────────────────────────────────────────
function cleanText(text) {
  return text
    .replace(/\r\n/g, '\n')          // normalize line endings
    .replace(/\r/g, '\n')
    .replace(/\t/g, '  ')            // tabs to spaces
    .replace(/[ ]{3,}/g, '  ')       // collapse excessive spaces
    .replace(/\n{4,}/g, '\n\n\n')    // max 3 consecutive newlines
    .trim();
}

// ─── Master Parse Function ────────────────────────────────────────────────────
async function parseResume(filePath, fileType) {
  try {
    // 1. Extract raw text
    const extracted = await extractText(filePath, fileType);
    const rawText = cleanText(extracted.text);

    // 2. Count stats
    const wordCount = rawText.split(/\s+/).filter(Boolean).length;
    const characterCount = rawText.length;

    // 3. Extract contact info
    const contact = extractContactInfo(rawText);

    // 4. Detect sections
    const sections = detectSections(rawText);

    // 5. Extract skills
    const detectedSkills = extractSkills(rawText);

    return {
      success: true,
      rawText,
      pageCount: extracted.pageCount,
      wordCount,
      characterCount,
      contact,
      sections,
      detectedSkills,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      rawText: '',
      pageCount: 0,
      wordCount: 0,
      characterCount: 0,
      contact: {},
      sections: [],
      detectedSkills: [],
    };
  }
}

module.exports = {
  parseResume,
  extractText,
  extractContactInfo,
  detectSections,
  extractSkills,
  TECH_SKILLS,
};
