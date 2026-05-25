'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Moon, Sun, Search, ChevronDown, FileText, CheckCircle, Clock, XCircle, BarChart3, X, Loader2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useSearch } from '@/context/SearchContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const statusConfig = {
  analyzed:  { icon: CheckCircle, color: 'rgb(34,197,94)',  label: 'Analyzed' },
  pending:   { icon: Clock,       color: 'rgb(251,191,36)', label: 'Pending' },
  failed:    { icon: XCircle,     color: 'rgb(239,68,68)',  label: 'Failed' },
  analyzing: { icon: BarChart3,   color: 'rgb(99,102,241)', label: 'Analyzing' },
};

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Topbar({ onMenuClick, title = 'Dashboard' }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { query, results, isSearching, isOpen, setIsOpen, search, clear } = useSearch();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
      if (!e.target.closest('[data-user-menu]')) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [setIsOpen]);

  return (
    <header className="topbar h-16 px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Left: Menu + Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          id="topbar-menu"
          onClick={onMenuClick}
          className="p-2 rounded-lg md:hidden transition-colors"
          style={{ color: 'rgb(var(--text-secondary))' }}
        >
          <Menu size={20} />
        </button>
        <div>
          <h2 className="text-base font-semibold truncate" style={{ color: 'rgb(var(--text-primary))' }}>
            {title}
          </h2>
          <p className="text-xs hidden sm:block" style={{ color: 'rgb(var(--text-muted))' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Center: Search */}
      <div ref={searchRef} className="hidden md:flex items-center flex-1 max-w-sm mx-4 relative">
        <div className="relative w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10"
            style={{ color: query ? 'rgb(99,102,241)' : 'rgb(var(--text-muted))' }} />
          <input
            ref={inputRef}
            id="topbar-search"
            type="text"
            value={query}
            onChange={(e) => search(e.target.value)}
            onFocus={() => query && setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { clear(); inputRef.current?.blur(); }
            }}
            placeholder="Search resumes, analyses..."
            className="input-field pl-9 py-2 text-sm pr-8"
            style={{ borderRadius: '10px', transition: 'all 0.2s' }}
            autoComplete="off"
          />
          {query && (
            <button
              onClick={clear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full transition-colors hover:bg-white/10"
              style={{ color: 'rgb(var(--text-muted))' }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl overflow-hidden z-50"
              style={{
                background: 'rgb(var(--card-bg))',
                border: '1px solid rgb(var(--border-color))',
                maxHeight: '360px',
                overflowY: 'auto',
              }}
            >
              {/* Search header */}
              <div className="px-4 py-2.5 flex items-center justify-between"
                style={{ borderBottom: '1px solid rgb(var(--border-color))', background: 'rgb(var(--bg-tertiary))' }}>
                <span className="text-xs font-medium" style={{ color: 'rgb(var(--text-muted))' }}>
                  {isSearching ? 'Searching…' : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
                </span>
                {isSearching && <Loader2 size={12} className="animate-spin" style={{ color: 'rgb(99,102,241)' }} />}
              </div>

              {/* Results */}
              {!isSearching && results.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <Search size={22} className="mx-auto mb-2" style={{ color: 'rgb(var(--text-muted))' }} />
                  <p className="text-sm font-medium" style={{ color: 'rgb(var(--text-secondary))' }}>No resumes found</p>
                  <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-muted))' }}>Try a different search term</p>
                </div>
              )}

              {results.map((resume, i) => {
                const statusKey = resume.status?.toLowerCase() || 'pending';
                const status = statusConfig[statusKey] || statusConfig.pending;
                const StatusIcon = status.icon;
                const name = resume.originalName || resume.name || 'Untitled Resume';
                const score = resume.atsScore;
                return (
                  <Link
                    key={resume._id || i}
                    href={`/dashboard/ats`}
                    onClick={() => { setIsOpen(false); inputRef.current?.blur(); }}
                  >
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all group"
                      style={{ borderBottom: '1px solid rgba(var(--border-color), 0.5)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgb(var(--bg-tertiary))'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Icon */}
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(99,102,241,0.12)' }}>
                        <FileText size={16} style={{ color: 'rgb(99,102,241)' }} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'rgb(var(--text-primary))' }}>
                          {name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StatusIcon size={10} style={{ color: status.color }} />
                          <span className="text-xs" style={{ color: status.color }}>{status.label}</span>
                          {resume.fileSize && (
                            <span className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                              · {formatBytes(resume.fileSize)}
                            </span>
                          )}
                          {resume.createdAt && (
                            <span className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                              · {timeAgo(resume.createdAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ATS Score */}
                      {score != null && score > 0 && (
                        <div className="flex-shrink-0 text-right">
                          <span className="text-sm font-bold"
                            style={{ color: score >= 80 ? 'rgb(34,197,94)' : score >= 60 ? 'rgb(251,191,36)' : 'rgb(239,68,68)' }}>
                            {score}%
                          </span>
                          <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>ATS</p>
                        </div>
                      )}
                    </motion.div>
                  </Link>
                );
              })}

              {/* Footer shortcut hint */}
              {results.length > 0 && (
                <div className="px-4 py-2 flex items-center gap-2"
                  style={{ background: 'rgb(var(--bg-tertiary))' }}>
                  <span className="text-xs px-1.5 py-0.5 rounded font-mono"
                    style={{ background: 'rgb(var(--border-color))', color: 'rgb(var(--text-muted))' }}>↵</span>
                  <span className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>to open · </span>
                  <span className="text-xs px-1.5 py-0.5 rounded font-mono"
                    style={{ background: 'rgb(var(--border-color))', color: 'rgb(var(--text-muted))' }}>Esc</span>
                  <span className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>to clear</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Dark Mode Toggle */}
        <motion.button
          id="theme-toggle"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="p-2 rounded-xl transition-colors relative overflow-hidden"
          style={{
            background: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(0,0,0,0.05)',
            color: isDark ? 'rgb(129,140,248)' : 'rgb(71,85,105)',
          }}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <motion.div
            key={isDark ? 'moon' : 'sun'}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </motion.div>
        </motion.button>


        {/* User Dropdown */}
        <div className="relative" data-user-menu>
          <button
            id="user-menu"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl transition-colors"
            style={{ background: 'rgb(var(--bg-tertiary))' }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, rgb(99,102,241), rgb(168,85,247))', color: 'white' }}>
              {user?.initials || user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="hidden sm:block text-sm font-medium mr-1"
              style={{ color: 'rgb(var(--text-primary))' }}>
              {user?.name?.split(' ')[0] || 'User'}
            </span>
            <ChevronDown size={14} style={{ color: 'rgb(var(--text-muted))' }} />
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute right-0 top-12 w-52 rounded-xl shadow-xl overflow-hidden z-50"
                style={{
                  background: 'rgb(var(--card-bg))',
                  border: '1px solid rgb(var(--border-color))',
                }}
              >
                <div className="px-4 py-3" style={{ borderBottom: '1px solid rgb(var(--border-color))' }}>
                  <p className="text-sm font-semibold" style={{ color: 'rgb(var(--text-primary))' }}>{user?.name}</p>
                  <p className="text-xs truncate" style={{ color: 'rgb(var(--text-muted))' }}>{user?.email}</p>
                </div>
                <div className="py-1">
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                    style={{ color: 'rgb(var(--text-secondary))' }}
                    onClick={() => { setDropdownOpen(false); router.push('/dashboard/profile'); }}
                  >Profile</button>
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                    style={{ color: 'rgb(var(--text-secondary))' }}
                    onClick={() => { setDropdownOpen(false); router.push('/dashboard/settings'); }}
                  >Settings</button>
                  <div style={{ borderTop: '1px solid rgb(var(--border-color))', margin: '4px 0' }} />
                  <button onClick={logout}
                    className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-red-500/10"
                    style={{ color: 'rgb(239,68,68)' }}>
                    Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
