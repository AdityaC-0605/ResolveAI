import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Zap, Layers, BookOpen,
  BarChart3, ChevronLeft, ChevronRight, Activity,
} from 'lucide-react'

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard',      exact: true },
  { to: '/classify',  icon: Zap,             label: 'Classify'               },
  { to: '/batch',     icon: Layers,          label: 'Batch'                  },
  { to: '/knowledge', icon: BookOpen,        label: 'Knowledge Base'         },
  { to: '/analytics', icon: BarChart3,       label: 'Analytics'              },
]

export default function Sidebar({ health }) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  const statusColor = health?.status === 'healthy'  ? 'bg-mint'
                    : health?.status === 'degraded' ? 'bg-amber-400'
                    : 'bg-coral'

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative flex flex-col h-screen shrink-0 overflow-hidden"
      style={{ background: 'transparent' }}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-4 py-6">
        <div className="relative shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-teal-500/10 border border-teal-500/20">
          <span className="font-bold text-teal-400 text-sm">NT</span>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <p className="font-bold text-base leading-tight text-gradient-primary">ResolveAI</p>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">Hybrid RAG</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label, exact }) => {
          const isActive = exact ? location.pathname === to : location.pathname.startsWith(to)
          return (
            <NavLink key={to} to={to}>
              <motion.div
                className={`nav-item ${isActive ? 'active' : ''}`}
                whileHover={{ x: collapsed ? 0 : 2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                <div className={`shrink-0 ${isActive ? 'text-mint' : 'text-slate-600'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-display"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && !collapsed && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="ml-auto w-1 h-1 rounded-full bg-mint"
                  />
                )}
              </motion.div>
            </NavLink>
          )
        })}
      </nav>

      {/* System health */}
      <div className="px-2 pb-4 pt-3 space-y-2 mt-auto">
        {health && (
          <div className={`flex items-center gap-3 px-3 py-2 rounded-xl ${collapsed ? 'justify-center' : ''}`}>
            <div className="relative shrink-0">
              <div className={`w-2 h-2 rounded-full ${statusColor}`} />
              <div className={`absolute inset-0 w-2 h-2 rounded-full ${statusColor} animate-ping opacity-50`} />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p className="text-xs font-mono text-slate-400">
                    {health.status} · {health.vector_db_count} docs
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="btn-ghost w-full flex items-center justify-center py-2 text-slate-600 hover:text-slate-300"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
        </button>
      </div>
    </motion.aside>
  )
}