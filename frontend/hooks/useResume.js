'use client';

import { useState, useCallback, useRef } from 'react';
import { resumeAPI } from '@/lib/resumeAPI';
import toast from 'react-hot-toast';

/**
 * useResumeUpload — manages the full upload → parse → poll lifecycle
 */
export function useResumeUpload() {
  const [uploadState, setUploadState] = useState('idle'); // idle | uploading | parsing | done | error
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parseProgress, setParseProgress] = useState(0);
  const [resumeId, setResumeId] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  // ─── Stop polling ───────────────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // ─── Poll parse status ──────────────────────────────────────────────────────
  const startPolling = useCallback((id) => {
    let attempts = 0;
    const maxAttempts = 30; // 30 * 2s = 60s max

    // Simulate parse progress animation
    let fakeProgress = 10;
    const progressInterval = setInterval(() => {
      fakeProgress = Math.min(fakeProgress + Math.random() * 8, 90);
      setParseProgress(Math.round(fakeProgress));
    }, 400);

    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const { data } = await resumeAPI.getStatus(id);

        if (data.status === 'parsed' || data.status === 'analyzed') {
          clearInterval(progressInterval);
          setParseProgress(100);
          stopPolling();

          // Fetch full resume data
          const { data: full } = await resumeAPI.getById(id);
          setResumeData(full.resume);
          setUploadState('done');
          toast.success(`Resume parsed! Found ${full.resume.sections?.length || 0} sections and ${full.resume.detectedSkills?.length || 0} skills.`);

        } else if (data.status === 'error') {
          clearInterval(progressInterval);
          stopPolling();
          setError(data.parseError || 'Parsing failed');
          setUploadState('error');
          toast.error('Resume parsing failed. Please try a different file.');
        }

        if (attempts >= maxAttempts) {
          clearInterval(progressInterval);
          stopPolling();
          setError('Parsing timed out. Please try again.');
          setUploadState('error');
        }
      } catch (err) {
        console.warn('Status poll error:', err.message);
      }
    }, 2000);
  }, [stopPolling]);

  // ─── Main upload handler ────────────────────────────────────────────────────
  const uploadFile = useCallback(async (file) => {
    try {
      setUploadState('uploading');
      setUploadProgress(0);
      setParseProgress(0);
      setError(null);
      setResumeData(null);
      stopPolling();

      const { data } = await resumeAPI.upload(file, (pct) => {
        setUploadProgress(pct);
      });

      setResumeId(data.resumeId);
      setUploadProgress(100);
      setUploadState('parsing');
      toast.success('File uploaded! Extracting resume content...');

      startPolling(data.resumeId);

    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Upload failed';
      setError(msg);
      setUploadState('error');
      toast.error(msg);
    }
  }, [startPolling, stopPolling]);

  // ─── Reset state ────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    stopPolling();
    setUploadState('idle');
    setUploadProgress(0);
    setParseProgress(0);
    setResumeId(null);
    setResumeData(null);
    setError(null);
  }, [stopPolling]);

  return {
    uploadState,
    uploadProgress,
    parseProgress,
    resumeId,
    resumeData,
    error,
    uploadFile,
    reset,
    isUploading: uploadState === 'uploading',
    isParsing: uploadState === 'parsing',
    isDone: uploadState === 'done',
    isError: uploadState === 'error',
    isIdle: uploadState === 'idle',
  };
}

/**
 * useResumes — fetches and manages the user's resume list
 */
export function useResumes() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchResumes = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await resumeAPI.getAll(page);
      setResumes(data.resumes);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load resumes');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteResume = useCallback(async (id) => {
    try {
      await resumeAPI.delete(id);
      setResumes((prev) => prev.filter((r) => r._id !== id));
      toast.success('Resume deleted.');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
      return false;
    }
  }, []);

  return { resumes, loading, error, pagination, fetchResumes, deleteResume };
}
