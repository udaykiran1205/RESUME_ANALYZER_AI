'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Upload, BarChart3, Lightbulb, FileText,
  Settings, ChevronLeft, ChevronRight, Zap, Target,
  Star, TrendingUp, LogOut, X, Sparkles, UserCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { label: 'Dashboard',    href: '/dashboard',             icon: LayoutDashboard, badge: null },
  { label: 'Upload Resume', href: '/dashboard/upload',      icon: Upload,          badge: 'New' },
  { label: 'ATS Analysis', href: '/dashboard/ats',         icon: Target,          badge: null },
  { label: 'AI Analysis',  href: '/dashboard/ai-analysis', icon: Sparkles,        badge: 'AI' },
  { label: 'Suggestions',  href: '/dashboard/suggestions', icon: Lightbulb,       badge: null },
  { label: 'AI Summary',   href: '/dashboard/summary',     icon: Star,            badge: null },
  { label: 'Reports',      href: '/dashboard/reports',     icon: FileText,        badge: null },
  { label: 'Analytics',    href: '/dashboard/analytics',   icon: TrendingUp,      badge: null },
];

const bottomItems = [
  { label: 'Profile',  href: '/dashboard/profile',  icon: UserCircle },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar({ mobileOpen, onClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const sidebarWidth = collapsed ? 72 : 260;

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`sidebar h-screen flex-shrink-0 flex flex-col relative z-50
          fixed md:sticky top-0 left-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          transition-transform duration-300 md:transition-none
        `}
        style={{ width: sidebarWidth }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-16 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2.5"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, rgb(99,102,241), rgb(168,85,247))' }}>
                  <Zap size={16} color="white" fill="white" />
                </div>
                <div>
                  <span className="font-bold text-sm" style={{ color: 'rgb(226,232,240)' }}>AI Resume</span>
                  <span className="block text-xs" style={{ color: 'rgb(99,102,241)' }}>Analyzer</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {collapsed && (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto"
              style={{ background: 'linear-gradient(135deg, rgb(99,102,241), rgb(168,85,247))' }}>
              <Zap size={16} color="white" fill="white" />
            </div>
          )}

          {/* Mobile close / desktop collapse */}
          <button
            onClick={() => { onClose ? onClose() : setCollapsed(!collapsed); }}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/5 md:block"
            style={{ color: 'rgb(148,163,184)' }}
          >
            <span className="md:hidden"><X size={18} /></span>
            <span className="hidden md:block">
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => onClose?.()}>
                <motion.div
                  whileHover={{ x: collapsed ? 0 : 2 }}
                  className={`sidebar-item ${isActive ? 'active' : ''}`}
                  title={collapsed ? item.label : ''}
                  style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
                >
                  <item.icon size={18} className="flex-shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -5 }}
                        className="text-sm font-medium flex-1"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {!collapsed && item.badge && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                      style={{
                        background: item.badge === 'AI' ? 'rgba(168,85,247,0.2)' : 'rgba(99,102,241,0.2)',
                        color:      item.badge === 'AI' ? 'rgb(168,85,247)'       : 'rgb(129,140,248)',
                      }}>
                      {item.badge}
                    </span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="px-3 pb-4 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
          {bottomItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => onClose?.()}>
              <div className={`sidebar-item ${pathname === item.href ? 'active' : ''}`}
                style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
                <item.icon size={18} className="flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </div>
            </Link>
          ))}

          {/* Logout */}
          <button
            onClick={logout}
            className="sidebar-item w-full text-left transition-colors"
            style={{ justifyContent: collapsed ? 'center' : 'flex-start', color: 'rgb(239,68,68)' }}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Logout</span>}
          </button>

          {/* User Avatar */}
          {!collapsed && user && (
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl mt-2"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, rgb(99,102,241), rgb(168,85,247))', color: 'white' }}>
                {user.initials || user.name?.[0]?.toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate" style={{ color: 'rgb(226,232,240)' }}>{user.name}</p>
                <p className="text-xs truncate" style={{ color: 'rgb(100,116,139)' }}>{user.email}</p>
              </div>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}
