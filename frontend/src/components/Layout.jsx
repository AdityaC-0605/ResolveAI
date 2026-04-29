import React, { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import { getHealth } from '../api'

export default function Layout() {
  const [health, setHealth] = useState(null)
  const location = useLocation()

  useEffect(() => {
    const poll = async () => {
      try { setHealth(await getHealth()) } catch {}
    }
    poll()
    const id = setInterval(poll, 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#030712]">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[800px] h-[800px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-60 -right-40 w-[900px] h-[900px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 left-1/3 -translate-x-1/3 -translate-y-1/3 w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.05) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      </div>

      <Sidebar health={health} />

      <main className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="min-h-full"
          >
            <Outlet context={{ health }} />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}