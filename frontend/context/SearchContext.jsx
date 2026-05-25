'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { resumeAPI } from '@/lib/resumeAPI';

const SearchContext = createContext(null);

export function SearchProvider({ children }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef(null);

  const search = useCallback(async (q) => {
    setQuery(q);

    if (!q.trim()) {
      setResults([]);
      setIsOpen(false);
      setIsSearching(false);
      return;
    }

    setIsOpen(true);
    setIsSearching(true);

    // Debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await resumeAPI.getAll(1, 50);
        const resumes = data?.resumes || data?.data || [];
        const q_lower = q.toLowerCase();
        const filtered = resumes.filter((r) =>
          r.originalName?.toLowerCase().includes(q_lower) ||
          r.name?.toLowerCase().includes(q_lower) ||
          r.status?.toLowerCase().includes(q_lower) ||
          r.targetRole?.toLowerCase().includes(q_lower)
        );
        setResults(filtered);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setIsSearching(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  return (
    <SearchContext.Provider value={{ query, results, isSearching, isOpen, setIsOpen, search, clear }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used within SearchProvider');
  return ctx;
}
