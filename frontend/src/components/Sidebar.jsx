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
      animate={{ width: col ? 56 : 220 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="flex flex-col h-screen shrink-0 overflow-hidden relative z-20"
      style={{ background: '#0A0A0B', borderRight: '1px solid #1E1E20' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: '#1E1E20' }}>
        <div className="w-6 h-6 shrink-0 flex items-center justify-center rounded"
          style={{ background: '#FAFAFA' }}>
          <svg viewBox="0 0 16 16" fill="none" width="12" height="12">
            <circle cx="4"  cy="8"  r="2" fill="#0A0A0B" />
            <circle cx="12" cy="4"  r="2" fill="#0A0A0B" />
            <circle cx="12" cy="12" r="2" fill="#0A0A0B" />
            <line x1="6"  y1="7"  x2="10" y2="5"  stroke="#0A0A0B" strokeWidth="1" />
            <line x1="6"  y1="9"  x2="10" y2="11" stroke="#0A0A0B" strokeWidth="1" />
          </svg>
        </div>
        <AnimatePresence>
          {!col && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <p className="text-[13px] font-semibold text-quartz tracking-tight leading-none">ResolveAI</p>
              <p className="text-[10px] text-flint tracking-wide mt-1">Hybrid RAG v2</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {NAV.map(({ to, icon: Icon, label, exact }) => {
          const active = exact ? loc.pathname === to : loc.pathname.startsWith(to)
          return (
            <NavLink key={to} to={to}>
              <div className={`nav-link ${active ? 'active' : ''} ${col ? 'justify-center px-1' : ''}`}>
                <Icon className="w-4 h-4 shrink-0" />
                <AnimatePresence>
                  {!col && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-sm tracking-wide">{label}</motion.span>
                  )}
                </AnimatePresence>
              </div>
            </NavLink>
          )
        })}
      </nav>

      {/* Status + collapse */}
      <div className="px-2 pb-4 border-t pt-3 space-y-1" style={{ borderColor: '#1E1E20' }}>
        <div className={`flex items-center gap-2 px-2 py-2 ${col ? 'justify-center' : ''}`}>
          <div className="relative shrink-0 w-2 h-2">
            <div className="absolute inset-0 rounded-full" style={{ background: ok ? '#059669' : '#E11D48' }} />
            <div className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ background: ok ? '#059669' : '#E11D48' }} />
          </div>
          <AnimatePresence>
            {!col && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-[11px] font-medium text-flint tracking-wide">
                {ok ? 'Online' : 'Degraded'} · {health?.vector_db_count ?? 0} docs
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <button onClick={() => setCol(c => !c)}
          className="w-full flex items-center justify-center gap-2 px-2 py-2 text-slate hover:text-quartz transition-colors text-[11px] font-medium rounded hover:bg-[#121214]">
          {col ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
        </button>
      </div>
    </motion.aside>
  )
}