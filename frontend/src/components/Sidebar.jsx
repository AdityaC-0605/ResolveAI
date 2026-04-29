import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Zap, Layers, BookOpen,
  BarChart3, ChevronLeft, ChevronRight, Activity,
  Home, X
} from 'lucide-react'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/classify', icon: Zap, label: 'Classify' },
  { to: '/batch', icon: Layers, label: 'Batch Processing' },
  { to: '/knowledge', icon: BookOpen, label: 'Knowledge Base' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
]

export default function Sidebar({ health }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const statusColor = health?.status === 'healthy' ? 'bg-cyan-400'
    : health?.status === 'degraded' ? 'bg-amber-400'
    : 'bg-pink-500'

  const sidebarContent = (
    <motion.div
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative flex flex-col h-full glass-card rounded-2xl mx-3 my-3 overflow-hidden"
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-4 py-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20">
          <span className="font-bold text-white text-sm">RA</span>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="font-bold text-lg leading-tight text-white">ResolveAI</p>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">Hybrid RAG</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ to, icon: Icon, label, exact }) => {
          const isActive = exact ? location.pathname === to : location.pathname.startsWith(to)
          return (
            <NavLink key={to} to={to} onClick={() => setMobileOpen(false)}>
              <motion.div
                className={`nav-item ${isActive ? 'active' : ''}`}
                whileHover={{ x: collapsed ? 0 : 4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                  ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-slate-500'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium truncate"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && !collapsed && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400"
                  />
                )}
              </motion.div>
            </NavLink>
          )
        })}
      </nav>

      {/* System Status */}
      <div className="px-3 pb-4 pt-2 space-y-2 mt-auto">
        {health && (
          <div className={`glass-subtle flex items-center gap-3 px-3 py-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="relative shrink-0">
              <div className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
              <div className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${statusColor} animate-ping opacity-60`} />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-hidden">
                  <p className="text-xs font-mono text-slate-400 truncate">
                    {health.status} · {health.vector_db_count} vectors
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  )

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg glass-card"
      >
        <Home className="w-5 h-5 text-slate-400" />
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -100 }}
              animate={{ x: 0 }}
              exit={{ x: -100 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-72"
            >
              {sidebarContent}
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}