import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Zap, Layers, BookOpen, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/classify', icon: Zap, label: 'Classify' },
  { to: '/batch', icon: Layers, label: 'Batch' },
  { to: '/knowledge', icon: BookOpen, label: 'Knowledge' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
]

function Mark({ dark = false }) {
  const bg = dark ? 'var(--bg-root)' : 'var(--accent)'
  const fg = dark ? 'var(--accent)' : '#172112'
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md" style={{ background: bg }}>
      <svg viewBox="0 0 18 18" fill="none" width="16" height="16" aria-hidden="true">
        <path d="M4 9h4.8M8.8 9l3.4-4.2M8.8 9l3.4 4.2" stroke={fg} strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="4" cy="9" r="2" fill={fg} />
        <circle cx="13" cy="4" r="2" fill={fg} />
        <circle cx="13" cy="14" r="2" fill={fg} />
      </svg>
    </div>
  )
}

export default function Sidebar({ health }) {
  const [col, setCol] = useState(false)
  const loc = useLocation()
  const ok = health?.status === 'healthy'

  return (
    <motion.aside
      animate={{ width: col ? 64 : 240 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="relative z-20 flex h-screen shrink-0 flex-col overflow-hidden"
      style={{ background: 'rgba(18, 16, 13, 0.94)', borderRight: '1px solid var(--edge-soft)' }}
    >
      <div className="flex items-center gap-3 border-b px-4 py-4" style={{ borderColor: 'var(--edge-soft)' }}>
        <Mark />
        <AnimatePresence>
          {!col && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ type: 'spring', stiffness: 320, damping: 30 }}>
              <p className="type-body font-semibold text-ink">ResolveAI</p>
              <p className="type-micro text-flint">Hybrid complaint intelligence</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {NAV.map(({ to, icon: Icon, label, exact }) => {
          const active = exact ? loc.pathname === to : loc.pathname.startsWith(to)
          return (
            <NavLink key={to} to={to}>
              <motion.div whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 500, damping: 28 }} className={`nav-link ${active ? 'active' : ''} ${col ? 'justify-center px-2' : ''}`}>
                <Icon className="h-4 w-4 shrink-0" />
                <AnimatePresence>
                  {!col && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </NavLink>
          )
        })}
      </nav>

      <div className="space-y-2 border-t px-2 py-4" style={{ borderColor: 'var(--edge-soft)' }}>
        <div className={`flex items-center gap-2 rounded-md px-3 py-2 ${col ? 'justify-center' : ''}`} style={{ background: 'rgba(238, 231, 214, 0.025)' }}>
          <motion.div
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: ok ? 'var(--accent)' : 'var(--danger)' }}
            animate={{ scale: ok ? [1, 1.18, 1] : 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18, repeat: ok ? Infinity : 0, repeatType: 'mirror' }}
          />
          <AnimatePresence>
            {!col && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="type-micro text-flint">
                {ok ? 'Online' : 'Degraded'} · {health?.vector_db_count ?? 0} docs
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <button onClick={() => setCol(c => !c)} className="btn w-full">
          {col ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span>Collapse</span></>}
        </button>
      </div>
    </motion.aside>
  )
}
