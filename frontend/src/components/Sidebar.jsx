import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Zap, Layers, BookOpen, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/classify',  icon: Zap,             label: 'Classify'              },
  { to: '/batch',     icon: Layers,          label: 'Batch'                 },
  { to: '/knowledge', icon: BookOpen,        label: 'Knowledge'             },
  { to: '/analytics', icon: BarChart3,       label: 'Analytics'             },
]

export default function Sidebar({ health }) {
  const [col, setCol] = useState(false)
  const loc = useLocation()
  const ok = health?.status === 'healthy'

  return (
    <motion.aside
      animate={{ width: col ? 52 : 200 }}
      transition={{ type: 'spring', stiffness: 340, damping: 34 }}
      className="flex flex-col h-screen shrink-0 overflow-hidden"
      style={{ background: '#0a0c14', borderRight: '1px solid #1e2334' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 py-4 border-b border-border">
        <div className="w-7 h-7 shrink-0 flex items-center justify-center"
          style={{ background: '#d4f43c', borderRadius: 1 }}>
          <svg viewBox="0 0 16 16" fill="none" width="12" height="12">
            <circle cx="4"  cy="8"  r="2" fill="#07080d" />
            <circle cx="12" cy="4"  r="2" fill="#07080d" />
            <circle cx="12" cy="12" r="2" fill="#07080d" />
            <line x1="6"  y1="7"  x2="10" y2="5"  stroke="#07080d" strokeWidth="1" />
            <line x1="6"  y1="9"  x2="10" y2="11" stroke="#07080d" strokeWidth="1" />
          </svg>
        </div>
        <AnimatePresence>
          {!col && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <p className="text-[11px] font-mono font-semibold text-snow tracking-widest uppercase">ResolveAI</p>
              <p className="text-[9px] font-mono text-dim tracking-widest">Hybrid RAG v2</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-1.5 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label, exact }) => {
          const active = exact ? loc.pathname === to : loc.pathname.startsWith(to)
          return (
            <NavLink key={to} to={to}>
              <div className={`nav-link ${active ? 'active' : ''} ${col ? 'justify-center px-1' : ''}`}>
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <AnimatePresence>
                  {!col && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-[11px] font-mono tracking-widest uppercase">{label}</motion.span>
                  )}
                </AnimatePresence>
              </div>
            </NavLink>
          )
        })}
      </nav>

      {/* Status + collapse */}
      <div className="px-1.5 pb-3 border-t border-border pt-2 space-y-1">
        <div className={`flex items-center gap-2 px-2 py-1.5 ${col ? 'justify-center' : ''}`}>
          <div className="relative shrink-0 w-1.5 h-1.5">
            <div className="absolute inset-0 rounded-full" style={{ background: ok ? '#d4f43c' : '#ff4d6a' }} />
            <div className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ background: ok ? '#d4f43c' : '#ff4d6a' }} />
          </div>
          <AnimatePresence>
            {!col && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-[9px] font-mono text-dim uppercase tracking-widest">
                {ok ? 'online' : 'degraded'} · {health?.vector_db_count ?? 0} docs
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <button onClick={() => setCol(c => !c)}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-dim hover:text-ghost transition-colors text-[10px] font-mono">
          {col ? <ChevronRight className="w-3 h-3" /> : <><ChevronLeft className="w-3 h-3" /><span>Collapse</span></>}
        </button>
      </div>
    </motion.aside>
  )
}