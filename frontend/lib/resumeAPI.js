import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({ baseURL: BASE_URL });

// Auto-attach JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('aia_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Resume Upload API ────────────────────────────────────────────────────────
export const resumeAPI = {
  /**
   * Upload a resume file. Returns { resumeId, status } immediately.
   * Parse happens asynchronously — poll status endpoint.
   */
  upload: (file, onProgress) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      },
    });
  },

  /** Poll parse status for a resume */
  getStatus: (resumeId) => api.get(`/upload/status/${resumeId}`),

  /** Get all user resumes (paginated) */
  getAll: (page = 1, limit = 10) =>
    api.get('/upload/resumes', { params: { page, limit } }),

  /** Get full resume details including sections */
  getById: (resumeId) => api.get(`/upload/resumes/${resumeId}`),

  /** Delete a resume */
  delete: (resumeId) => api.delete(`/upload/resumes/${resumeId}`),

  /** Get raw extracted text */
  getText: (resumeId) => api.get(`/upload/resumes/${resumeId}/text`),
};

// ─── ATS API ──────────────────────────────────────────────────────────────────
export const atsAPI = {
  /** Trigger ATS analysis for a resume */
  analyze: (resumeId) => api.post(`/ats/analyze/${resumeId}`),

  /** Get stored ATS score for a resume */
  getScore: (resumeId) => api.get(`/ats/score/${resumeId}`),

  /** Get overview across all user resumes */
  getOverview: () => api.get('/ats/overview'),

  /** Trigger Gemini AI analysis (jobRole is optional) */
  aiAnalyze: (resumeId, jobRole = '') =>
    api.post(`/ats/ai-analyze/${resumeId}`, { jobRole }),

  /** Get stored Gemini AI analysis for a resume */
  getAIAnalysis: (resumeId) => api.get(`/ats/ai-analysis/${resumeId}`),
};

export default api;
