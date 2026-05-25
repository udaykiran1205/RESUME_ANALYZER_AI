'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, X, CheckCircle, AlertCircle,
  Cloud, Zap, ChevronRight, Loader2, RefreshCw
} from 'lucide-react';
import { useResumeUpload } from '@/hooks/useResume';

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
};
const MAX_SIZE = 10 * 1024 * 1024;

// ─── Progress Ring Component ───────────────────────────────────────────────────
function ProgressRing({ progress, size = 56, stroke = 4, color = 'rgb(99,102,241)' }) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(99,102,241,0.15)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.3s ease' }} />
    </svg>
  );
}

// ─── File Card ────────────────────────────────────────────────────────────────
function FileCard({ file, onRemove, state, uploadProgress, parseProgress }) {
  const ext = file.name.split('.').pop().toUpperCase();
  const size = file.size < 1024 * 1024
    ? `${(file.size / 1024).toFixed(1)} KB`
    : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

  const isActive = state === 'uploading' || state === 'parsing';
  const isDone = state === 'done';
  const isError = state === 'error';

  const currentProgress = state === 'uploading' ? uploadProgress : parseProgress;
  const statusLabel = state === 'uploading' ? `Uploading ${uploadProgress}%`
    : state === 'parsing' ? `Parsing ${parseProgress}%`
    : state === 'done' ? 'Parsed successfully'
    : state === 'error' ? 'Failed'
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${isDone ? 'rgba(34,197,94,0.3)' : isError ? 'rgba(239,68,68,0.3)' : 'rgb(var(--border-color))'}`,
               background: isDone ? 'rgba(34,197,94,0.05)' : isError ? 'rgba(239,68,68,0.05)' : 'rgb(var(--bg-secondary))' }}
    >
      <div className="flex items-center gap-3 p-4">
        {/* File Icon */}
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: ext === 'PDF' ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)' }}>
          <FileText size={20} style={{ color: ext === 'PDF' ? 'rgb(239,68,68)' : 'rgb(99,102,241)' }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'rgb(var(--text-primary))' }}>
            {file.name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>
            {ext} · {size}
            {statusLabel && <span className="ml-2"
              style={{ color: isDone ? 'rgb(34,197,94)' : isError ? 'rgb(239,68,68)' : 'rgb(99,102,241)' }}>
              · {statusLabel}
            </span>}
          </p>
        </div>

        {/* Right Status */}
        {state === 'idle' && (
          <button onClick={onRemove} className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
            style={{ color: 'rgb(var(--text-muted))' }}>
            <X size={16} />
          </button>
        )}
        {isActive && (
          <div className="relative flex-shrink-0">
            <ProgressRing progress={currentProgress} />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold"
              style={{ color: 'rgb(99,102,241)' }}>
              {currentProgress}
            </span>
          </div>
        )}
        {isDone && <CheckCircle size={22} style={{ color: 'rgb(34,197,94)', flexShrink: 0 }} />}
        {isError && <AlertCircle size={22} style={{ color: 'rgb(239,68,68)', flexShrink: 0 }} />}
      </div>

      {/* Progress Bar */}
      {isActive && (
        <div className="h-1" style={{ background: 'rgb(var(--bg-tertiary))' }}>
          <motion.div
            className="h-full"
            initial={{ width: 0 }}
            animate={{ width: `${currentProgress}%` }}
            style={{ background: 'linear-gradient(90deg, rgb(99,102,241), rgb(168,85,247))', transition: 'width 0.3s ease' }}
          />
        </div>
      )}
    </motion.div>
  );
}

// ─── Main DropZone ─────────────────────────────────────────────────────────────
export default function DropZone({ onParsed }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const { uploadState, uploadProgress, parseProgress, resumeData, error, uploadFile, reset } = useResumeUpload();

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) return; // toast handled by dropzone
    if (accepted.length > 0) {
      setSelectedFile(accepted[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    multiple: false,
    disabled: uploadState !== 'idle',
    onDropRejected: (rejected) => {
      rejected.forEach(({ errors }) => {
        errors.forEach((e) => {
          if (e.code === 'file-too-large') import('react-hot-toast').then(({ default: t }) => t.error('File too large. Max 10 MB.'));
          else if (e.code === 'file-invalid-type') import('react-hot-toast').then(({ default: t }) => t.error('Only PDF, DOCX, and DOC files are supported.'));
        });
      });
    },
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    await uploadFile(selectedFile);
    if (onParsed) onParsed(resumeData);
  };

  const handleReset = () => {
    setSelectedFile(null);
    reset();
  };

  // When parse completes, notify parent
  useEffect(() => {
    if (uploadState === 'done' && resumeData && onParsed) {
      onParsed(resumeData);
    }
  }, [uploadState, resumeData, onParsed]);

  const dropzoneClass = isDragReject ? 'rejected' : isDragActive ? 'active' : '';
  const isActive = uploadState !== 'idle';

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`dropzone p-10 text-center select-none ${dropzoneClass} ${isActive ? 'pointer-events-none' : ''}`}
        style={{ opacity: isActive ? 0.7 : 1 }}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {isDragActive ? (
            <motion.div key="drag" initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center animate-bounce"
                style={{ background: isDragReject ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)' }}>
                {isDragReject
                  ? <AlertCircle size={28} style={{ color: 'rgb(239,68,68)' }} />
                  : <Cloud size={28} style={{ color: 'rgb(99,102,241)' }} />}
              </div>
              <p className="text-base font-semibold"
                style={{ color: isDragReject ? 'rgb(239,68,68)' : 'rgb(99,102,241)' }}>
                {isDragReject ? 'File type not supported!' : 'Drop it here!'}
              </p>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <motion.div
                animate={isActive ? {} : { y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.1)', border: '1.5px dashed rgba(99,102,241,0.4)' }}>
                <Upload size={26} style={{ color: 'rgb(99,102,241)' }} />
              </motion.div>
              <div>
                <p className="text-base font-semibold mb-1" style={{ color: 'rgb(var(--text-primary))' }}>
                  {selectedFile ? 'File selected — ready to analyze' : 'Drag & drop your resume here'}
                </p>
                {!selectedFile && (
                  <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
                    or <span className="font-medium" style={{ color: 'rgb(99,102,241)' }}>click to browse</span>
                  </p>
                )}
              </div>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {['.PDF', '.DOCX', '.DOC'].map((f) => (
                  <span key={f} className="badge badge-primary">{f}</span>
                ))}
                <span className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>Max 10 MB</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* File Card */}
      <AnimatePresence>
        {selectedFile && (
          <FileCard
            file={selectedFile}
            onRemove={() => setSelectedFile(null)}
            state={uploadState}
            uploadProgress={uploadProgress}
            parseProgress={parseProgress}
          />
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <AnimatePresence mode="wait">
        {selectedFile && uploadState === 'idle' && (
          <motion.button key="upload-btn"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            onClick={handleUpload}
            className="btn-primary w-full" id="analyze-btn">
            <Zap size={16} />
            Analyze with AI
            <ChevronRight size={16} />
          </motion.button>
        )}

        {(uploadState === 'uploading' || uploadState === 'parsing') && (
          <motion.div key="progress-btn"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="w-full py-3 px-6 rounded-xl flex items-center justify-center gap-3 text-sm font-semibold"
            style={{ background: 'rgba(99,102,241,0.1)', color: 'rgb(99,102,241)' }}>
            <Loader2 size={16} className="animate-spin" />
            {uploadState === 'uploading' ? `Uploading... ${uploadProgress}%` : `Parsing resume... ${parseProgress}%`}
          </motion.div>
        )}

        {(uploadState === 'done' || uploadState === 'error') && (
          <motion.button key="reset-btn"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            onClick={handleReset}
            className="btn-secondary w-full">
            <RefreshCw size={16} />
            {uploadState === 'done' ? 'Upload Another Resume' : 'Try Again'}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
